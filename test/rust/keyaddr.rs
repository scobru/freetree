// Local cross-check (not committed): the contract address freetree's JS derives must equal freenet-stdlib's.
use freenet_stdlib::prelude::*;
#[test]
fn print_address() {
    let wasm = std::fs::read(std::env::var("WASM").unwrap()).unwrap();
    let params = format!("radica/freetree/{}|{}", std::env::var("PK").unwrap(), std::env::var("APP").unwrap());
    let key = ContractKey::from_params_and_code(Parameters::from(params.into_bytes()), &ContractCode::from(wasm));
    println!("RUST_ID={}", key.id());
    println!("RUST_CODE={}", key.code_hash());
}
