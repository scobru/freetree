# FREENET.md — Freetree Technical Specification

This document details how **Freetree** integrates with the Freenet platform and the local node gateway.

---

## 1. Webapp Architecture & Container Contract

Freetree is published as a static Web application hosted within Freenet's **generic web container contract** via `fdev website`.

### Stable Addressing (In-Place Upgrades)
A Freenet webapp address is derived from:
`ContractKey = BLAKE3(BLAKE3(web_container_contract.wasm) || publisher_verifying_key)`

- The code and parameters remain **constant** across versions.
- Updates are published by signing new archive states with an incremented `version: u32`.
- As a result, **Freetree's URL is permanent** and does not change between releases.

```bash
# Initial publish
fdev website publish . --key freetree

# Incremental release (same URL, higher monotonic version)
fdev website update . --key freetree
```

---

## 2. Gateway Sandbox CSP Compliance

Freenet isolates web applications inside sandboxed iframes governed by a strict Content Security Policy:

```
default-src <iframe-origin> 'unsafe-inline' 'unsafe-eval' blob: data:;
connect-src <iframe-origin> blob: data:
```

### Why Freetree is 100% Compliant:
1. **Zero CDN Dependencies**: No external stylesheet or script references to `cdn.jsdelivr.net`, `cdnjs`, or `fonts.googleapis.com`.
2. **Inline Vector Graphics**: All thumbnails and button icons are inline SVGs (`js/icons.js`), eliminating remote icon font fetches.
3. **Relative Asset Paths**: CSS, JS modules, and assets are referenced using relative paths (`css/styles.css`, `js/app.js`).
4. **Origin-Relative WebSocket**: WebSocket connections dynamically derive their target from `window.location`.

---

## 3. WebSocket Communication

Inside the Freenet gateway iframe:
- The outer shell holds authentication credentials and replaces `window.WebSocket` with a `postMessage`-based shim (`FreenetWebSocket`).
- The WebSocket URL is derived dynamically:
  ```
  ws://{window.location.host}/v1/contract/command?encodingProtocol=native
  ```
- The gateway shell injects the `authToken` automatically.
- In standalone/dev environments outside the gateway, the client falls back to `ws://127.0.0.1:7509/v1/contract/command?encodingProtocol=native` and handles connection state gracefully.

---

## 4. Sign in with Viso

Freetree has no accounts. The user signs in with a [Viso](https://github.com/scobru/viso) persona: Freetree bounces to the user's Viso (`?connect=v1&challenge=…&return=…`) and verifies the returned Ed25519 proof in WebCrypto (`js/viso.js`). The message signed is `"whoiam-connect-v1" | pk | u32le|origin+path| u32le|challenge | u64le time_ms`, so a proof only works for this app, once, within 10 minutes.

The personal tree (Markdown, one `* [Title](https://url) - description` per line) is stored in `localStorage` keyed by the proven public key. The sandboxed gateway iframe may block storage; `Export` always produces a portable `#data=` link.

## 5. Trees in a contract

With a `key=v1` sign-in the tree is stored in a Freenet contract instead of only in the link:

- **Contract**: Radica's `log-contract` (`js/wasm/log.wasm`, unchanged, pinned by `js/wasm/SHA256SUMS`). One log per
  persona, parameters `radica/freetree/<persona>|<app path>`, so it is a different instance from any Radica log.
  The address is `ContractKey::from_params_and_code`; JS and Rust agree (`test/address.test.mjs`).
- **Entry**: id `tree`, body `{type:"tree", v:1, name, bio, md}`, signed by the app key with the persona's
  delegation certificate (`whoiam-delegation`). The newest entry wins; deleting writes an empty tree (a contract
  entry cannot be removed).
- **Sign-in**: `connect=v1&challenge=<epk>&key=v1&epk=<epk>&base=<canonical base>&return=<page + hash>`. Viso answers with
  `wd1.<app key>.<epk>` signed by the persona and `#esk=` (the app key sealed to `epk`). The one-time private
  half of `epk` and, later, the session wait in the node's identity delegate (`js/wasm/identity.wasm`), because the
  sandboxed page has no storage.
- **Read** at load: the persona's newest valid entry; anything not signed by a delegated key, or with a bad
  certificate, is skipped. What is on screen (an opened link) is never replaced; it is saved if the contract has none.
- **Fallback**: no bundle, no node, no delegate or no app key from Viso: the classic sign-in and the `#data=` link.
- Build: `npm run build` bundles `src/store` into `js/store.bundle.js` (committed: publishing has no build step).
