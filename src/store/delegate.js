// The node's identity delegate (identity.wasm, the one Radica and FreeTunes use): a small private key/value store the
// node keeps for this app. The sandboxed page has no storage and loses the URL hash on the Viso redirect, so the
// one-time key and the session wait here. Optional: every call answers null / false when no delegate is there.
// Ported from Radica's ui/src/delegate.ts (identity delegate only).
import { FreenetWsApi, DelegateRequest } from '@freenetorg/freenet-stdlib';
import { ApplicationMessageT } from '@freenetorg/freenet-stdlib/common';
import {
  ApplicationMessagesT, ClientRequestT, ClientRequestType, DelegateCodeT, DelegateContainerT, DelegateKeyT,
  DelegateRequestType, DelegateType, InboundDelegateMsgT, InboundDelegateMsgType, RegisterDelegateT, WasmDelegateV1T,
} from '@freenetorg/freenet-stdlib/client-request';
import { blake3 } from '@noble/hashes/blake3.js';
import { wsEndpoint } from './node.js';

const TIMEOUT_MS = 8000;
const asBytes = (b) => b;
const ZERO_32 = asBytes(new Uint8Array(32));
const ZERO_24 = asBytes(new Uint8Array(24));
const enc = new TextEncoder();
const dec = new TextDecoder();

let waiters = [];
let apiP;
let chain = Promise.resolve();
let key;

function api() {
  return (apiP ??= new Promise((resolve, reject) => {
    const { url, token } = wsEndpoint();
    const a = new FreenetWsApi(url, {
      onContractPut() {}, onContractGet() {}, onContractUpdate() {}, onContractUpdateNotification() {}, onContractNotFound() {},
      onDelegateResponse: (r) => waiters.shift()?.resolve(r), // replies carry no id: one request at a time
      onErr: (e) => console.warn('[Freenet delegate]', e?.cause ?? e),
      onOpen: () => resolve(a),
      onClose: () => {
        apiP = key = undefined;
        waiters.splice(0).forEach((w) => w.reject(new Error('socket closed')));
        reject(new Error('socket closed'));
      },
    }, token);
  }));
}

function send(req) {
  const run = async () => {
    const a = await api(); // before the reply promise exists: a socket that never opens must not leave one rejected and unhandled
    const reply = new Promise((resolve, reject) => {
      const w = { resolve, reject };
      waiters.push(w);
      setTimeout(() => {
        const i = waiters.indexOf(w);
        if (i >= 0) { waiters.splice(i, 1); reject(new Error('delegate timeout')); }
      }, TIMEOUT_MS);
    });
    a.sendRequest(new ClientRequestT(ClientRequestType.DelegateRequest, req));
    return reply;
  };
  const p = chain.then(run);
  chain = p.catch(() => {});
  return p;
}

async function register(url) {
  const code = new Uint8Array(await (await fetch(url)).arrayBuffer());
  const hash = blake3(code);
  const k = new DelegateKeyT(asBytes(blake3(hash)), asBytes(hash));
  const wasm = new WasmDelegateV1T([], new DelegateCodeT(asBytes(code), asBytes(hash)), k);
  await send(new DelegateRequest(DelegateRequestType.RegisterDelegate,
    new RegisterDelegateT(new DelegateContainerT(DelegateType.WasmDelegateV1, wasm), ZERO_32, ZERO_24))); // node ignores cipher and nonce
  return k;
}

// duck-typed: bundlers can duplicate the SDK classes, which breaks instanceof
function payloadOf(r) {
  const m = r.values.map((v) => v.inbound).find((x) => Array.isArray(x?.payload) || x?.payload instanceof Uint8Array);
  if (!m) throw new Error('empty delegate reply');
  return m.payload instanceof Uint8Array ? m.payload : new Uint8Array(m.payload);
}

async function call(payload, wasmUrl = new URL('js/wasm/identity.wasm', globalThis.location?.href).href) {
  const k = await (key ??= register(wasmUrl)).catch((e) => { key = undefined; throw e; }); // try again next time
  const msg = new InboundDelegateMsgT(InboundDelegateMsgType.common_ApplicationMessage, new ApplicationMessageT(asBytes(enc.encode(JSON.stringify(payload))), [], false));
  const r = await send(new DelegateRequest(DelegateRequestType.ApplicationMessages, new ApplicationMessagesT(k, [], [msg])));
  const out = JSON.parse(dec.decode(payloadOf(r)));
  if (out.err) throw new Error(out.err);
  return out;
}

// the delegate takes only [A-Za-z0-9:-] keys
const kvKey = (k) => k.replace(/_/g, '-');

/** A small private value the node keeps for this app; null when it is missing or no delegate answers. */
export async function nodeGet(k) {
  try { return (await call({ op: 'get', key: kvKey(k) })).value ?? null; } catch (e) { console.warn('identity delegate unavailable:', e); return null; }
}

/** Keep a value; false when no delegate answers. */
export async function nodePut(k, value) {
  try { await call({ op: 'put', key: kvKey(k), value }); return true; } catch (e) { console.warn('identity delegate unavailable:', e); return false; }
}
