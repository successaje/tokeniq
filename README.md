# TokenIQ

Treasury intelligence and operations for crypto-native organizations: DAOs, Web3 companies and protocol teams that hold stablecoins in Safes and wallets.

TokenIQ reads what the organization actually controls. It takes the obligations the treasury must meet (payroll, vendors, grants), works out how much has to stay protected under the organization's own policy, and shows what is left to deploy. Moving money follows a controlled path: a deterministic policy check, internal approval by the right people, Safe owners signing the exact transaction in their own wallets, and on-chain execution that TokenIQ tracks and reconciles.

> **Status: pre-release.** TokenIQ 2.0 has not been independently audited. Its contract, backend and frontend reviews are internal self-reviews (see [`audits/`](audits/)). No smart contract is deployed. Read [Known limitations](docs/KNOWN_LIMITATIONS.md) before relying on it.

## What it does

| Module | What you get |
|---|---|
| **Treasury overview** | Balances across Safes and wallets on Ethereum, Base, Arbitrum and Optimism, priced with Chainlink, with freshness shown on every figure. Accounts stay watch-only until a member proves control by signing a challenge. |
| **Obligations and payments** | One-off and recurring commitments in USD or EUR, with documents. Payments are recorded and verified against on-chain transfers. |
| **Reserves and liquidity** | The amount to protect is the strictest of a minimum floor, months of runway, and obligations due within the horizon plus a buffer. It shows coverage, shortfall, a cash-flow projection and stress scenarios that never write anything. |
| **Opportunities and recommendations** | A code-vetted list of USDC venues (Morpho vaults, Aave v3), checked against the policy. Recommendations are sized by deployable surplus, venue liquidity and concentration caps, never by APY alone. |
| **Approval center** | Proposals go through approval tiers by amount, role requirements and separation of duties (no self-approval), and expire. Safe signatures are collected and the transaction is simulated before anyone signs. |
| **Copilot** | Answers questions about the treasury using read-only tools and hypothetical scenarios. It cannot create, approve or sign anything. Optional; needs an Anthropic API key. |
| **Risk monitoring** | Alerts with evidence and a next step: reserve shortfall or thin coverage, overdue or unfunded obligations, stablecoin depegs, asset and protocol concentration, stale prices or syncs, venue liquidity and warnings, unexpected balance changes, L2 sequencer downtime, degraded data providers. |
| **Reports and audit** | An append-only audit trail of every change, CSV exports guarded against formula injection, and printable snapshots. |

There is also a clearly labelled **sample workspace**. Its figures are simulated, and nothing in it can be signed or executed.

## How money moves

Three separate tracks, so no single actor (or model) can move funds:

1. **Policy and internal approval (TokenIQ).** The engine re-validates the action against current data. Members with the right roles approve it according to the policy's tiers.
2. **Cryptographic authorization (Safe owners).** TokenIQ builds the Safe transaction from addresses defined in code, simulates it, and shows the decoded calls and the `safeTxHash`. Owners sign in their own wallets. TokenIQ never holds keys.
3. **Execution and reconciliation (chain).** Any wallet submits the transaction. TokenIQ tracks the receipt, the Safe's `ExecutionSuccess`/`ExecutionFailure` event and confirmation depth, then re-reads balances.

The AI copilot sits outside all three tracks.

## Repository layout

```
apps/
  web/        Next.js 16 app: public site, onboarding, the product (/app), PWA
  api/        Hono API (OpenAPI 3.1), Better Auth, pg-boss jobs, copilot
  e2e/        Playwright journeys, axe accessibility checks, performance budgets
packages/
  core/       Deterministic engine: money (bigint), reserves, policy, approvals, risk, scenarios
  chain/      viem: chains, tokens, Chainlink, Safe, MultiSend, ERC-4626, Aave, Morpho, payments
  db/         Drizzle schema and SQL migrations (Postgres 16)
  contracts/  Foundry: TreasuryReserveGuard, an optional Safe module guard (not deployed)
docs/         Product, architecture, API, operations and research
audits/       Internal reviews, threat model and release risks
```

## Quick start

Requirements: Node 24, pnpm 10, Postgres 16. Optional: Foundry (contracts and fork tests).

```bash
pnpm install
cp .env.example .env
```

Set `DATABASE_URL` in `.env` to a local database. With Docker, `docker compose up -d` starts Postgres on port 5433: `postgres://tokeniq:tokeniq@localhost:5433/tokeniq`. Set `BETTER_AUTH_SECRET` to the output of `openssl rand -hex 32`.

```bash
pnpm dev
```

Open http://localhost:3000. Without SMTP configured, sign-in codes are printed in the API log. Migrations run at boot in development.

## Tests

```bash
pnpm typecheck
pnpm test                                  # engine, chain (offline) and API integration tests; needs TEST_DATABASE_URL
pnpm test:e2e                              # browser journeys, axe in light and dark, phone layouts, performance budgets
pnpm contracts:test                        # Foundry unit, fuzz, invariant and fork tests
```

`TEST_DATABASE_URL` and `E2E_DATABASE_URL` must point to throwaway databases, because the suites drop and recreate their schemas. To run the full controlled-execution path against a local fork of Base (it needs `anvil`):

```bash
FORK_E2E=1 TEST_DATABASE_URL=postgres://localhost:5432/tokeniq_fork pnpm --filter @tokeniq/api exec vitest run test/fork-execution.test.ts
```

See [Testing](docs/TESTING.md) for what each layer proves, and what it does not.

## Documentation

- Product: [Vision](docs/PRODUCT_VISION.md) · [PRD](docs/PRD.md) · [Competitive research](docs/COMPETITIVE_RESEARCH.md) · [User flows](docs/USER_FLOWS.md) · [Design system](docs/DESIGN_SYSTEM.md)
- Engineering: [Architecture](docs/ARCHITECTURE.md) · [Decisions (ADRs)](docs/adr/) · [API](docs/API.md) · [Data model](docs/DATA_MODEL.md) · [Contracts](docs/CONTRACTS.md) · [Testing](docs/TESTING.md)
- Operations: [Deployment](docs/DEPLOYMENT.md) · [Operations](docs/OPERATIONS.md) · [Incident response](docs/INCIDENT_RESPONSE.md) · [Release checklist](docs/RELEASE_CHECKLIST.md)
- Security: [Security](docs/SECURITY.md) · [Threat model](audits/THREAT_MODEL.md) · [Reviews](audits/) · [Known limitations](docs/KNOWN_LIMITATIONS.md) · [Upstream issues](docs/UPSTREAM_ISSUES.md)
- [Roadmap](docs/ROADMAP.md) · [Changelog](CHANGELOG.md)

## Security

Please do not open public issues for vulnerabilities. See [docs/SECURITY.md](docs/SECURITY.md) for how to report one privately.

## Licence

No licence has been chosen yet. The source is public to read, but without a licence no reuse rights are granted. TokenIQ v1 is preserved at tag `v1-legacy-2025`.
