import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { ed25519, x25519 } from '@noble/curves/ed25519.js';
import { hex, unhex, newEpk, openEsk, sealKey } from '../src/store/seal.js';
import { connectMessage, checkCert, signTree, pickTree, paramsHex, treeLog } from '../src/store/entry.js';

const APP_PATH = '/v1/contract/web/4SC5QCzLzKWH9BSFFybivTynfBRkPw3PtXwegjXbPm8x/';
const BASE = `http://127.0.0.1:7509${APP_PATH}`;
const fill = (n) => new Uint8Array(32).fill(n);

test('seal: HKDF known answer from the Viso docs', async () => {
  const k = await sealKey(fill(1), fill(2), fill(3));
  assert.equal(hex(new Uint8Array(await crypto.subtle.exportKey('raw', k))), '19d4be8a0f28c60650e355bd8db0549ca0db302e5330c0c7353725981de879d2');
});

// What Viso does (ui/src/actions.rs seal_app_secret): ephemeral-static ECDH, same HKDF, zero nonce, challenge as AAD.
async function visoSeal(secret, clientEpk, challenge) {
  const vPriv = x25519.utils.randomSecretKey(), vEpk = x25519.getPublicKey(vPriv);
  const key = await sealKey(x25519.getSharedSecret(vPriv, clientEpk), vEpk, clientEpk);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: new Uint8Array(12), additionalData: new TextEncoder().encode(challenge) }, key, secret));
  return `${hex(vEpk)}.${hex(ct)}`;
}

test('seal: round trip, and it only opens for this sign-in', async () => {
  const epk = newEpk(), secret = fill(9), challenge = `wd1.${hex(ed25519.getPublicKey(secret))}.${epk.pub}`;
  const esk = await visoSeal(secret, unhex(epk.pub), challenge);
  assert.equal(await openEsk(esk, epk.priv, challenge), hex(secret));
  await assert.rejects(openEsk(esk, epk.priv, challenge.replace('wd1', 'wd2')));                      // AAD differs
  await assert.rejects(openEsk(esk, epk.priv, `wd1.${hex(ed25519.getPublicKey(secret))}.${'00'.repeat(32)}`), /different request/);
  await assert.rejects(openEsk(esk, newEpk().priv, challenge), /different request/);                  // not our key
  await assert.rejects(openEsk('zz', epk.priv, challenge), /malformed/);
});

function setup() {
  const personaSk = fill(0x11), appSk = fill(0x22), ts = 1794781500000;
  const personaHex = hex(ed25519.getPublicKey(personaSk)), appPub = hex(ed25519.getPublicKey(appSk));
  const challenge = `wd1.${appPub}.${'33'.repeat(32)}`;
  const cert = { base: BASE, challenge, ts, sig: hex(ed25519.sign(connectMessage(unhex(personaHex), BASE, challenge, ts), personaSk)) };
  return { personaSk, appSk, personaHex, appPub, cert, ts };
}
const tree = { name: 'Scobru è qui', bio: 'I made this', md: '## Me\n* [GH](https://github.com/scobru) - code' };

test('entry: signed tree is accepted, tampering is not', () => {
  const { appSk, personaHex, appPub, cert, ts } = setup();
  const e = signTree({ appSecretHex: hex(appSk), personaHex, cert, appPath: APP_PATH, tree, ts });
  checkCert(personaHex, APP_PATH, appPub, cert);
  assert.deepEqual(pickTree({ [`${e.author}:${e.id}`]: e }, personaHex, APP_PATH), tree);

  const forged = { ...e, body: e.body.replace('Scobru', 'Evil') };
  assert.equal(pickTree({ k: forged }, personaHex, APP_PATH), null);                                   // body not signed
  assert.equal(pickTree({ k: e }, hex(ed25519.getPublicKey(fill(0x44))), APP_PATH), null);              // someone else's
  assert.equal(pickTree({ k: e }, personaHex, '/v1/contract/web/other/'), null);                       // another app
  assert.throws(() => checkCert(personaHex, APP_PATH, hex(ed25519.getPublicKey(fill(0x55))), cert));    // another app key
  assert.equal(pickTree({ k: { ...e, cert: { ...cert, ts: cert.ts + 1 } } }, personaHex, APP_PATH), null); // cert tampered
});

test('entry: the newest tree wins; a too-big tree is refused', () => {
  const { appSk, personaHex, cert, ts } = setup(), sk = hex(appSk);
  const old = signTree({ appSecretHex: sk, personaHex, cert, appPath: APP_PATH, tree: { ...tree, name: 'old' }, ts });
  const neu = signTree({ appSecretHex: sk, personaHex, cert, appPath: APP_PATH, tree: { ...tree, name: 'new' }, ts: ts + 1 });
  assert.equal(pickTree({ a: neu, b: old }, personaHex, APP_PATH).name, 'new');
  assert.equal(pickTree({ a: old, b: neu }, personaHex, APP_PATH).name, 'new');
  assert.throws(() => signTree({ appSecretHex: sk, personaHex, cert, appPath: APP_PATH, tree: { ...tree, md: 'x'.repeat(70000) }, ts }), /too big/);
});

// Golden entry: deterministic (RFC 8032), and checked by the real Radica log contract (Rust `check`), see
// test/README.md. If this fails after an intended format change, regenerate with UPDATE_FIXTURE=1 and re-run Rust.
test('entry: golden fixture for the Rust contract check', () => {
  const { appSk, personaHex, cert, ts } = setup();
  const e = signTree({ appSecretHex: hex(appSk), personaHex, cert, appPath: APP_PATH, tree, ts });
  const fixture = { appPath: APP_PATH, log: treeLog(personaHex), paramsHex: paramsHex(treeLog(personaHex), APP_PATH), key: `${e.author}:${e.id}`, entry: e };
  const path = new URL('./fixtures/tree-entry.json', import.meta.url);
  if (process.env.UPDATE_FIXTURE) writeFileSync(path, JSON.stringify(fixture, null, 2) + '\n');
  assert.deepEqual(JSON.parse(readFileSync(path, 'utf8')), fixture);
});
