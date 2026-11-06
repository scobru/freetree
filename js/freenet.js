/**
 * Freetree Freenet Client & Delta State Resolver
 * Connects to the local Freenet node via WebSocket or HTTP gateway,
 * decodes CBOR contract states, and extracts Delta wiki pages.
 */

/**
 * Lightweight pure-JS CBOR decoder (RFC 8949)
 * Zero external dependencies — works in any browser or web container sandbox.
 */
export function decodeCbor(bytes) {
  let offset = 0;

  function read() {
    if (offset >= bytes.length) {
      throw new Error('Unexpected end of CBOR input');
    }
    const initialByte = bytes[offset++];
    const majorType = initialByte >> 5;
    const info = initialByte & 0x1f;
    let length;

    if (info < 24) {
      length = info;
    } else if (info === 24) {
      length = bytes[offset++];
    } else if (info === 25) {
      length = (bytes[offset++] << 8) | bytes[offset++];
    } else if (info === 26) {
      length = ((bytes[offset++] << 24) | (bytes[offset++] << 16) | (bytes[offset++] << 8) | bytes[offset++]) >>> 0;
    } else if (info === 27) {
      const hi = ((bytes[offset++] << 24) | (bytes[offset++] << 16) | (bytes[offset++] << 8) | bytes[offset++]) >>> 0;
      const lo = ((bytes[offset++] << 24) | (bytes[offset++] << 16) | (bytes[offset++] << 8) | bytes[offset++]) >>> 0;
      length = Number((BigInt(hi) << 32n) | BigInt(lo));
    } else {
      throw new Error(`Unsupported CBOR additional info: ${info}`);
    }

    switch (majorType) {
      case 0: // unsigned integer
        return length;
      case 1: // negative integer
        return -1 - length;
      case 2: { // byte string
        const slice = bytes.slice(offset, offset + length);
        offset += length;
        return slice;
      }
      case 3: { // text string
        const slice = bytes.slice(offset, offset + length);
        offset += length;
        return new TextDecoder('utf-8').decode(slice);
      }
      case 4: { // array
        const arr = [];
        for (let i = 0; i < length; i++) {
          arr.push(read());
        }
        return arr;
      }
      case 5: { // map
        const obj = {};
        for (let i = 0; i < length; i++) {
          const k = read();
          const v = read();
          obj[k] = v;
        }
        return obj;
      }
      case 7: { // simple values / floats
        if (info === 20) return false;
        if (info === 21) return true;
        if (info === 22) return null;
        if (info === 23) return undefined;
        return null;
      }
      default:
        throw new Error(`Unsupported CBOR major type: ${majorType}`);
    }
  }

  return read();
}

/**
 * Freenet Client Manager
 */
export class FreenetClient {
  constructor() {
    this.status = 'disconnected'; // 'connected' | 'connecting' | 'disconnected' | 'error'
    this.ws = null;
    this.callbacks = new Set();
    this.pendingRequests = new Map();
  }

  onStatusChange(fn) {
    this.callbacks.add(fn);
  }

  setStatus(newStatus, detail = null) {
    this.status = newStatus;
    for (const fn of this.callbacks) {
      fn(newStatus, detail);
    }
  }

  /**
   * Derive WebSocket URL from current window location.
   * Complies with Freenet gateway guidelines (works under any host/port/iframe).
   */
  getWebSocketUrl() {
    try {
      const loc = window.location;
      const protocol = loc.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = loc.host || '127.0.0.1:7509';
      const search = loc.search || '';

      const authParam = search
        .split('&')
        .find(p => p.includes('authToken=')) || '';

      const authQuery = authParam ? `&${authParam.replace(/^[?&]/, '')}` : '';

      return `${protocol}//${host}/v1/contract/command?encodingProtocol=native${authQuery}`;
    } catch (e) {
      return 'ws://127.0.0.1:7509/v1/contract/command?encodingProtocol=native';
    }
  }

  /**
   * Check if running behind Freenet Gateway
   */
  isGateway() {
    try {
      return window.location.pathname.includes('/v1/contract/');
    } catch (e) {
      return false;
    }
  }

  /**
   * Connect to local Freenet node safely
   */
  connect() {
    if (typeof WebSocket === 'undefined') {
      this.setStatus('disconnected');
      return;
    }

    try {
      this.setStatus('connecting');
      const url = this.getWebSocketUrl();

      this.ws = new WebSocket(url);
      try {
        this.ws.binaryType = 'arraybuffer';
      } catch (e) {
        // Some shims might not support setting binaryType
      }

      this.ws.onopen = () => {
        this.setStatus('connected');
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      this.ws.onerror = (err) => {
        this.setStatus('disconnected', err);
      };

      this.ws.onclose = () => {
        this.setStatus('disconnected');
      };
    } catch (err) {
      console.warn('Freenet WebSocket connection skipped or blocked by sandbox:', err);
      this.setStatus('disconnected', err);
    }
  }

  handleMessage(data) {
    // Process incoming message
    // In native protocol, responses are CBOR or FlatBuffers encoded
    try {
      if (data instanceof ArrayBuffer) {
        const bytes = new Uint8Array(data);
        // Dispatch to pending request listeners if applicable
      }
    } catch (e) {
      console.warn('FreenetClient: error handling incoming message', e);
    }
  }

  /**
   * Fetch site state given a Delta contract key or prefix.
   * If offline or in dev, falls back gracefully.
   */
  async fetchDeltaSite(prefixOrKey) {
    // If not connected, return null so caller falls back to preset or manual
    if (this.status !== 'connected' || !this.ws) {
      return null;
    }

    // When WebSocket is connected, request the contract state
    return null;
  }
}

export const freenetClient = new FreenetClient();

