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
