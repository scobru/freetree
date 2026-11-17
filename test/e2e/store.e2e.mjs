// End-to-end check of the Freenet-backed tree with a FAKE node (contract + delegate kept in localStorage) and Viso
// simulated with the real wire formats. Needs Playwright (`npm i --no-save playwright`) and the app served:
//   python3 -m http.server 8085   # in the repo root
//   node test/e2e/store.e2e.mjs   # FREETREE_URL=http://localhost:8085/ by default
// It cannot show that a real node accepts the requests: that part is exercised by hand on a node.
import { createRequire } from 'node:module';
let chromium;
try { ({ chromium } = await import('playwright')); } catch { ({ chromium } = createRequire(import.meta.url)('playwright')); } // a global install, via NODE_PATH
const R = new URL('../../', import.meta.url).href;
const { ed25519, x25519 } = await import(new URL('node_modules/@noble/curves/ed25519.js', R).href);
const { hex, unhex, sealKey } = await import(new URL('src/store/seal.js', R).href);
const { connectMessage, signTree } = await import(new URL('src/store/entry.js', R).href);

const BASE = process.env.FREETREE_URL || 'http://localhost:8085/';
const CANON = 'http://127.0.0.1:7509/';
const ok = (c, m) => console.log(c ? 'PASS' : 'FAIL', '-', m) || (c ? 0 : (process.exitCode = 1));

// Viso, simulated with the real formats: the persona signs the delegation, the app key is sealed to the page's epk.
async function visoReply({ personaSk, appSecret, epk, hashTail, sealTo }) {
  const personaPk = ed25519.getPublicKey(personaSk), appPub = hex(ed25519.getPublicKey(appSecret));
  const challenge = `wd1.${appPub}.${epk}`, ts = Date.now();
  const sig = hex(ed25519.sign(connectMessage(personaPk, CANON, challenge, ts), personaSk));
  const vPriv = x25519.utils.randomSecretKey(), vEpk = x25519.getPublicKey(vPriv), to = unhex(sealTo ?? epk);
  const key = await sealKey(x25519.getSharedSecret(vPriv, to), vEpk, to);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: new Uint8Array(12), additionalData: new TextEncoder().encode(challenge) }, key, appSecret));
  return `${BASE}?viso=ok&pk=${hex(personaPk)}&sig=${sig}&challenge=${challenge}&ts=${ts}#${hashTail ? hashTail + '&' : ''}esk=${hex(vEpk)}.${hex(ct)}`;
}
const treeHash = (prefix, name, md) => { const t = { p: prefix, n: name, h: '@x', b: 'bio', pages: { Links: md }, a: 'Links' }; return 'data=' + encodeURIComponent(Buffer.from(encodeURIComponent(JSON.stringify(t)).replace(/%([0-9A-F]{2})/g, (_, x) => String.fromCharCode(parseInt(x, 16))), 'latin1').toString('base64')); };

const b = await chromium.launch();
async function newCtx() {
  const ctx = await b.newContext(); const errs = [];
  await ctx.addInitScript(() => {            // the fake node: contract + delegate, kept in localStorage across navigations
    const L = window.localStorage, get = (k, d) => { try { return JSON.parse(L.getItem('fake:' + k) ?? 'null') ?? d; } catch { return d; } }, put = (k, v) => L.setItem('fake:' + k, JSON.stringify(v));
    window.__freetreeNet = {
      nodeGet: async (k) => get('kv:' + k, null), nodePut: async (k, v) => { put('kv:' + k, v); return true; },
      getEntries: async (pk) => { if (get('down', false)) throw new Error('node down'); return get('log:' + pk, null); },
      pushEntries: async (pk, e) => { if (get('down', false)) throw new Error('node down'); put('log:' + pk, { ...get('log:' + pk, {}), ...e }); },
    };
  });
  const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(e.message)); return { ctx, p, errs };
}
const fake = (p, k) => p.evaluate((k) => JSON.parse(localStorage.getItem('fake:' + k)), k);
const setFake = (p, k, v) => p.evaluate(([k, v]) => localStorage.setItem('fake:' + k, JSON.stringify(v)), [k, v]);
const pills = (p) => p.locator('.link-pill').count();

const personaSk = crypto.getRandomValues(new Uint8Array(32)), appSecret = crypto.getRandomValues(new Uint8Array(32));
const personaHex = hex(ed25519.getPublicKey(personaSk)), short = personaHex.slice(0, 8) + '…';
const ownHash = treeHash(`viso:${short}`, 'Scobru', '* [GH](https://github.com/scobru) - code\n* [Two](https://two.example)');

// 1) sign-in request: key=v1, epk = challenge nonce, canonical base
let { ctx, p, errs } = await newCtx();
await p.goto(BASE + '#' + ownHash); await p.waitForTimeout(400);
await p.evaluate(() => { window.open = (u) => { window.__u = u; return {}; }; });
await p.click('#viso-btn'); await p.click('#viso-signin-btn'); await p.waitForFunction(() => window.__u, null, { timeout: 15000 });
const u = new URL(await p.evaluate(() => window.__u)); const q = u.searchParams;
ok(q.get('key') === 'v1' && /^[0-9a-f]{64}$/.test(q.get('epk')) && q.get('challenge') === q.get('epk'), 'request asks key=v1 with epk = challenge nonce');
ok(q.get('base') === CANON, 'request asks for the canonical base');
ok((q.get('return') || '').endsWith('#' + ownHash), 'return keeps the viewed tree');
const epk = q.get('epk');
ok((await fake(p, 'kv:ft:epk')) !== null && (await fake(p, 'kv:ft:epk')).length === 64, 'one-time private key waits in the delegate');

// 2) back from Viso: session kept, tree migrated to the contract, esk gone from the URL
await p.goto('about:blank');
await p.goto(await visoReply({ personaSk, appSecret, epk, hashTail: ownHash }));
await p.waitForTimeout(900);
ok((await p.textContent('#viso-btn')).includes(short.slice(0, 8)), 'signed in as the persona');
ok((await p.evaluate(() => location.hash)) === '#u=' + personaHex, 'esk removed from the URL, and once saved the address is the short link');
ok((await pills(p)) === 2, 'the carried tree is shown');
const log1 = await fake(p, 'log:' + personaHex);
ok(log1 && log1[`${personaHex}:tree`], 'tree migrated to the contract (nothing there yet)');
const picked = await p.evaluate(([log, pk]) => window.FreetreeStore.pickTree(log, pk, '/'), [log1, personaHex]);
ok(picked && picked.name === 'Scobru' && picked.md.includes('Two'), 'the contract entry is a valid signed tree');
ok(JSON.parse(await fake(p, 'kv:ft:session')).persona === personaHex, 'session kept in the delegate');
ok((await fake(p, 'kv:ft:epk')) === '', 'one-time key discarded');
await p.click('#viso-btn');
ok((await p.textContent('#tree-status')).includes('Saved on Freenet'), 'status says saved on Freenet');

// 3) a fresh visit, no link at all: the tree comes from the contract
await p.goto('about:blank'); await p.goto(BASE); await p.waitForTimeout(900);
ok((await pills(p)) === 2 && (await p.textContent('#profile-handle')).toLowerCase().includes('scobru'), 'fresh visit loads the saved tree from the contract');
ok((await p.evaluate(() => location.hash)) === '#u=' + personaHex, 'a fresh visit: the address is the short link');

// 4) edit + save -> contract updated
await p.click('#edit-tree-btn');
ok((await p.inputValue('#tree-name-input')) === 'Scobru', 'editor opens on the saved tree');
await p.fill('#tree-add-title', 'Three'); await p.fill('#tree-add-url', 'https://three.example'); await p.click('#tree-add-btn');
await p.click('#tree-save-btn'); await p.waitForTimeout(600);
const log2 = await fake(p, 'log:' + personaHex);
ok((await pills(p)) === 3 && log2[`${personaHex}:tree`].ts >= log1[`${personaHex}:tree`].ts && JSON.parse(log2[`${personaHex}:tree`].body).md.includes('three.example'), 'save updates the contract entry');
await p.goto('about:blank'); await p.goto(BASE); await p.waitForTimeout(900);
ok((await pills(p)) === 3, 'next visit shows the edited tree');

// 4b) the share link is short (just the persona's key), and anyone can open it
await p.click('#share-profile-btn');
const shareUrl = await p.inputValue('#export-url-input');
ok(shareUrl.endsWith('#u=' + personaHex) && shareUrl.length < 200, `share link is short (${shareUrl.length} chars) and carries only the key`);
await p.click('#export-modal-close-btn');
const toastText = (pg) => pg.textContent('#toast-text');
const asVisitor = async (hash) => {          // a different person: no session in the delegate
  const v = await ctx.newPage(); v.on('pageerror', (e) => errs.push(e.message));
  await v.goto('about:blank'); await v.goto(BASE);
  await setFake(v, 'kv:ft:session', '');
  await v.evaluate(() => localStorage.removeItem('freetree_session_pk')); // not remembered as the owner either
  await v.goto('about:blank'); await v.goto(BASE + hash); await v.waitForTimeout(900);
  return v;
};
let v = await asVisitor('#u=' + personaHex);
ok((await pills(v)) === 3 && (await v.textContent('#viso-btn')) === 'Viso', 'a visitor reads the tree from the contract without signing in');
await v.click('#edit-tree-btn');
ok((await toastText(v)).includes('Not your tree'), 'a visitor editing it only makes their own copy');
await v.evaluate(() => document.getElementById('viso-modal-backdrop').classList.remove('is-open'));
await v.click('#share-profile-btn');
ok((await v.inputValue('#export-url-input')).endsWith('#u=' + personaHex), "the visitor's Export of that tree is still the short link");
await v.close();
await setFake(p, 'down', true);
v = await asVisitor('#u=' + personaHex);
ok((await v.locator('#empty-create-btn').count()) === 1 && (await toastText(v)).includes('Could not reach Freenet'), 'node down: the visitor sees the empty state and why');
await v.close(); await setFake(p, 'down', false);
v = await asVisitor('#u=' + hex(crypto.getRandomValues(new Uint8Array(32))));
ok((await v.locator('#empty-create-btn').count()) === 1 && (await toastText(v)).includes('No tree found'), 'a persona with no tree: said so');
await v.close();

// 5) node down: saved in the link only, said so
await setFake(p, 'down', true);
await p.click('#edit-tree-btn'); await p.fill('#tree-name-input', 'Offline'); await p.click('#tree-save-btn'); await p.waitForTimeout(600);
await p.click('#viso-btn');
ok((await p.textContent('#tree-status')).includes('Only in this page link') && (await p.evaluate(() => location.hash)).startsWith('#data='), 'node down: link updated and the status says so');
await setFake(p, 'down', false);

// 6) delete -> empty marker; a fresh visit shows no tree
await p.evaluate(() => { window.confirm = () => true; });
await p.click('#viso-close-btn'); await p.click('#viso-btn'); await p.click('#tree-delete-btn'); await p.waitForTimeout(600);
await p.goto('about:blank'); await p.goto(BASE); await p.waitForTimeout(900);
ok(await p.locator('#empty-create-btn').count() === 1, 'after delete a fresh visit shows the empty state');

// 7) forged entries are ignored: a bad certificate, and an entry signed by a key that was never delegated
const evil = crypto.getRandomValues(new Uint8Array(32)), evilCert = { base: CANON, challenge: `wd1.${hex(ed25519.getPublicKey(evil))}.${'00'.repeat(32)}`, ts: Date.now(), sig: '00'.repeat(64) };
const forged = signTree({ appSecretHex: hex(evil), personaHex, cert: evilCert, appPath: '/', tree: { name: 'EVIL', bio: '', md: '* [x](https://evil.example)' }, ts: Date.now() + 1000 });
await setFake(p, 'log:' + personaHex, { [`${personaHex}:tree`]: forged });
await p.goto('about:blank'); await p.goto(BASE); await p.waitForTimeout(900);
ok(await p.locator('#empty-create-btn').count() === 1, 'a forged entry is not shown');
await ctx.close();

// 8) Viso answers with a key sealed to someone else's epk: no session, no write, said so
({ ctx, p, errs } = await newCtx());
await p.goto(BASE); await p.evaluate(() => { window.open = (u) => { window.__u = u; return {}; }; });
await p.click('#viso-btn'); await p.click('#viso-signin-btn'); await p.waitForFunction(() => window.__u, null, { timeout: 15000 });
const epk2 = new URL(await p.evaluate(() => window.__u)).searchParams.get('epk');
await p.goto('about:blank'); await p.goto(await visoReply({ personaSk, appSecret, epk: epk2, sealTo: hex(x25519.getPublicKey(x25519.utils.randomSecretKey())) }));
await p.waitForTimeout(900);
ok((await p.textContent('#viso-btn')).includes(short.slice(0, 8)) && (await fake(p, 'kv:ft:session')) === null && (await fake(p, 'log:' + personaHex)) === null, 'a key that does not open: signed in, but nothing stored and nothing written');
console.log('page errors:', [...errs]);
await b.close();
