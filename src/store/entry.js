// A Freetree tree lives in a Radica log contract (log.wasm, unchanged): one entry per persona, signed by the app key
// Viso derived for this app, with the persona's delegation certificate. Formats must match Radica's
// log-contract/src/lib.rs (`entry_msg`, `check`) and whoiam-delegation (`connect_message`, `check`).
import { ed25519 } from '@noble/curves/ed25519.js';
import { hex, unhex } from './seal.js';

const enc = new TextEncoder();

/** Log name of one persona's tree. */
export const treeLog = (personaHex) => `freetree/${personaHex}`;
/** Entry id: one per persona, a newer entry (by ts) replaces the older. */
export const TREE_ID = 'tree';
export const MAX_BODY = 64 * 1024; // log contract limit

/** UTF-8 hex of the contract parameters `radica/<log>|<app path>`: they tie an entry to one log of one app. */
export const paramsHex = (log, appPath) => hex(enc.encode(`radica/${log}|${appPath}`));

/** What the app key signs. */
export const entryMessage = (log, appPath, e) =>
  `radica/log/v1:${paramsHex(log, appPath)}:${e.author}:${e.id}:${e.ts}:${e.body}`;

/** whoiam's "I consent to identify to this app" message, which the persona signs: it is also the delegation. */
export function connectMessage(pk, base, challenge, ts) {
  const b = enc.encode(base), c = enc.encode(challenge);
  const out = new Uint8Array(17 + 32 + 4 + b.length + 4 + c.length + 8);
  const dv = new DataView(out.buffer);
  let o = 0;
  out.set(enc.encode('whoiam-connect-v1'), o); o += 17;
  out.set(pk, o); o += 32;
  dv.setUint32(o, b.length, true); o += 4;
  out.set(b, o); o += b.length;
  dv.setUint32(o, c.length, true); o += 4;
  out.set(c, o); o += c.length;
  dv.setBigUint64(o, BigInt(ts), true);
  return out;
}

/** Check that `cert` is `persona`'s delegation of `appPubHex` for the app at `appPath` (same rules as the contract). */
export function checkCert(personaHex, appPath, appPubHex, cert) {
  const path = /^https?:\/\/[^/]+(\/.*)$/.exec(cert.base)?.[1];
  if (path !== appPath) throw new Error('certificate is for another app');
  const [prefix, appKey, nonce, ...rest] = String(cert.challenge).split('.');
  if (prefix !== 'wd1' || !nonce || rest.length || appKey !== appPubHex) throw new Error('not a delegation of this key');
  const pk = unhex(personaHex);
  const ok = ed25519.verify(unhex(cert.sig), connectMessage(pk, cert.base, cert.challenge, cert.ts), pk, { zip215: false });
  if (!ok) throw new Error('bad delegation signature');
}

/** The persona's tree as a signed log entry. `tree` = { name, bio, md } (what the editor holds). */
export function signTree({ appSecretHex, personaHex, cert, appPath, tree, ts = Date.now() }) {
  const body = JSON.stringify({ type: 'tree', v: 1, name: tree.name ?? '', bio: tree.bio ?? '', md: tree.md ?? '' });
  if (enc.encode(body).length > MAX_BODY) throw new Error('tree is too big for the log (64 KB)');
  const e = { author: personaHex, id: TREE_ID, ts, body, sig: '', cert };
  e.sig = hex(ed25519.sign(enc.encode(entryMessage(treeLog(personaHex), appPath, e)), unhex(appSecretHex)));
  return e;
}

/** Newest valid tree of `personaHex` among the log's entries (anything unsigned or malformed is skipped). */
export function pickTree(entries, personaHex, appPath) {
  let best = null;
  for (const e of Object.values(entries ?? {})) {
    if (e?.author !== personaHex || e.id !== TREE_ID || !e.cert) continue;
    try {
      const app = e.cert.challenge.split('.')[1];
      checkCert(personaHex, appPath, app, e.cert);
      const ok = ed25519.verify(unhex(e.sig), enc.encode(entryMessage(treeLog(personaHex), appPath, e)), unhex(app), { zip215: false });
      const b = JSON.parse(e.body);
      if (!ok || b.type !== 'tree' || typeof b.md !== 'string') continue;
      if (!best || e.ts > best.e.ts || (e.ts === best.e.ts && e.sig > best.e.sig)) best = { e, tree: { name: String(b.name ?? ''), bio: String(b.bio ?? ''), md: b.md } };
    } catch {}
  }
  return best?.tree ?? null;
}
