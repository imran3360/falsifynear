# FalsifyNEAR contract — deploy plan (runs in GitHub Codespaces)

Contract account: **falsifynear.testnet** (subaccount of imran3360.testnet)
Claims hash to seal: **0cac2dad99f08f8dd08cb6fed5cdd9f94139051b682031c18dc96c6c87e09d86**
(verify any time: `sha256sum claims.txt` in the repo root — it must print exactly this)

Why Codespaces: Imran is on Windows; near-sdk-js needs Node + near-cli.
Codespaces gives a Linux box in the browser — nothing to install locally.
This recipe follows the one PROVEN for CleanRoom Seal on 2026-11-13
(near-sdk-js build compiled first try in Milo's test env).

## Steps (Imran approves wallet/CLI actions; testnet only)
1. Create the public GitHub repo `falsifynear` and upload this project
   (index.html, claims.txt, README.md at root, contract/ as a folder).
2. Open the repo in GitHub Codespaces.
3. In the Codespaces terminal — BUILD:
   - `mkdir -p contract/src && cp contract/falsify-contract.js contract/src/contract.js && cd contract`
   - `package.json`: {"name":"falsify-contract","version":"1.0.0","type":"module",
     "scripts":{"build":"near-sdk-js build src/contract.js build/contract.wasm"},
     "dependencies":{"near-sdk-js":"latest"}}
   - `npm install --no-audit --no-fund` (~1 min)
   - `npm run build` → `build/contract.wasm` ✔
   (near-sdk-js decorators build fine as plain .js; no template needed.)
   Deploy CLI: JS `near-cli` via npm (`npx near-cli ...`).
   near-cli-rs via npx FAILED silently in Milo's test env — do not rely on it first.
4. Create the subaccount (funded from imran3360.testnet, which holds faucet NEAR):
   - `npx near-cli account create-account fund-mint ... ` — if the JS CLI subcommand
     differs, use near-cli-rs: `near account create-account create-sub-account`
     or the simplest proven route: from the Codespaces terminal where
     imran3360.testnet credentials already exist (created 2026-11-12):
     `npx near-cli create-account falsifynear.testnet --masterAccount imran3360.testnet --initialBalance 1`
   - Initial balance 1 test NEAR is plenty (deploy + a few calls).
5. Deploy:
   - `npx near-cli deploy falsifynear.testnet build/contract.wasm`
6. Seal the claims — THE chronology step. Do this BEFORE running the live
   test for the official verdict, and before submission:
   - `npx near-cli call falsifynear.testnet register_claims '{"claims_hash":"0cac2dad99f08f8dd08cb6fed5cdd9f94139051b682031c18dc96c6c87e09d86"}' --accountId imran3360.testnet`
   - A second register_claims call MUST fail with "claims already registered" —
     that failure is the immutability proof; it is expected and good.
7. Verify the seal (views — free, no account needed):
   - `npx near-cli view falsifynear.testnet get_claims`
     → returns {owner, claims_hash: 0cac2dad…, block_height, timestamp_ms}
   - `npx near-cli view falsifynear.testnet verdict_count` → 0
   - Also verify on NearBlocks testnet: methods list shows `register_claims`,
     `record_verdict`, `get_claims`, `get_verdicts`, `verdict_count` — and NO
     method that accepts or returns any claim text, document, or personal data.
   - The live page (Section 1) does the same get_claims read in the browser and
     shows MATCH against the SHA-256 it computes from claims.txt itself.
8. After the official live run on the page: copy the results-hash the page
   displays and seal the verdict (passed/total from the run, e.g. 4 of 6):
   - `npx near-cli call falsifynear.testnet record_verdict '{"results_hash":"<64hex from page>","passed":4,"total":6}' --accountId imran3360.testnet`
   - `npx near-cli view falsifynear.testnet verdict_count` → 1
   - Take the submission screenshot AFTER this, so the page verdict and the
     on-chain record agree.

## Hard rules
- Testnet only. Mainnet is only Imran's payout address (livewheat2666.near) —
  never deploy or call anything on mainnet for this project.
- No keys/seeds in the repo, ever. Codespaces credentials stay in Codespaces.
- Never edit claims.txt after sealing — any edit changes the hash and the
  page will show MISMATCH against the sealed record. If claims must change,
  that is a new version and a fresh contract account, stated honestly.
- If the contract is not deployed + claims sealed before the submission
  deadline, submit honestly WITHOUT the seal claim (the page shows
  "seal not found yet") — never backdate or fake a seal.
