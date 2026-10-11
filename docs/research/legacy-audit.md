# Legacy TokenIQ audit: what existed, what worked, what 2.0 keeps

Audit date: 2026-10-11. Scope: the public web app `successaje/tokeniq` (`main` @ `6855918`, preserved at tag `v1-legacy-2025`) and the private contracts repository `TokenIQ-X/tokeniq-contracts` (`main` @ `fee8164`).

This page is the index. The detailed public editions are:

- [`legacy-frontend-audit.md`](legacy-frontend-audit.md): route-by-route and hook-by-hook inventory with file and line references, build/type/lint results, data sources, security findings and dependency status. Two findings (LF-01, LF-15) are summarised without detail until the owner fixes them.
- [`legacy-contracts-summary.md`](legacy-contracts-summary.md): contract inventory, classification and deployed testnet addresses.

The full findings, including reproduction steps, are in the private repository (`TokenIQ-X/tokeniq-contracts`, branch `security-review-2026-10`, `docs/security/`). This is an internal review, not an independent audit.

## Method

- Every claim was checked against the code or a running build, never against the README.
- Web app:
  - Ran `npm ci`, `next build`, `tsc --noEmit` and `next lint` in a scratch copy, then `next start` with a browser smoke test.
  - Traced each user action from the click handler through the hooks to the contract call, API call or `setTimeout`.
  - Scanned the current tree and the full git history for secrets.
- Contracts:
  - Ran `hardhat compile` and `hardhat test`.
  - Wrote dependency-free Foundry proof-of-concept tests against the real contracts.
  - Read the deployments on-chain, and scanned the deployer's activity on major mainnets.

## Headline results

| Area | Result |
|---|---|
| Web app build | Builds only because type and lint errors are ignored. 270 type errors in 55 files; 423 lint errors, including 7 rules-of-hooks violations |
| Web app reality | Of 30 pages, 2 work end to end, 4 are partly real, 20 are mocked and 4 are broken. 22 flows fake a delay and then show success. One page invents transaction hashes and another reports "Deposit Successful" without checking a receipt |
| Contracts build | Compiles (137 files). Hardhat tests: 80 pass, 1 fails. The four "latest architecture" contracts have no tests |
| Flagship flow | The "AI agent allocates funds" path cannot succeed: an ABI return-type mismatch makes the call always revert, and on-chain the agent address is unset |
| Custody model | A single owner key can withdraw everything to any address. There are no reserve floors, limits or timelocks, and depositors get no shares |
| Deployments | Testnet only (Arbitrum Sepolia, Fuji, Sepolia, Base Sepolia, Core testnet, Sei testnet). No mainnet deployments found. No real funds at risk |
| Secrets | Nothing live in the current tree. One credential in web app history (LF-15) needs rotation by the owner |

## Feature inventory and decisions

Classes: A functional · B demonstrative/mocked · C incomplete · D outdated · E insecure/fragile · F reusable · G needs refactor · H remove · I replace with modern infrastructure · J preserve for history.

| Legacy feature | Evidence (public editions) | Class | TokenIQ 2.0 decision |
|---|---|---|---|
| Treasury vault + AI agent executor | contracts summary; frontend §4 (`/vaults`, `/strategies`) | B · C · E · I | Replaced. Funds stay in the customer's Safe. Actions are deterministic, policy-checked proposals that humans approve and Safe owners sign. Optional automation is bounded on-chain by `TreasuryReserveGuard` plus Zodiac Roles |
| Strategy/vault discovery with fixed APYs | frontend §6 (`discoverData.ts`, hardcoded vault lists) | B · H | Replaced by live venue data (Morpho API and on-chain Aave), with measurement windows, a policy suitability check and an explicit vetted listing |
| Portfolio and balances | frontend §6 (`/portfolio` hardcoded $12,545) | B · H | Replaced. Balances are read on-chain at a pinned block from an allowlist of tokens, priced with Chainlink and flagged when stale |
| Payments page | frontend LF-05 | B · E · H | Replaced. Obligations, schedules and payments verified against on-chain transfers |
| Cross-chain bridge UI (CCIP) | frontend §4; contracts summary (Router V1–V3) | B · C · H | Out of scope for 2.0. Router V3's allowlist pattern is kept as a reference |
| RWA tokenization and invoices | frontend §4 (`/tokenize`, `/rwa`); contracts summary | B · C · H | Out of scope for 2.0 |
| AI chat (ElizaOS, local LLM endpoint) | frontend §5.4, LF-09 | B · E · I | Replaced by a server-side copilot with read-only, organization-scoped tools and cited answers |
| Supabase profiles and auth | frontend LF-01, LF-04 | E · I | Replaced by a passwordless identity layer (email codes, passkeys, Sign-In with Ethereum), server-side roles and an append-only audit log |
| Theming (four providers, missing Tailwind 4 tokens) | frontend §3, §10 | C · H | Replaced by the Ledger Grid design system |
| Brand assets (logo PNGs, favicon) | frontend §12.1 | F · J | Kept in history only. 2.0 introduces a new mark consistent with the product model |
| Chain facts (CCIP routers, testnet chain IDs) | frontend §7 | F (after correction) · J | Not needed for 2.0's networks. Kept as history |
| Testnet contract addresses | contracts summary | J | Recorded in the contracts summary for continuity |

## Guardrails carried into 2.0

These come directly from the legacy failures:

1. No success state without proof. Payments are paid only when verified on-chain, and executions count as executed only after receipts, Safe events and confirmations.
2. No hardcoded financial figures outside clearly labelled samples.
3. Money is exact: bigint fixed-point, never floats.
4. Server-side authorization on every route.
5. No secrets in client bundles. Model calls run server-side.
6. Typecheck, tests and a secret scan run in CI. Builds never ignore type errors.
