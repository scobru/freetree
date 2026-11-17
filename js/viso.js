/**
 * Freetree — Sign in with Viso + "My tree" (CRUD).
 * Classic script, no deps. Loaded after bundle.js; drives window.freetree.
 *
 * Connect flow: bounce to the user's Viso with ?connect=v1&challenge&return,
 * Viso returns ?viso=ok&pk&sig&challenge&ts. We verify the Ed25519 signature
 * over: "whoiam-connect-v1" | pk | u32le|base| u32le|challenge | u64le ts.
 * The tree lives in localStorage keyed by the proven pubkey (when the sandbox
 * allows it); "Export" always yields a portable #data= link.
 */
(function () {
  'use strict';

  // Pre-filled Viso; a URL the user entered before (stored) wins.
  const DEFAULT_VISO_URL = 'http://127.0.0.1:7509/v1/contract/web/GzHy3jnEtj26EoGqMsBpoawcY378hK9kp91rTcNYiAac/';
  const PROOF_MAX_AGE_MS = 10 * 60 * 1000;
  const enc = new TextEncoder();
  const $ = (id) => document.getElementById(id);

  const store = {
    get(k) { try { return window.localStorage?.getItem(k) ?? null; } catch { return null; } },
    set(k, v) { try { window.localStorage.setItem(k, v); return true; } catch { return false; } },
    del(k) { try { window.localStorage.removeItem(k); } catch {} }
  };

  const hex = (u8) => Array.from(u8, (b) => b.toString(16).padStart(2, '0')).join('');
  const unhex = (h) => {
    if (!/^([0-9a-f]{2})+$/i.test(h)) return null;
    return Uint8Array.from(h.match(/../g), (x) => parseInt(x, 16));
  };

  // This app's own origin+path (location.origin is "null" in the sandbox iframe).
  function ownBase() {
    const u = new URL(window.location.href);
    return `${u.origin === 'null' ? u.protocol + '//' + u.host : u.origin}${u.pathname}`;
  }

  function connectMessage(pk, base, challenge, ts) {
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

  async function verifyCallback(params) {
    const pk = unhex(params.get('pk') || '');
    const sig = unhex(params.get('sig') || '');
    const challenge = params.get('challenge') || '';
    const ts = Number(params.get('ts'));
    if (!pk || pk.length !== 32 || !sig || sig.length !== 64 || !challenge || !Number.isSafeInteger(ts)) {
      throw new Error('malformed Viso callback');
    }
    if (Math.abs(Date.now() - ts) > PROOF_MAX_AGE_MS) throw new Error('stale proof, sign in again');
    // One-time challenge; if storage is blocked we can only rely on the fresh ts.
    const expected = store.get('freetree_challenge');
    if (expected !== null && expected !== challenge) throw new Error('unknown challenge');
    if (!crypto?.subtle) throw new Error('WebCrypto unavailable (needs a secure context)');
    let key;
    try {
      key = await crypto.subtle.importKey('raw', pk, { name: 'Ed25519' }, false, ['verify']);
    } catch {
      throw new Error('this browser lacks Ed25519 in WebCrypto');
    }
    const ok = await crypto.subtle.verify({ name: 'Ed25519' }, key, sig, connectMessage(pk, ownBase(), challenge, ts));
    if (!ok) throw new Error('signature does not verify');
    store.del('freetree_challenge');
    return hex(pk);
  }

  // ---- tree CRUD (create/update = save, read = show, delete) ----
  const treeKey = (pk) => `freetree_tree_${pk}`;
  const loadTree = (pk) => { try { return JSON.parse(store.get(treeKey(pk)) || 'null'); } catch { return null; } };
  const safeUrl = (u) => /^https?:\/\/\S+$/i.test(u);
  const LINK_RE = /^\s*[*-]\s*\[([^\]]+)\]\((\S+?)\)/;

  let pk = null; // proven pubkey (hex)
  let memTree = null; // fallback when storage is blocked
  const short = (h) => h.slice(0, 8) + '…';

  function toast(msg) { window.freetree?.showToast(msg); }
  function open() { $('viso-modal-backdrop').classList.add('is-open'); }
  function close() { $('viso-modal-backdrop').classList.remove('is-open'); }

  function refreshModal() {
    $('viso-signin').style.display = pk ? 'none' : '';
    $('viso-tree').style.display = pk ? '' : 'none';
    $('viso-modal-title').textContent = pk ? 'My tree' : 'Sign in with Viso';
    $('viso-btn').textContent = pk ? `Viso · ${short(pk)}` : 'Viso';
    if (!pk) return;
    $('viso-who').textContent = short(pk);
    const t = loadTree(pk) || memTree || { name: '', bio: '', md: '' };
    $('tree-name-input').value = t.name;
    $('tree-bio-input').value = t.bio;
    $('tree-md-input').value = t.md;
    renderList();
  }

  // Read + per-link delete, driven by the textarea so it stays the source of truth.
  function renderList() {
    const ul = $('tree-link-list');
    ul.textContent = '';
    $('tree-md-input').value.split('\n').forEach((line, i) => {
      const m = LINK_RE.exec(line);
      if (!m) return;
      const li = document.createElement('li');
      li.style.cssText = 'display:flex;justify-content:space-between;gap:8px;font-size:0.8rem;padding:2px 0;';
      const label = document.createElement('span');
      label.textContent = m[1];
      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'btn-secondary';
      del.textContent = '×';
      del.title = 'Remove link';
      del.addEventListener('click', () => {
        const lines = $('tree-md-input').value.split('\n');
        lines.splice(i, 1);
        $('tree-md-input').value = lines.join('\n');
        renderList();
      });
      li.append(label, del);
      ul.append(li);
    });
  }

  function addLink() {
    const title = $('tree-add-title').value.replace(/[\[\]]/g, '').trim();
    const url = $('tree-add-url').value.trim();
    if (!title || !safeUrl(url)) return toast('Need a title and an http(s) URL');
    const ta = $('tree-md-input');
    ta.value = `${ta.value.replace(/\s+$/, '')}\n* [${title}](${url})`.replace(/^\n/, '');
    $('tree-add-title').value = '';
    $('tree-add-url').value = '';
    renderList();
  }

  function show(t) {
    const app = window.freetree;
    if (!app) return;
    app.loadCustomData({
      prefix: `viso:${short(pk)}`,
      name: t.name || 'My Linktree',
      handle: `@${(t.name || short(pk)).replace(/\s+/g, '_').toLowerCase()}`,
      bio: t.bio,
      avatar: null,
      pages: { Links: t.md },
      activePage: 'Links'
    });
  }

  function save() {
    const t = {
      name: $('tree-name-input').value.trim().slice(0, 64),
      bio: $('tree-bio-input').value.trim().slice(0, 280),
      md: $('tree-md-input').value.trim()
    };
    memTree = t;
    const persisted = store.set(treeKey(pk), JSON.stringify(t));
    close();
    show(t);
    if (!persisted) toast('Not saved on this device (sandbox): use Export to keep it');
  }

  function remove() {
    if (!window.confirm('Delete your tree?')) return;
    store.del(treeKey(pk));
    memTree = null;
    refreshModal();
    window.freetree?.loadEmptyState();
    toast('Tree deleted');
  }

  function startSignin() {
    const viso = $('viso-url-input').value.trim();
    let u;
    try { u = new URL(viso); } catch { return toast('Enter your Viso URL'); }
    if (!/^https?:$/.test(u.protocol)) return toast('Viso URL must be http(s)');
    const nonce = crypto.getRandomValues(new Uint8Array(16));
    const challenge = hex(nonce);
    store.set('freetree_challenge', challenge);
    store.set('freetree_viso_url', viso);
    const url = `${viso}${viso.includes('?') ? '&' : '?'}connect=v1&challenge=${challenge}&return=${encodeURIComponent(ownBase())}`;
    // Sandboxed iframe can't top-navigate; a new tab can.
    if (!window.open(url, '_blank')) toast('Popup blocked: allow popups and retry');
  }

  async function boot() {
    $('viso-url-input').value = store.get('freetree_viso_url') || DEFAULT_VISO_URL;
    $('viso-btn').addEventListener('click', () => { refreshModal(); open(); });
    $('viso-close-btn').addEventListener('click', close);
    $('viso-modal-backdrop').addEventListener('click', (e) => { if (e.target.id === 'viso-modal-backdrop') close(); });
    $('viso-signin-btn').addEventListener('click', startSignin);
    $('tree-add-btn').addEventListener('click', addLink);
    $('tree-md-input').addEventListener('input', renderList);
    $('tree-save-btn').addEventListener('click', save);
    $('tree-delete-btn').addEventListener('click', remove);
    $('viso-signout-btn').addEventListener('click', () => {
      pk = null; memTree = null; store.del('freetree_session_pk'); refreshModal();
    });

    const params = new URLSearchParams(window.location.search);
    const status = params.get('viso');
    try {
      if (status === 'ok') {
        pk = await verifyCallback(params);
        store.set('freetree_session_pk', pk);
        toast('Signed in with Viso');
      } else if (status === 'denied') {
        toast('Viso sign-in declined');
      } else {
        // Remembered session (unverified re-use of a previously verified key).
        const saved = store.get('freetree_session_pk');
        if (saved && /^[0-9a-f]{64}$/.test(saved)) pk = saved;
      }
    } catch (e) {
      toast(`Viso: ${e.message}`);
    }
    refreshModal();
    if (status === 'ok' && pk) {
      const t = loadTree(pk);
      if (t) show(t); else { open(); }
    }
  }

  document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 0));
})();
