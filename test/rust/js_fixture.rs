// Local cross-check (not committed): the contract must accept the entry freetree's JS signed.
use radica_log_contract::{check, Entry};
#[test]
fn js_entry_is_accepted_by_the_contract() {
    let f: serde_json::Value = serde_json::from_str(&std::fs::read_to_string(std::env::var("FIXTURE").unwrap()).unwrap()).unwrap();
    let params = f["paramsHex"].as_str().unwrap();
    let key = f["key"].as_str().unwrap();
    let e: Entry = serde_json::from_value(f["entry"].clone()).unwrap();
    check(params, key, &e).expect("contract must accept the JS entry");
    let mut bad = e.clone(); bad.body.push('x');
    assert!(check(params, key, &bad).is_err(), "tampered body must be rejected");
    let mut bad = e.clone(); if let Some(c) = bad.cert.as_mut() { c.ts += 1; }
    assert!(check(params, key, &bad).is_err(), "tampered cert must be rejected");
    // another app's log (different path in the params) must not accept it
    let other = hex::encode(format!("radica/{}|/v1/contract/web/other/", f["log"].as_str().unwrap()));
    assert!(check(&other, key, &e).is_err(), "another app must reject it");
}
