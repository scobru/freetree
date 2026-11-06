import { FreenetWsApi, GetRequest, ContractKey } from '@freenetorg/freenet-stdlib';
import { blake3 } from '@noble/hashes/blake3.js';

function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

function decodeCbor(bytes) {
  const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let i = 0;
  const arg = (info) => {
    if (info < 24) return info;
    const n = info === 24 ? 1 : info === 25 ? 2 : info === 26 ? 4 : info === 27 ? 8 : 0;
    if (!n) throw new Error('unsupported CBOR length');
    let x = 0;
    for (let k = 0; k < n; k++) x = x * 256 + bytes[i + k];
    i += n;
    return x;
  };
  const item = () => {
    if (i >= bytes.length) throw new Error('truncated CBOR');
    const b = bytes[i++];
    const major = b >> 5;
    const info = b & 31;
    if (major === 7) {
      if (info === 20) return false;
      if (info === 21) return true;
      if (info === 22 || info === 23) return null;
      if (info === 25) return (i += 2), null;
      if (info === 26) return (i += 4), v.getFloat32(i - 4);
      if (info === 27) return (i += 8), v.getFloat64(i - 8);
      throw new Error('unsupported CBOR simple value');
    }
    const n = arg(info);
    switch (major) {
      case 0: return n;
      case 1: return -1 - n;
      case 2: return bytes.slice(i, (i += n));
      case 3: return new TextDecoder().decode(bytes.slice(i, (i += n)));
      case 4: return Array.from({ length: n }, item);
      case 5: {
        const m = {};
        for (let k = 0; k < n; k++) {
          const key = item();
          m[String(key)] = item();
        }
        return m;
      }
      default: return item();
    }
  };
  return item();
}

function parseSite(stateBytes) {
  try {
    const s = decodeCbor(stateBytes);
    const cfg = s?.config?.config;
    if (typeof cfg?.name !== 'string' || typeof s.pages !== 'object') return null;
    const pages = Object.entries(s.pages)
      .filter(([, p]) => typeof p?.title === 'string')
      .map(([id, p]) => ({
        id: Number(id),
        title: p.title,
        content: typeof p.content === 'string' ? p.content : '',
        order: Number(p.order) || 0
      }))
      .sort((a, b) => a.order - b.order || a.id - b.id);
    return {
      name: cfg.name,
      description: typeof cfg.description === 'string' ? cfg.description : '',
      pages
    };
  } catch (e) {
    return null;
  }
}

// BUNDLED_SITE_CODE matches Delta's current site_contract.wasm
const BUNDLED_SITE_CODE = "90bc44f4f2e76aeb5aec732920c1d73ffa3d108f6e661ad84474774b246fabe3";

function siteParams(prefix) {
  const p = new TextEncoder().encode(prefix);
  return new Uint8Array([0xa1, 0x66, ...new TextEncoder().encode("prefix"), 0x60 + p.length, ...p]);
}

function computeSiteKey(codeHashHex, prefix) {
  const codeHash = hexToBytes(codeHashHex);
  const params = siteParams(prefix);
  const buf = new Uint8Array(codeHash.length + params.length);
  buf.set(codeHash, 0);
  buf.set(params, codeHash.length);
  const instance = blake3(buf);
  return new ContractKey(instance, codeHash);
}

class FreenetDeltaBridge {
  constructor() {
    this.api = null;
    this.connecting = null;
    this.status = 'disconnected';
    this.statusListeners = new Set();
    this.cache = new Map();
  }

  onStatus(fn) {
    this.statusListeners.add(fn);
    try { fn(this.status); } catch {}
  }

  setStatus(s) {
    this.status = s;
    for (const fn of this.statusListeners) {
      try { fn(s); } catch {}
    }
  }

  getWsUrl() {
    try {
      const loc = window.location;
      const isHttps = loc.protocol === 'https:';
      const host = loc.host || '127.0.0.1:7509';
      return `${isHttps ? 'wss:' : 'ws:'}//${host}/v1/contract/command`;
    } catch {
      return 'ws://127.0.0.1:7509/v1/contract/command';
    }
  }

  getAuthToken() {
    try {
      const search = window.location.search || '';
      const m = search.match(/[?&]authToken=([^&]+)/);
      return m ? decodeURIComponent(m[1]) : '';
    } catch {
      return '';
    }
  }

  async connect() {
    if (this.api) return this.api;
    if (this.connecting) return this.connecting;

    this.setStatus('connecting');
    this.connecting = new Promise((resolve, reject) => {
      try {
        const url = new URL(this.getWsUrl());
        const authToken = this.getAuthToken();
        const api = new FreenetWsApi(url, {
          onContractPut() {},
          onContractGet() {},
          onContractUpdate() {},
          onContractUpdateNotification() {},
          onDelegateResponse() {},
          onContractNotFound() {},
          onErr: (err) => {
            console.warn('[FreenetDelta] WS Error:', err);
          },
          onOpen: () => {
            this.api = api;
            this.setStatus('connected');
            resolve(api);
          },
          onClose: () => {
            this.api = null;
            this.connecting = null;
            this.setStatus('disconnected');
            reject(new Error('WebSocket closed'));
          }
        }, authToken);
      } catch (err) {
        this.setStatus('disconnected');
        this.connecting = null;
        reject(err);
      }
    });

    return this.connecting;
  }

  async fetchDeltaSite(prefix, timeoutMs = 8000) {
    if (!prefix || !/^[1-9A-HJ-NP-Za-km-z]{10}$/.test(prefix)) return null;

    if (this.cache.has(prefix)) {
      return this.cache.get(prefix);
    }

    try {
      const api = await this.connect();
      const key = computeSiteKey(BUNDLED_SITE_CODE, prefix);
      const req = new GetRequest(key, false, false);

      const res = await Promise.race([
        api.get(req),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeoutMs))
      ]);

      if (res && res.state && res.state.length > 0) {
        const rawBytes = new Uint8Array(res.state);
        const site = parseSite(rawBytes);
        if (site && site.pages && site.pages.length > 0) {
          const pagesObj = {};
          for (const p of site.pages) {
            pagesObj[p.title] = p.content;
          }

          const result = {
            prefix,
            name: site.name || `Delta Site (${prefix})`,
            handle: `@${site.name ? site.name.toLowerCase().replace(/[^a-z0-9_]+/g, '') : prefix}`,
            bio: site.description || '',
            pages: pagesObj
          };

          this.cache.set(prefix, result);
          return result;
        }
      }
    } catch (e) {
      console.warn('[FreenetDelta] Fetch error for prefix:', prefix, e.message || e);
    }

    return null;
  }
}

const freenetDelta = new FreenetDeltaBridge();
if (typeof window !== 'undefined') {
  window.freenetDelta = freenetDelta;
  setTimeout(() => freenetDelta.connect().catch(() => {}), 50);
}

export default freenetDelta;
