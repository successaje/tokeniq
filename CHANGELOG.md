# Changelog

All notable changes to TokenIQ. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow [Semantic Versioning](https://semver.org/).

## [2.0.0-rc.1] — unreleased

A rebuild from a clean tree on the `tokeniq-2` branch. TokenIQ 2.0 shares no code with v1. It is a treasury intelligence and operations product for crypto-native organizations, not a yield dashboard. Not independently audited; see [Known limitations](docs/KNOWN_LIMITATIONS.md) and [`audits/RELEASE_RISKS.md`](audits/RELEASE_RISKS.md).

### Added

- **Deterministic treasury engine** (`packages/core`):
  - bigint money with explicit rounding;
  - a reserve requirement taken as the strictest of floor, runway and obligations-in-horizon with buffer;
  - deployable surplus under exposure caps, and a cash-flow projection;
  - policy validation, recommendations, approval tiers, risk alerts and scenarios.
- **Treasury overview and accounts:**
  - Safes and wallets on Ethereum, Base, Arbitrum and Optimism, priced with Chainlink with staleness and L2 sequencer checks;
  - watch-only until control is proven with a single-use signed challenge.
- **Obligations and payments:**
  - one-off and recurring commitments in USD or EUR, with documents;
  - payments marked or verified against on-chain transfers.
- **Reserves and scenarios:** coverage, shortfall, binding rule, projection, and hypothetical stress tests that write nothing.
- **Opportunities and recommendations:** a code-vetted venue listing (Morpho vaults, Aave v3 USDC). Deploy recommendations are sized by surplus, venue liquidity and concentration caps, and ranked by yield before incentive rewards.
- **Approval center:** controlled execution in three separate tracks.
  - Internal approval with tiers, roles, separation of duties and expiry.
  - Safe owner signatures over a simulated, decoded transaction built from code-defined targets.
  - Execution tracked through receipts, Safe events and confirmation depth, then reconciled.
- **Copilot:** answers about the treasury using read-only and hypothetical tools scoped to the organization, with untrusted text marked as data. Optional.
- **Risk monitoring and notifications;** reports, CSV exports and an append-only audit trail.
- **Team and policies:** invitations, roles and versioned policies with conflict detection; a clearly labelled sample workspace.
- **Web app:**
  - Next.js 16 with the "Ledger Grid" design system in light and dark;
  - a public site, onboarding, a command palette, and an installable PWA that never caches financial data;
  - a Safe App connector.
- **API:** Hono with OpenAPI 3.1; Better Auth sign-in by email code, passkey or Sign-In with Ethereum; pg-boss jobs; Postgres with append-only guards.
- **`TreasuryReserveGuard`:** an optional Safe v1.5.0 module guard with unit, fuzz, invariant and fork tests. Not deployed.
- **Tests:**
  - engine property tests;
  - chain unit and live tests;
  - API integration, security (48 adversarial) and governance tests;
  - a Base-fork end-to-end test of the full money path;
  - Playwright journeys with axe accessibility checks in light and dark, phone layouts and performance budgets.
- **CI:** typecheck, tests, web build, browser end-to-end, fork test (when `BASE_RPC_URL` is set), Foundry, secret scanning and dependency audit.
- **Documentation:** product vision, PRD, competitive research, architecture and ADRs, API, data model, contracts, design system, user flows, security, testing, deployment, operations, incident response, release checklist, roadmap, exit guide and upstream issues.

### Security

- Internal backend review: 2 High and 10 Medium findings. Both Highs and most Mediums are fixed with regression tests; the remaining items are recorded in [`audits/BACKEND_REVIEW.md`](audits/BACKEND_REVIEW.md).
  - Amounts are bound to token quantities, and payments to recorded payees.
  - Execution hashes are scoped per proposal, and approvals are race-safe.
  - Approval policy is snapshotted per proposal.
  - Approvals lapse when approvers leave or are demoted.
  - New or changed payee addresses are held for 48 hours.
- Internal frontend, contract and dependency reviews are in [`audits/`](audits/).

### Removed

- TokenIQ v1 (Next.js dashboard, Supabase backend, legacy vault contracts) is not part of 2.0. It is preserved at tag `v1-legacy-2025` and must not be deployed.
