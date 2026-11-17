/**
 * Freetree — create / import / edit your tree (classic, no account) + optional Sign in with Viso (CRUD).
 * Classic script, no deps. Loaded after bundle.js; drives window.freetree.
 *
 * Connect flow: bounce to the user's Viso with ?connect=v1&challenge&return,
 * Viso returns ?viso=ok&pk&sig&challenge&ts. We verify the Ed25519 signature
 * over: "whoiam-connect-v1" | pk | u32le|base| u32le|challenge | u64le ts.
 * Signed in with Viso's key=v1 (js/store.bundle.js loaded), the tree is also kept
 * in a Freenet contract: the app key Viso hands back (sealed, #esk=) signs it, the
 * persona's delegation certificate vouches for that key. Without the bundle, a
 * node, or a delegate to hold the key, everything falls back to the page link:
 * "Export" always yields a portable #data= link.
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

  // Viso appends `#esk=<viso epk>.<ciphertext>` to the return URL, or `&esk=…` to a carried #data=/#z= hash.
  // Take it out now, before the app (bundle.js) reads the hash: its #data= decoder would choke on it.
  let handedEsk = null;
  (function takeEsk() {
    const h = window.location.hash;
    const m = /(?:^#|&)esk=([0-9a-f]{64}\.[0-9a-f]{96})$/i.exec(h);
    if (!m) return;
    handedEsk = m[1];
    const rest = h.slice(0, m.index);
    try { history.replaceState(null, '', rest && rest !== '#' ? rest : window.location.pathname + window.location.search); } catch {}
  })();

  // The Freenet side (js/store.bundle.js). `window.__freetreeNet` replaces its network and delegate calls in tests.
  const net = () => (window.FreetreeStore ? Object.assign({}, window.FreetreeStore, window.__freetreeNet) : null);

  // Small private values the node keeps for this app (its delegate), else page storage. Keys: [A-Za-z0-9:-].
  async function kvGet(k) { return ((await net()?.nodeGet(k).catch(() => null)) || store.get(`freetree_${k}`)) || null; }
  async function kvPut(k, v) { return !!(await net()?.nodePut(k, v).catch(() => false)) || store.set(`freetree_${k}`, v); }

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

  // The app's path on the node ("…/<key>/"): the contract parameters and the delegation certificate carry it.
  const appPath = () => {
    const m = /^\/v[12]\/contract\/web\/[^/]+/.exec(window.location.pathname);
    return m ? `${m[0]}/` : window.location.pathname;
  };
  // What we ask Viso to sign for: the same app on any node host, so the certificate does not show this one.
  const canonicalBase = () => `http://127.0.0.1:7509${appPath()}`;

  // Check Viso's answer: the persona signed (base, challenge, ts). That signature is also the certificate that
  // delegates the app key. Classic sign-in: a one-time challenge we issued. key=v1: `wd1.<app key>.<our epk>`.
  async function verifyCallback(params) {
    const pk = unhex(params.get('pk') || '');
    const sig = unhex(params.get('sig') || '');
    const challenge = params.get('challenge') || '';
    const ts = Number(params.get('ts'));
    if (!pk || pk.length !== 32 || !sig || sig.length !== 64 || !challenge || !Number.isSafeInteger(ts)) {
      throw new Error('malformed Viso callback');
    }
    if (Math.abs(Date.now() - ts) > PROOF_MAX_AGE_MS) throw new Error('stale proof, sign in again');
    const keyed = challenge.startsWith('wd1.');
    if (!keyed) {
      // One-time challenge; if storage is blocked we can only rely on the fresh ts.
      const expected = store.get('freetree_challenge');
      if (expected !== null && expected !== challenge) throw new Error('unknown challenge');
    }
    if (!crypto?.subtle) throw new Error('WebCrypto unavailable (needs a secure context)');
    let key;
    try {
      key = await crypto.subtle.importKey('raw', pk, { name: 'Ed25519' }, false, ['verify']);
    } catch {
      throw new Error('this browser lacks Ed25519 in WebCrypto');
    }
    let base = null;
    for (const b of new Set([canonicalBase(), ownBase()])) {
      if (await crypto.subtle.verify({ name: 'Ed25519' }, key, sig, connectMessage(pk, b, challenge, ts))) { base = b; break; }
    }
    if (!base) throw new Error('signature does not verify');
    if (!keyed) store.del('freetree_challenge');
    return { persona: hex(pk), cert: { base, challenge, ts, sig: hex(sig) } };
  }

  // Whose contract tree is on screen, unchanged: then the share link is only that persona's key (#u=<key>) and whoever
  // opens it reads the tree from the contract (checking the signatures). Null: the tree is only in the page link.
  let sharedUser = null;
  const shareHash = () => {
    const d = window.freetree?.siteData;
    return sharedUser && d && d.prefix === `viso:${short(sharedUser)}` ? `u=${sharedUser}` : null;
  };

  function failLoad(msg) {
    window.freetree?.loadEmptyState();
    toast(msg);
  }

  // #u=<persona key>: show that persona's tree from the contract. Reading needs no sign-in.
  async function openUser(personaHex) {
    const n = net();
    if (!n) return failLoad('This tree is stored on Freenet: open Freetree from your node to see it');
    try {
      const entries = await n.getEntries(personaHex);
      const t = entries ? n.pickTree(entries, personaHex, appPath()) : null;
      if (!t || isEmpty(t)) return failLoad('No tree found on Freenet for this link');
      sharedUser = personaHex;
      show(t, personaHex);
    } catch (e) {
      console.warn('[freetree] could not read from Freenet:', e);
      failLoad('Could not reach Freenet to load this tree');
    }
  }

  // ---- the tree in a Freenet contract (needs the bundle, a node, and the app key from a key=v1 sign-in) ----
  let session = null; // { appSecret, cert }: set only when Viso handed the app key over
  const urlUser = /^#u=[0-9a-f]{64}$/i.test(window.location.hash) ? window.location.hash.slice(3).toLowerCase() : null; // the URL names the tree to show

  async function finishSignin(params) {
    const proof = await verifyCallback(params);
    session = null;
    const n = net();
    if (proof.cert.challenge.startsWith('wd1.')) {
      const priv = await kvGet('ft:epk');
      if (n && handedEsk && priv) {
        try {
          const secret = await n.openEsk(handedEsk, priv, proof.cert.challenge);
          const appKey = proof.cert.challenge.split('.')[1];
          if (n.appPubHex(secret) !== appKey) throw new Error('the key Viso handed over does not match its signature');
          n.checkCert(proof.persona, appPath(), appKey, proof.cert);
          session = { appSecret: secret, cert: proof.cert };
          await kvPut('ft:session', JSON.stringify({ persona: proof.persona, ...session }));
        } catch (e) {
          toast(`Freenet key: ${e.message}`);
        }
      }
      handedEsk = null;
      await kvPut('ft:epk', ''); // single use
    }
    return proof.persona;
  }

  // A sign-in from an earlier visit, kept by the node's delegate: the certificate is checked again, nothing is trusted.
  async function restoreSession() {
    const n = net();
    if (!n) return false;
    try {
      const j = JSON.parse((await kvGet('ft:session')) || 'null');
      if (!j || !/^[0-9a-f]{64}$/.test(j.persona) || !/^[0-9a-f]{64}$/.test(j.appSecret)) return false;
      n.checkCert(j.persona, appPath(), n.appPubHex(j.appSecret), j.cert);
      pk = j.persona;
      session = { appSecret: j.appSecret, cert: j.cert };
      return true;
    } catch { return false; }
  }

  const isEmpty = (t) => !t || (!String(t.md || '').trim() && !String(t.name || '').trim());
  const sameTree = (a, b) => a.name === b.name && a.bio === b.bio && a.md === b.md;

  function setStatus(kind) {
    const el = $('tree-status');
    if (!el) return;
    el.textContent = !session ? '' : { saving: 'Saving on Freenet…', saved: '✓ Saved on Freenet', link: 'Only in this page link: the Freenet node did not answer', none: 'Not saved on Freenet yet' }[kind] || '';
  }

  /** Sign the tree with the app key and send it to the contract. False when it could not (no node, refused…). */
  async function pushTree(t) {
    const n = net();
    if (!n || !pk || !session) return false;
    try {
      const e = n.signTree({ appSecretHex: session.appSecret, personaHex: pk, cert: session.cert, appPath: appPath(), tree: t });
      await n.pushEntries(pk, { [`${e.author}:${e.id}`]: e });
      return true;
    } catch (e) {
      console.warn('[freetree] could not save to Freenet:', e);
      return false;
    }
  }

  /** The persona's newest valid tree in the contract, or null (none, no node, anything forged is skipped). */
  async function pullTree() {
    const n = net();
    if (!n || !pk || !session) return null;
    try {
      const entries = await n.getEntries(pk);
      const t = entries ? n.pickTree(entries, pk, appPath()) : null;
      return isEmpty(t) ? null : t;
    } catch (e) {
      console.warn('[freetree] could not read from Freenet:', e);
      return null;
    }
  }

  // After signing in: the contract's tree shows if nothing else is on screen; what is on screen (an opened link)
  // is never replaced, and is saved if the contract has nothing yet.
  async function syncFromContract() {
    if (!session) return;
    setStatus('saving');
    const remote = await pullTree();
    const shown = shownOwnTree();
    if (remote) memTree = remote; // the editor opens on it
    if (remote && !window.freetree?.siteData && !urlUser) {
      sharedUser = pk;
      show(remote);
      syncHash(false);
      toast('Your tree, loaded from Freenet');
      return setStatus('saved');
    }
    if (remote && shown && !sameTree(remote, shown)) {
      toast('Your saved tree differs from this link: showing the link. Save to replace the saved one');
      return setStatus('saved');
    }
    if (remote) {
      if (shown && sameTree(remote, shown)) { sharedUser = pk; syncHash(false); } // the same tree: the short link
      return setStatus('saved');
    }
    if (shown && !isEmpty(shown)) {
      const ok = await pushTree(shown);
      if (ok) { sharedUser = pk; syncHash(false); toast('Saved on Freenet'); }
      return setStatus(ok ? 'saved' : 'link');
    }
    setStatus('none');
  }

  // ---- tree CRUD (create/update = save, read = show, delete) ----
  const treeKey = (id) => (id === 'local' ? LOCAL_KEY : `freetree_tree_${id}`);
  const loadTree = (pk) => { try { return JSON.parse(store.get(treeKey(pk)) || 'null'); } catch { return null; } };
  const safeUrl = (u) => /^https?:\/\/\S+$/i.test(u);
  const LINK_RE = /^\s*[*-]\s*\[([^\]]+)\]\((\S+?)\)/;

  let pk = null; // proven pubkey (hex)
  let memTree = null; // fallback when storage is blocked
  const short = (h) => h.slice(0, 8) + '…';

  // Without Viso a tree is "local": whoever holds its link edits it. With Viso it is viso:<short pk>.
  let guest = false; // editor open without being signed in
  const ownerPrefix = () => (pk ? `viso:${short(pk)}` : 'local');
  const LOCAL_KEY = 'freetree_tree_local';

  const treeOf = (d) => {
    const pages = d.pages || {};
    const md = pages[window.freetree.activePageTitle] ?? pages[Object.keys(pages)[0]] ?? '';
    return { name: d.name === 'My Linktree' ? '' : d.name || '', bio: d.bio || '', md };
  };

  // The tree on screen, if it is mine (a local one, or the signed-in persona's viso:<short pk>).
  // This is what makes an opened #data= link editable by its owner.
  function shownOwnTree() {
    const d = window.freetree?.siteData;
    if (!d || (d.prefix !== 'local' && d.prefix !== ownerPrefix())) return null;
    return treeOf(d);
  }

  // The URL hash is the only storage that survives the sandbox: keep it equal to the shown tree.
  function syncHash(clear) {
    try {
      const h = clear ? '' : (window.freetree.getShareableUrl().split('#')[1] || '');
      history.replaceState(null, '', h ? `#${h}` : window.location.pathname + window.location.search);
    } catch {}
  }

  function toast(msg) { window.freetree?.showToast(msg); }
  function open() { $('viso-modal-backdrop').classList.add('is-open'); }
  function close() { $('viso-modal-backdrop').classList.remove('is-open'); }

  function refreshModal(prefill) {
    const editor = !!pk || guest;
    $('viso-signin').style.display = editor ? 'none' : '';
    $('viso-tree').style.display = editor ? '' : 'none';
    $('viso-import').style.display = 'none';
    $('viso-modal-title').textContent = pk ? 'My tree' : guest ? 'Create a tree' : 'Get started';
    $('viso-btn').textContent = pk ? `Viso · ${short(pk)}` : 'Viso';
    $('viso-who-row').style.display = pk ? '' : 'none';
    $('viso-signout-btn').style.display = pk ? '' : 'none';
    if (!editor) return;
    if (pk) $('viso-who').textContent = short(pk);
    const stored = pk ? loadTree(pk) : loadTree('local');
    const t = prefill || shownOwnTree() || stored || memTree || { name: '', bio: '', md: '' };
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

  function show(t, who = pk) {
    const app = window.freetree;
    if (!app) return;
    app.loadCustomData({
      prefix: who ? `viso:${short(who)}` : 'local',
      name: t.name || 'My Linktree',
      handle: `@${(t.name || (who ? short(who) : 'me')).replace(/\s+/g, '_').toLowerCase()}`,
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
    const persisted = store.set(treeKey(pk || 'local'), JSON.stringify(t));
    close();
    sharedUser = null; // until the contract has it, the link carries the tree
    show(t);
    syncHash(false);
    if (!session) return toast(persisted ? 'Saved' : 'Saved in this page link: use Export to keep it');
    setStatus('saving');
    pushTree(t).then((ok) => {
      if (ok) { sharedUser = pk; syncHash(false); }
      setStatus(ok ? 'saved' : 'link');
      toast(ok ? 'Saved on Freenet' : 'Saved in this page link only: the Freenet node did not answer');
    });
  }

  function remove() {
    if (!window.confirm('Delete your tree?')) return;
    store.del(treeKey(pk || 'local'));
    memTree = null;
    sharedUser = null;
    window.freetree?.loadEmptyState();
    syncHash(true);
    refreshModal();
    toast('Tree deleted');
    // a contract entry cannot be removed: replace it with an empty tree, which reads as none
    if (session) pushTree({ name: '', bio: '', md: '' }).then((ok) => setStatus(ok ? 'none' : 'link'));
  }

  // ---- classic entry: create or import, no account ----
  function openEditor(t) { guest = !pk; refreshModal(t); open(); }

  function create() { openEditor({ name: '', bio: '', md: '' }); }

  function showImport() {
    $('viso-signin').style.display = 'none';
    $('viso-tree').style.display = 'none';
    $('viso-import').style.display = '';
    $('viso-modal-title').textContent = 'Import a tree';
    $('import-input').value = '';
    open();
  }

  // A Freetree link (#data=…, e.g. from Export) or plain Markdown. Either way you land in the editor with a
  // copy to review: saving it makes it yours.
  function importText(text) {
    const t = text.trim();
    if (!t) return toast('Paste a Freetree link or Markdown');
    if (t.length > 200000) return toast('That is too big to import');
    let tree = { name: '', bio: '', md: t };
    const m = /(?:#|^)(data=\S*)/.exec(t);
    if (m) {
      try {
        const j = JSON.parse(hashJson('#' + m[1]));
        const pages = j.pages || {};
        tree = { name: typeof j.n === 'string' && j.n !== 'My Linktree' ? j.n : '', bio: typeof j.b === 'string' ? j.b : '', md: String(pages[j.a] ?? pages[Object.keys(pages)[0]] ?? '') };
      } catch {
        return toast('That is not a valid Freetree link');
      }
    }
    openEditor(tree);
  }

  // Topbar "Edit": the tree on screen (a copy, if it is someone else's), or a new one.
  function editShown() {
    const d = window.freetree?.siteData;
    if (!d) return create();
    if (!shownOwnTree()) toast('Not your tree: saving makes your own copy');
    openEditor(treeOf(d));
  }

  // Viso keeps the return URL's fragment, so the tree being viewed can survive the sign-in bounce.
  // Limit: the Freenet shell silently drops a navigation whose URL is over 4096 chars (shell_bridge.js),
  // and Viso appends ?viso=ok&pk&sig&challenge&ts (~270 chars) to it. Too long = stuck on Viso.
  const MAX_HREF = 4096;
  const CALLBACK_EXTRA = 330;
  const MAX_CARRIED_JSON = 65536;

  const toB64 = (u8) => { let b = ''; u8.forEach((x) => { b += String.fromCharCode(x); }); return btoa(b); };
  const fromB64 = (b) => Uint8Array.from(atob(b), (c) => c.charCodeAt(0));
  const hashJson = (h) => new TextDecoder().decode(fromB64(decodeURIComponent(h.slice(6)))); // '#data=' + url-encoded base64 of UTF-8 JSON
  const jsonHash = (json) => `#data=${encodeURIComponent(toB64(enc.encode(json)))}`;
  const pipe = async (stream, u8) => new Uint8Array(await new Response(new Blob([u8]).stream().pipeThrough(stream)).arrayBuffer());

  // What to append to the return URL: the plain hash if it fits, else a deflated one (#z=), else nothing.
  async function carryHash() {
    const h = window.location.hash;
    if (/^#u=[0-9a-f]{64}$/i.test(h)) return h; // already short
    if (!/^#data=[A-Za-z0-9%._~-]+$/.test(h)) return '';
    const room = MAX_HREF - ownBase().length - CALLBACK_EXTRA;
    if (h.length <= room) return h;
    try {
      const z = '#z=' + toB64(await pipe(new CompressionStream('deflate-raw'), enc.encode(hashJson(h))))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      if (z.length <= room) return z;
    } catch {}
    toast('This tree is too big to keep through sign-in: reopen your link after signing in');
    return '';
  }

  // Back from Viso with #z=…: inflate it into the normal #data= hash and show it.
  async function restoreCarried() {
    const m = /^#z=([A-Za-z0-9_-]+)$/.exec(window.location.hash);
    if (!m) return;
    try {
      const b64 = m[1].replace(/-/g, '+').replace(/_/g, '/');
      const json = new TextDecoder().decode(await pipe(new DecompressionStream('deflate-raw'), fromB64(b64 + '='.repeat((4 - b64.length % 4) % 4))));
      if (json.length > MAX_CARRIED_JSON) return;
      JSON.parse(json);
      history.replaceState(null, '', jsonHash(json));
      window.freetree.handleRoute();
    } catch {}
  }

  async function startSignin() {
    const viso = $('viso-url-input').value.trim();
    let u;
    try { u = new URL(viso); } catch { return toast('Enter your Viso URL'); }
    if (!/^https?:$/.test(u.protocol)) return toast('Viso URL must be http(s)');
    store.set('freetree_viso_url', viso);
    const back = encodeURIComponent(ownBase() + await carryHash());
    const sep = viso.includes('?') ? '&' : '?';
    let url;
    // key=v1: Viso derives this app's key and hands it back sealed to a one-time key (epk) that waits in the node's
    // delegate meanwhile. No store, or nowhere to keep that key: the classic sign-in (the tree stays in the link).
    const n = net();
    const epk = n ? n.newEpk() : null;
    if (epk && await kvPut('ft:epk', epk.priv)) {
      url = `${viso}${sep}connect=v1&challenge=${epk.pub}&return=${back}&base=${encodeURIComponent(canonicalBase())}&key=v1&epk=${epk.pub}`;
    } else {
      const challenge = hex(crypto.getRandomValues(new Uint8Array(16)));
      store.set('freetree_challenge', challenge);
      url = `${viso}${sep}connect=v1&challenge=${challenge}&return=${back}`;
    }
    // Sandboxed iframe can't top-navigate; a new tab can.
    if (!window.open(url, '_blank')) toast('Popup blocked: allow popups and retry');
  }

  async function boot() {
    await restoreCarried();
    $('viso-url-input').value = store.get('freetree_viso_url') || DEFAULT_VISO_URL;
    window.freetreeTree = { create, showImport, openUser, shareHash };
    const opening = urlUser ? openUser(urlUser) : null; // reading needs no sign-in: start it first
    $('viso-btn').addEventListener('click', () => { guest = false; refreshModal(); open(); });
    $('edit-tree-btn').addEventListener('click', editShown);
    $('guest-create-btn').addEventListener('click', create);
    $('guest-import-btn').addEventListener('click', showImport);
    $('import-go-btn').addEventListener('click', () => importText($('import-input').value));
    $('viso-close-btn').addEventListener('click', close);
    $('viso-modal-backdrop').addEventListener('click', (e) => { if (e.target.id === 'viso-modal-backdrop') close(); });
    $('viso-signin-btn').addEventListener('click', startSignin);
    $('tree-add-btn').addEventListener('click', addLink);
    $('tree-md-input').addEventListener('input', renderList);
    $('tree-save-btn').addEventListener('click', save);
    $('tree-delete-btn').addEventListener('click', remove);
    $('viso-signout-btn').addEventListener('click', () => {
      pk = null; memTree = null; session = null; store.del('freetree_session_pk');
      kvPut('ft:session', '');
      refreshModal();
    });

    const params = new URLSearchParams(window.location.search);
    const status = params.get('viso');
    try {
      if (status === 'ok') {
        pk = await finishSignin(params);
        store.set('freetree_session_pk', pk);
        toast('Signed in with Viso');
      } else if (status === 'denied') {
        toast('Viso sign-in declined');
      } else {
        // A sign-in kept by the node's delegate (certificate re-checked), else the remembered key of an earlier one.
        if (!(await restoreSession())) {
          const saved = store.get('freetree_session_pk');
          if (saved && /^[0-9a-f]{64}$/.test(saved)) pk = saved;
        }
      }
    } catch (e) {
      toast(`Viso: ${e.message}`);
    }
    refreshModal();
    if (session) await syncFromContract();
    await opening;
    refreshModal();
    if (status === 'ok' && pk) {
      if (shownOwnTree()) {
        toast('Signed in. Tap your Viso button to edit this tree');
      } else if (!window.freetree?.siteData) {
        const t = loadTree(pk);
        if (t) show(t); else if (!session || !memTree) { open(); }
      }
    }
  }

  document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 0));
})();
