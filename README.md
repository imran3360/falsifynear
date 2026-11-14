# FalsifyNEAR — an investment thesis that tries to kill itself

**NEAR Hackathon · Thesis track.** Built by Imran (GitHub: imran3360).
Contract: **falsifynear.testnet** (NEAR testnet). Payout: livewheat2666.near.

> **NOT FINANCIAL ADVICE.** This is a public experiment in falsifiable analysis,
> not a recommendation to buy, sell, or hold NEAR or any other asset.

## What this is

A one-page, live investment thesis for NEAR that is built to be able to lose.
Six claims about NEAR — covering Intents usage, TVL, chain fees, validator
decentralization, market cap, and price recovery — were written down with hard
numeric pass/fail thresholds **before any verdict was computed**. The claims
file was hashed (SHA-256) and that hash was sealed in a NEAR testnet contract
whose claims record can only ever be written once. The page then re-tests the
claims **live, in the visitor's browser**, against keyless public APIs, and
renders PASS / FAIL per claim and an overall verdict:

- 5–6 pass → **THESIS HOLDS**
- 3–4 pass → **THESIS PARTIALLY BROKEN**
- 0–2 pass → **THESIS BROKEN**
- A claim whose data source cannot be reached is **UNVERIFIABLE** — excluded
  from the pass count, shown distinctly, never guessed.

On the night this was built, the live data said: 4 pass, 2 fail
(fees and price recovery) — **PARTIALLY BROKEN**. That honesty is the product.

**The full thesis** — what would have to be true for NEAR to be a good bet,
why each of the six bars was set where it was, the volume-vs-value-capture
contradiction faced head-on, competition and risks — is written out on the
site itself — the dashboard at https://falsifynear.pages.dev **is** the
thesis (home page, 11 sections); the live falsification test runs at
https://falsifynear.pages.dev/test.html.

## Why (vs. one-sided thesis dashboards)

Most "thesis" dashboards are marketing: they choose flattering metrics, show
only what supports the conclusion, and carry no disclaimer. FalsifyNEAR
inverts every part of that:

- **Thresholds before data.** The pass bars were fixed in writing first and
  hash-sealed on-chain, so they cannot be quietly moved after results arrive.
- **The bear case is on the page.** Fees are thin, price is ~84% below its
  all-time high, TVL clears its bar by only ~3.5% — stated up front.
- **Two claims are expected to fail**, and when they do, the page says so in
  the same size type as the passes.
- **Named builder, visible NOT FINANCIAL ADVICE notice**, and every figure
  links to the public source it came from.

## The six claims

| # | Claim | Source | Pass threshold |
|---|-------|--------|----------------|
| C1 | NEAR Intents 30-day swap volume ≥ $3.0B | DefiLlama `api.llama.fi/summary/dexs/near-intents` (`total30d`) | ≥ 3,000,000,000 USD |
| C2 | NEAR chain TVL ≥ $150M | DefiLlama `api.llama.fi/v2/chains` (name=Near, `tvl`) | ≥ 150,000,000 USD |
| C3 | NEAR chain fees, 30 days ≥ $250K | DefiLlama `api.llama.fi/summary/fees/near` (`total30d`) | ≥ 250,000 USD |
| C4 | NEAR mainnet current validators ≥ 300 | NEAR mainnet RPC `validators` (`current_validators` length) | ≥ 300 |
| C5 | NEAR market cap ≥ $4.0B | CoinGecko `api.coingecko.com/api/v3/coins/markets` (ids=near, `market_cap`) | ≥ 4,000,000,000 USD |
| C6 | NEAR price within 50% of all-time high | CoinGecko (ids=near, `ath_change_percentage`) | ≥ −50% |

The exact claims text lives in [`claims.txt`](claims.txt) — that file, byte
for byte, is what was hashed and sealed.

Claims hash (SHA-256 of claims.txt):
**0cac2dad99f08f8dd08cb6fed5cdd9f94139051b682031c18dc96c6c87e09d86**

## How the chronology proof works — and how to verify it yourself

1. The claims were written into `claims.txt` and frozen.
2. `sha256sum claims.txt` →
   `0cac2dad99f08f8dd08cb6fed5cdd9f94139051b682031c18dc96c6c87e09d86`
3. The contract's `register_claims` was called once with that hash. The
   contract stores {owner, claims_hash, block_height, timestamp_ms} and
   **rejects any second registration** — the sealed claims are immutable, so
   the seal's block height/timestamp provably predate any verdict.
4. Anyone can re-check, without trusting this page or its builder:
   - Download `claims.txt` from this repo and run `sha256sum claims.txt`.
   - Read the contract on NEAR testnet — a keyless view call to
     `https://rpc.testnet.near.org`, method `query` / `call_function`,
     account `falsifynear.testnet`, method `get_claims`, args `{}` —
     or `near view falsifynear.testnet get_claims` with near-cli.
   - The two hashes either match or they don't. The live page performs
     exactly this comparison in your browser and shows MATCH / MISMATCH.
5. Verdicts are sealed the same way: each run produces a results JSON on the
   page; its SHA-256 is recorded via `record_verdict({results_hash, passed,
   total})`, so the verdict of record can be checked against the exact
   results that produced it (`get_verdicts` / `verdict_count`).

### Verify the official verdict yourself

The official run (2026-11-14 21:20 Dhaka) scored **4 of 6 — PARTIALLY
BROKEN** and was sealed as verdict #1 (block 277675514, results hash
`1b5ce91c288174841d825dad4ae3f4b8bdc89f76487dc1edbd0970a147624595`).
The exact results JSON is published in this repo as
[`official-results.json`](official-results.json) — check it end-to-end:

- `sha256sum official-results.json` →
  `1b5ce91c288174841d825dad4ae3f4b8bdc89f76487dc1edbd0970a147624595`
  (the file is stored byte-exact as the page produced it — no trailing
  newline; adding one changes the hash, which is precisely the kind of
  detail a hash seal exists to catch).
- `near view falsifynear.testnet get_verdicts` → verdict #1 carries the
  same results hash, `passed: 4`, `total: 6`, recorded by the claims owner
  at block 277675514 — after the claims seal at block 277671036.

Contract source: [`falsify-contract.js`](falsify-contract.js) ·
deploy recipe: [`DEPLOY.md`](DEPLOY.md). The contract stores
**only hashes and counts** — never any document, claim text, or personal data.

## Architecture

- **Static single page** (`index.html`) — no build step, no server, no API
  keys, no external scripts or fonts. All data is fetched in the visitor's
  browser from CORS-open public APIs (DefiLlama, CoinGecko, NEAR mainnet RPC).
- **Read-only seal check** — the page reads `get_claims()` from the testnet
  contract via keyless RPC view calls.
- **Sealing via CLI only** — `register_claims` (once) and `record_verdict`
  (per official run) are called from the builder's CLI; the page itself never
  asks visitors for a wallet or a signature.

## Honest limits

- **Public APIs have rate limits and downtime** (CoinGecko's free tier in
  particular). That is what the UNVERIFIABLE state is for; a failed fetch is
  never converted into a pass or a fail.
- **Figures move.** TVL, fees, volume, and price change by the minute; a
  claim near its threshold (TVL especially) can flip between runs. The seal
  fixes the *thresholds*, not the data.
- **The contract is a testnet demo** — unaudited, and it stores hashes only;
  it holds no funds and no user data.
- **DefiLlama/CoinGecko are aggregators**; their methodologies can change.
  Every figure on the page links to its source so the number can be audited
  at the origin.

## Contract fix note (2026-11-14)

The first deployed build (code hash `FH3owTViksxaiATrmZbvYh9YMSXg8F3XwmdXf3BfiEyR`)
initialized the claims field to `null`; in near-sdk-js that breaks state
reconstruction once a real record is stored, so every view panicked after
`register_claims` succeeded. The claims seal itself was never at risk — it is
in the `register_claims` transaction (tx
`7axaubcY1QWb2UGZGBzSyQohPAdcFmuBSkXKWdKogzY`, block 277671036). The fix
initializes the field to an empty record object instead of `null`; the
patched build (code hash `HAcd5RCdvZLU1p5t7BR2x2wfiTLGXqRmnk4EnaKLPZk1`,
redeploy tx `uQetLtdJvZTSsqVYRRE7zobFKjfY2WQYKYKVxDLABuH`) replaced only the
code — the sealed record survived untouched and `get_claims` now returns it.

**Second fix (2026-11-14, after an external review panel):** the first build
let *any* account call `record_verdict`, so unofficial verdicts could have
polluted the verdict list. `record_verdict` now requires the caller to be
the claims owner and throws otherwise; verified live by a negative test
(a non-owner call is rejected) after redeploy. The claims seal and the
official verdict record survived this redeploy untouched, as before — the
chronology anchors are the on-chain transactions themselves
(`register_claims` at block 277671036, verdict at block 277675514), which no
redeploy can rewrite.

## Cross-disclosure

FalsifyNEAR is one of two independent NEAR Hackathon entries by the same builder; the other is CleanRoom Seal (github.com/imran3360/cleanroom-seal). Cross-disclosed per hackathon rules.

**NOT FINANCIAL ADVICE.** Testnet contract; data from public APIs; figures
change over time.
