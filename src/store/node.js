// Minimal Freenet client for Freetree: one WebSocket to the node, the log contract's address, get / put / update.
// Ported from Radica's ui/src/network.ts (kept to the same calls, none of its queues, reconnect or legacy lookups).
import {
  ContractContainer, ContractKey, ContractType, DeltaUpdate, FreenetWsApi, GetRequest, PutRequest, UpdateData,
  UpdateDataType, UpdateRequest, WasmContractV1,
} from '@freenetorg/freenet-stdlib';
import { ContractCodeT } from '@freenetorg/freenet-stdlib/common';
import { RelatedContractsT } from '@freenetorg/freenet-stdlib/client-request';
import { blake3 } from '@noble/hashes/blake3.js';

const TIMEOUT_MS = 45000; // a get/put for a contract the node does not have goes looking on the network
const enc = new TextEncoder();
const asBytes = (b) => b;
const toU8 = (s) => (s instanceof Uint8Array ? s : new Uint8Array(s));

const withTimeout = (p) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('Freenet request timeout')), TIMEOUT_MS))]);

/** The node's WebSocket: same host when served by the node (web container), else the default local node. */
export function wsEndpoint(loc = globalThis.location) {
  const onNode = loc && (loc.port === '7509' || loc.pathname.includes('/v1/contract/'));
  const host = onNode ? loc.host : '127.0.0.1:7509';
  return {
    url: new URL(`${loc?.protocol === 'https:' ? 'wss' : 'ws'}://${host}/v1/contract/command`),
    // "" not undefined: the stdlib would read document.cookie, which throws in the sandboxed iframe
    token: new URLSearchParams(loc?.search ?? '').get('authToken') ?? '',
  };
}

/** The app's path, which the contract params carry: "…/<key>", "…/<key>/" and "…/<key>/index.html" are one app. */
export function appPath(loc = globalThis.location) {
  const m = /^\/v[12]\/contract\/web\/[^/]+/.exec(loc?.pathname ?? '');
  return m ? `${m[0]}/` : (loc?.pathname ?? '/');
}

let apiP;
function connect() {
  if (apiP) return apiP;
  let attempt;
  apiP = withTimeout(new Promise((resolve, reject) => {
    const { url, token } = wsEndpoint();
    const api = (attempt = new FreenetWsApi(url, {
      onContractPut() {}, onContractGet() {}, onContractUpdate() {}, onContractUpdateNotification() {}, onContractNotFound() {},
      onDelegateResponse() {},
      onErr: (e) => console.warn('[Freenet]', e?.cause ?? e),
      onOpen: () => resolve(api),
      onClose: () => { apiP = undefined; reject(new Error('Freenet WebSocket closed')); },
    }, token));
  })).catch((e) => {
    apiP = undefined;
    attempt?.ws?.close(); // a half-open socket would stay connected
    throw e;
  });
  return apiP;
}

// ---- the log contract's address ----
let codeP;
/** log.wasm, fetched next to the page (relative path: works under /v1/contract/web/<id>/). Its bytes fix the address. */
export function logCode(url = new URL('js/wasm/log.wasm', globalThis.location?.href).href) {
  return (codeP ??= fetch(url).then((r) => {
    if (!r.ok) throw new Error(`Cannot load ${url}: HTTP ${r.status}`);
    return r.arrayBuffer();
  }).then((b) => { const code = new Uint8Array(b); return { code, hash: blake3(code) }; }).catch((e) => { codeP = undefined; throw e; }));
}

/** Contract parameters of a persona's tree log: UTF-8 `radica/freetree/<persona>|<app path>`. */
export const treeParams = (personaHex, path) => enc.encode(`radica/freetree/${personaHex}|${path}`);

/** key = (blake3(code hash || params), code hash), as freenet-stdlib's ContractKey::from_params_and_code. */
export function keyOf(hash, params) {
  const buf = new Uint8Array(hash.length + params.length);
  buf.set(hash, 0);
  buf.set(params, hash.length);
  return new ContractKey(blake3(buf), hash);
}

const treeKey = async (personaHex, path) => keyOf((await logCode()).hash, treeParams(personaHex, path));

/** The log's entries on the network ({ "<author>:<id>": entry }), or null when nobody published it yet. */
export async function getEntries(personaHex, path = appPath()) {
  const api = await connect();
  const key = await treeKey(personaHex, path);
  try {
    const r = await withTimeout(api.get(new GetRequest(key, false, false)));
    return r.state.length ? JSON.parse(new TextDecoder().decode(toU8(r.state))).entries ?? {} : null;
  } catch (e) {
    if (/not found/i.test(String(e))) return null;
    throw e;
  }
}

/** Send entries to the log: a put (with the code) the first time, an update after. The contract merges them and
 *  refuses the whole send if anything is forged. */
export async function pushEntries(personaHex, entries, path = appPath()) {
  const api = await connect();
  const key = await treeKey(personaHex, path);
  const bytes = asBytes(enc.encode(JSON.stringify({ entries })));
  const existing = await getEntries(personaHex, path).catch(() => null); // a lookup that times out: put anyway, the node merges
  if (existing === null) {
    const { code, hash } = await logCode();
    const contract = new WasmContractV1(new ContractCodeT(asBytes(code), asBytes(hash)), asBytes(treeParams(personaHex, path)), key);
    await withTimeout(api.put(new PutRequest(new ContractContainer(ContractType.WasmContractV1, contract), bytes, new RelatedContractsT(), true)));
    return;
  }
  await withTimeout(api.update(new UpdateRequest(key, new UpdateData(UpdateDataType.DeltaUpdate, new DeltaUpdate(bytes)))));
}
