import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { blake3 } from '@noble/hashes/blake3.js';
import { keyOf, treeParams } from '../src/store/node.js';

// Same inputs as test/rust/keyaddr.rs: freenet-stdlib's ContractKey::from_params_and_code gives this id.
const PK = 'd04ab232742bb4ab3a1368bd4615e4e6d0224ab71a016baf8520a332c9778737';
const APP = '/v1/contract/web/4SC5QCzLzKWH9BSFFybivTynfBRkPw3PtXwegjXbPm8x/';

test('the tree contract address equals the one freenet-stdlib (Rust) derives', () => {
  const hash = blake3(new Uint8Array(readFileSync(new URL('../js/wasm/log.wasm', import.meta.url))));
  assert.equal(keyOf(hash, treeParams(PK, APP)).encode(), 'F83YoNjKCsV2DVmWdTVvasoCbtxkkV65mhg2gUBSQDH1');
});

test('another app path or persona is another contract', () => {
  const hash = blake3(new Uint8Array(readFileSync(new URL('../js/wasm/log.wasm', import.meta.url))));
  const id = (pk, app) => keyOf(hash, treeParams(pk, app)).encode();
  assert.notEqual(id(PK, APP), id(PK, '/v1/contract/web/other/'));
  assert.notEqual(id(PK, APP), id('00'.repeat(32), APP));
});
