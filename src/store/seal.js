// Viso's `key=v1` hands the per-app key back sealed (a URL ends up in browser history): we send a one-time X25519
// public key (`epk`), Viso answers `#esk=<viso_epk_hex>.<ciphertext_hex>`.
// X25519 ECDH -> HKDF-SHA256(salt = viso_epk || our_epk, info) -> AES-256-GCM, zero nonce, the signed challenge as AAD.
// Wire format: scobru/viso docs/dapp-integration.md (has a test vector for the key derivation).
import { x25519 } from '@noble/curves/ed25519.js';

const INFO = new TextEncoder().encode('viso connect v1 app secret');
export const hex = (b) => Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
export const unhex = (h) => Uint8Array.from(h.match(/../g) ?? [], (x) => parseInt(x, 16));

/** A fresh one-time keypair: send `pub` as `epk` (it is also the challenge nonce), keep `priv` until the reply. */
export function newEpk() {
  const priv = x25519.utils.randomSecretKey();
  return { priv: hex(priv), pub: hex(x25519.getPublicKey(priv)) };
}

/** HKDF step, exported for the known-answer test. */
export async function sealKey(shared, vEpk, ourEpk) {
  const ikm = await crypto.subtle.importKey('raw', shared, 'HKDF', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array([...vEpk, ...ourEpk]), info: INFO },
    ikm, { name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
}

/** Open Viso's `esk` with the private half of the `epk` we sent. `challenge` is the signed `wd1.<app key>.<nonce>`:
 *  its nonce must be our epk, and it is the AEAD associated data, so the box only opens for this sign-in.
 *  Returns the 32-byte app secret as hex. Throws on anything that does not fit. */
export async function openEsk(esk, privHex, challenge) {
  const [vEpk, ct] = String(esk).split('.');
  if (!/^[0-9a-f]{64}$/i.test(vEpk ?? '') || !/^[0-9a-f]{96}$/i.test(ct ?? '') || !/^[0-9a-f]{64}$/i.test(privHex)) {
    throw new Error('malformed key from Viso');
  }
  const priv = unhex(privHex);
  const ours = x25519.getPublicKey(priv);
  if (!String(challenge).endsWith(`.${hex(ours)}`)) throw new Error('Viso answered a different request');
  const key = await sealKey(x25519.getSharedSecret(priv, unhex(vEpk)), unhex(vEpk), ours);
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(12), additionalData: new TextEncoder().encode(challenge) }, key, unhex(ct));
  return hex(new Uint8Array(plain));
}
