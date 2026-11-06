# FREENET.md — Freetree Technical Specification

This document details how **Freetree** integrates with the Freenet platform, the Delta publishing contract, and the local node gateway.

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

## 4. Integration with Delta Publishing

[Delta](https://github.com/freenet/delta) sites are individual contract instances on Freenet.

### Delta Site Identification:
- **Site Prefix**: First 10 base58 characters of the site owner's Ed25519 public key.
- **Contract Parameters**: CBOR-encoded `SiteParameters { prefix: String }`.
- **Contract Key**: `BLAKE3(BLAKE3(site_contract.wasm) || params)`.
- **State Structure**:
  - `owner`: 32-byte verifying key.
  - `config`: `SignedConfig` (site title and description).
  - `pages`: `BTreeMap<PageId, Page>` where each `Page` contains:
    - `title: String`
    - `content: String` (Markdown text)
    - `updated_at: u64`
    - `order: u32`

### Delta Markdown Format Parsed by Freetree:
Freetree reads markdown formatted with headings and list items:
```markdown
# Site or Page Title

## Category Name
* [Link Title](URL) - Description
* [Internal Delta Link](http://127.0.0.1:7509/v1/contract/web/EqJ5YpEEV3XLqEvKWLQHFhGAac2qXzSUoE6k2zbdnXBr/#PREFIX)
* [[page_id|Delta Wiki Link]]
```

Freetree turns this into an interactive Linktree card with responsive pills, category dividers, and automatic icon classification.

