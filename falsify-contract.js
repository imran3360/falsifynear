// FalsifyNEAR — claims + verdict seal contract for NEAR testnet (near-sdk-js)
// Stores ONLY hashes + counts. Never stores any document or personal data.
// The claims hash is registered ONCE and can never be replaced — that
// immutability is the chronology guarantee: the claims existed, sealed,
// before any verdict was computed. Verdicts are append-only records of
// (results hash, passed, total) so anyone can check a sealed verdict
// against the live results JSON published by the page.
// Deploy guide: see DEPLOY.md in this folder.
import { NearBindgen, call, view, near } from "near-sdk-js";

@NearBindgen({})
class FalsifyContract {
  constructor() {
    this.claims = { owner: "", claims_hash: "", block_height: 0, timestamp_ms: 0 }; // single claims record, set exactly once
    this.verdicts = []; // array of verdict records (append-only)
  }

  // Register the SHA-256 hash of the claims file. Callable once only —
  // a second call throws, so the sealed claims can never be swapped
  // after results are known.
  // args: { claims_hash } — 64-char lowercase hex SHA-256 string.
  @call({})
  register_claims({ claims_hash }) {
    if (!/^[0-9a-f]{64}$/.test(claims_hash || "")) throw new Error("claims_hash must be a SHA-256 hex string");
    if (this.claims && this.claims.claims_hash) throw new Error("claims already registered — the sealed claims are immutable");
    const record = {
      owner: near.predecessorAccountId(),
      claims_hash,
      block_height: Number(near.blockHeight()),
      timestamp_ms: Number(near.blockTimestamp() / 1000000n),
    };
    this.claims = record;
    near.log(`CLAIMS SEALED ${claims_hash} by ${record.owner}`);
    return record;
  }

  // Record one verdict run: the SHA-256 hash of the results JSON the
  // page produced, plus how many claims passed out of how many tested.
  // args: { results_hash, passed, total }
  @call({})
  record_verdict({ results_hash, passed, total }) {
    if (!/^[0-9a-f]{64}$/.test(results_hash || "")) throw new Error("results_hash must be a SHA-256 hex string");
    if (!this.claims || !this.claims.claims_hash) throw new Error("no claims registered yet — seal the claims before recording verdicts");
    const p = Number(passed);
    const t = Number(total);
    if (!Number.isInteger(p) || !Number.isInteger(t) || p < 0 || t < 0 || p > t) {
      throw new Error("passed/total must be integers with 0 <= passed <= total");
    }
    const record = {
      owner: near.predecessorAccountId(),
      results_hash,
      passed: p,
      total: t,
      block_height: Number(near.blockHeight()),
      timestamp_ms: Number(near.blockTimestamp() / 1000000n),
    };
    this.verdicts.push(record);
    near.log(`VERDICT ${p}/${t} results ${results_hash} by ${record.owner}`);
    return record;
  }

  @view({})
  get_claims() {
    return (this.claims && this.claims.claims_hash) ? this.claims : null;
  }

  @view({})
  get_verdicts({ from_index = 0, limit = 20 } = {}) {
    return this.verdicts.slice(from_index, from_index + limit);
  }

  @view({})
  verdict_count() {
    return this.verdicts.length;
  }
}
