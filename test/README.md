# Tests

`npm test` runs the JS tests (`test/*.test.mjs`): the Viso `key=v1` sealing (known answer + round trip), the
signed tree entry, and a golden fixture (`fixtures/tree-entry.json`).

## Cross-check against the real contract

The entries must be accepted by Radica's log contract (`log.wasm`), which freetree reuses unchanged. The Rust side
is `rust/js_fixture.rs`: copy it into `log-contract/tests/` of a [scobru/radica](https://github.com/scobru/radica)
checkout and run

```bash
FIXTURE=/path/to/freetree/test/fixtures/tree-entry.json cargo test --manifest-path log-contract/Cargo.toml --test js_fixture
```

It checks that the contract accepts the entry signed in JS, and rejects a tampered body, a tampered certificate and
the same entry presented to another app's log. After an intended format change, regenerate the fixture with
`UPDATE_FIXTURE=1 npm test` and run the Rust check again.

## Contract address

`rust/keyaddr.rs` prints the address freenet-stdlib derives for a persona and app path (same `WASM`, `PK`, `APP`
env vars); `address.test.mjs` pins the id the JS derives for the same inputs. They must be equal: a wrong address
would silently put the data in another contract. Re-run the Rust side if `js/wasm/log.wasm` or the params change.

`js/wasm/` holds Radica's `log.wasm` (the contract) and `identity.wasm` (the node's key/value delegate), unchanged;
`npm run build` refuses to bundle if they do not match `js/wasm/SHA256SUMS`.

## End to end (fake node)

`e2e/store.e2e.mjs` drives the real page in Chromium against a fake node (contract and delegate in `localStorage`)
and a simulated Viso (real signatures and sealing): the key=v1 sign-in request, the sealed key coming back in
`#esk=`, migrating the tree on screen to the contract, loading it on a fresh visit, saving, a node that is down,
deleting, a forged entry, and a key sealed to someone else. See the header of the file for how to run it.
It proves the page logic and the formats, not that a real Freenet node accepts the requests.
