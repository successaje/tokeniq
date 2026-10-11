# Testing

| Layer | What it proves | Where | Run |
|---|---|---|---|
| Engine unit and property tests | Exact money maths (round-trips, rounding brackets); calendar-correct recurrence; reserve rules and binding rule; deployable never exceeds the reserve or cap; policy validation; recommendations are deterministic; approval tiers, roles and expiry; risk rules de-duplicate; scenarios | `packages/core/test` (Vitest + fast-check) | `pnpm --filter @tokeniq/core test` |
| Chain unit tests | MultiSend encoding vectors; Safe EIP-712 hashing; EIP-712 and `eth_sign` signer recovery; signature ordering; Aave APY maths; Morpho response mapping from recorded fixtures; staleness rules | `packages/chain/test` | `pnpm --filter @tokeniq/chain test` |
| Chain live tests | Real mainnet reads: balances, Chainlink, sequencer, Safe info, `safeTxHash` equals on-chain `getTransactionHash`, simulation, MultiSendCallOnly code, Morpho and Aave venues | `packages/chain/test/live.test.ts` | `LIVE_CHAIN_TESTS=1 pnpm --filter @tokeniq/chain test` |
| API integration tests | Real Postgres and real auth flow: email code sign-in, origin checks, organization isolation (404), role permissions, last owner, invitations, policy versioning and conflicts, the automation lock, treasury maths end to end, stale data flagged, scenarios write nothing, append-only audit, CSV injection, proposal lifecycle, copilot tool boundaries and streaming loop | `apps/api/test` | `TEST_DATABASE_URL=… pnpm --filter @tokeniq/api test` |
| Security regression tests | Adversarial scenarios from the backend review (cross-organization access, races, state machine, structured-action consistency, injection) | `apps/api/test/security.test.ts` | as above |
| Controlled execution on a fork | The whole money path against real contracts: a 2-of-3 Safe v1.4.1 created through the canonical factory on an anvil fork of Base, live Chainlink and Morpho data, account verification by an owner's signature (non-owner rejected, challenge not replayable), policy-checked proposal, internal approval, Safe transaction built and simulated, two owner signatures (non-owner rejected), execution, confirmation depth respected before `executed`, vault shares received, position reconciled, full audit trail | `apps/api/test/fork-execution.test.ts` | `FORK_E2E=1 TEST_DATABASE_URL=… pnpm --filter @tokeniq/api vitest run test/fork-execution.test.ts` (needs `anvil`; set `BASE_RPC_URL` for a faster fork) |
| Web unit tests | The client's own check of the Safe typed data before an owner signs (domain, Safe, nonce, decoded calls, amounts, recipients, recomputed hashes); signature `v` normalisation; link and redirect sanitising | `apps/web/src/**/*.test.ts` (Vitest) | `pnpm --filter @tokeniq/web test` |
| Contract tests | Unit, fuzz (1,000 runs), invariant (128 × 64), deploy script, Base mainnet fork with real Safe 1.5.0 and a live Morpho vault | `packages/contracts/test` (Foundry) | `cd packages/contracts && forge test` |
| End to end and accessibility | Journeys in a real browser; axe-core WCAG 2.2 AA checks in light and dark; mobile and tablet layouts | `apps/e2e` (Playwright) | `pnpm test:e2e` |

## Conventions

- Tests that need a database drop and recreate the schema of `TEST_DATABASE_URL`. Use a database dedicated to tests, never one with data.
- Time is injected (`deps.now`) so expiry and staleness are tested deterministically.
- No API test touches the network by default. Chain reads that need RPC run only in the opt-in live and fork suites.
- The copilot is tested with an injected fake Claude client, which checks tool execution, organization scoping, the request shape (model, fallbacks) and persistence. The live model is not called in CI.

## What tests do not prove

- That a third-party protocol is safe, or that a venue remains solvent.
- That a public RPC returns honest data (TokenIQ pins blocks and cross-checks Safe code hashes, but a malicious RPC could still lie about balances).
- That the copilot's wording is right in every case. Its figures come from tools, and its claims are not machine-verified.
- That the guard is free of vulnerabilities. Passing tests and a self-review are not an audit.

## Latest results

Recorded at the end of each milestone in [`audits/RELEASE_RISKS.md`](../audits/RELEASE_RISKS.md). At `78515fa8`: engine 73, chain 62 (plus 11 live), API 118, web unit 22, browser end to end 41, contracts 85, Base fork 6 (local).
