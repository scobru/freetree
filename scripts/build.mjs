// Bundle src/store into js/store.bundle.js (a classic script: Freenet web containers have no build step and the
// sandboxed iframe has no module CORS). Run `npm run build` after changing src/store; the bundle is committed.
import { build } from 'esbuild';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

// The contract address derives from log.wasm's bytes: refuse to bundle against a different file.
for (const line of readFileSync('js/wasm/SHA256SUMS', 'utf8').trim().split('\n')) {
  const [sum, file] = line.split(/\s+/);
  const got = createHash('sha256').update(readFileSync(`js/wasm/${file}`)).digest('hex');
  if (got !== sum) throw new Error(`js/wasm/${file} does not match SHA256SUMS`);
}

await build({
  entryPoints: ['src/store/index.js'],
  outfile: 'js/store.bundle.js',
  bundle: true,
  format: 'iife',
  globalName: 'FreetreeStore',
  platform: 'browser',
  target: 'es2020',
  minify: true,
  legalComments: 'none',
});
console.log('built js/store.bundle.js');
