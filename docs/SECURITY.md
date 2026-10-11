# Security

How TokenIQ protects treasuries, what it relies on, and how to report a problem.

TokenIQ 2.0 **has not been independently audited**. Everything in [`audits/`](../audits/) is an internal self-review by the people and tools that built it. Passing tests and a self-review are evidence, not assurance.

## Reporting a vulnerability

Please report privately; do not open a public issue.

- **GitHub private vulnerability reporting** ("Report a vulnerability" under the repository's Security tab). *Owner action: this is currently switched off for the repository and must be enabled in its settings.*
- **Email:** the address set in `NEXT_PUBLIC_SECURITY_EMAIL` and shown on `/security` and `/contact` of a deployment. *Owner action: set it before launch; until then the site says "To be configured".*

Include what you found, how to reproduce it, and the impact you expect. The maintainers will acknowledge the report and agree a disclosure date with you. *(Owner action: publish a response-time commitment here before launch.)* Please test only against your own local instance or test organizations, never against other people's data or real funds, and do not run denial-of-service or social-engineering tests.

## Security model

| Principle | How it is enforced |
|---|---|
| **Non-custodial** | TokenIQ never asks for, stores or derives private keys or seed phrases, and it is never a Safe owner. Owners sign in their own wallets. The server stores signatures only, never keys. |
| **No single path to funds** | Moving funds needs three independent things: a passing deterministic policy check plus internal approval in TokenIQ; enough Safe owner signatures over the exact `safeTxHash`; and someone submitting the transaction on-chain. The Safe enforces its own threshold. |
| **Deterministic authority** | Reserve maths, limits, policy checks, approval tiers and calldata are plain TypeScript with bigint arithmetic and explicit rounding (requirements round up, availability rounds down). No language model computes or approves a figure. |
| **AI is advisory** | The copilot's tools are read-only or hypothetical, scoped to the caller's organization by a closure the model cannot change. Member-written text reaches it wrapped as untrusted data, and its history is append-only. It cannot create, approve, sign, execute or change policy. |
| **Code-defined targets** | Transactions are built only for allowlisted tokens and code-vetted venues, using `CALL` (never `DELEGATECALL`) and exact token approvals. The MultiSend contract is `MultiSendCallOnly`. |
| **Simulate before signing** | Every Safe transaction is simulated against current chain state (Safe `simulateAndRevert`) before owners are asked to sign, and again before execution data is released. |
| **Verified control** | Added accounts are watch-only and excluded from reserve maths until a member signs a single-use, organization-bound challenge (a Safe owner for Safes, the wallet itself for wallets). Verification is revoked if the verifying owner leaves the Safe. |
| **Honest data** | Prices come from Chainlink with heartbeat-based staleness. L2 prices are gated on the sequencer uptime feed. USD stablecoins are never valued above $1 for reserves. Stale or missing data is shown as such, never filled in. |
| **Isolation** | Every organization-scoped route checks membership. Non-members get 404, so ids do not leak. Role permissions are a single matrix (`apps/api/src/lib/authz.ts`). |
| **Accountability** | The audit log, approvals, policy versions and Safe signatures are append-only, enforced by database triggers as well as code. |

## Application controls

- **Authentication:** email one-time codes (6 digits, 10 minutes, 5 attempts, stored hashed), passkeys (WebAuthn), and Sign-In with Ethereum. There are no passwords. Sessions are HTTP-only cookies.
- **Request forgery:** an explicit Origin/Referer check on every state-changing API request, plus SameSite cookies. Hono's `csrf()` alone does not cover JSON requests ([upstream note](upstream-issues/hono-csrf-json-docs.md)).
- **Headers:**
  - A strict Content-Security-Policy, with `frame-ancestors` limited to Safe{Wallet} for the Safe App.
  - `nosniff`, a referrer policy, and HSTS in production.
- **Abuse limits:**
  - Per-route rate limits on sign-in endpoints, and a per-user/IP limit on the API.
  - Request body size limits.
- **Input handling:**
  - Every input is validated with zod at the edge.
  - Money travels as decimal strings, never floats.
  - Dates are validated as real calendar dates.
- **Output:**
  - CSV exports neutralise spreadsheet formulas.
  - The copilot's markdown renderer does not render raw HTML.
- **Secrets and logs:**
  - Secrets live only in environment variables, and logs redact cookies, authorization headers, signatures and email codes.
  - gitleaks runs in CI on every commit.
- **PWA:** the service worker never caches API responses or signed-in pages, and nothing that moves funds is queued offline.
- **Kill switches:** `DISABLED_FEATURES` can switch off the copilot, proposals, signatures, sync, opportunities or email without a deploy.

## Optional on-chain guard

`packages/contracts` contains `TreasuryReserveGuard`, a Safe v1.5.0 module guard that enforces per-module limits on-chain. It is **not deployed anywhere** and the product does not depend on it. Deploying it changes Safe permissions, so it requires the owners' explicit decision and, before holding meaningful value, an external audit. See [Contracts](CONTRACTS.md) and [`audits/CONTRACT_REVIEW.md`](../audits/CONTRACT_REVIEW.md).

## Reviews and evidence

| Document | Scope |
|---|---|
| [`audits/THREAT_MODEL.md`](../audits/THREAT_MODEL.md) | Assets, actors, trust boundaries, abuse cases |
| [`audits/BACKEND_REVIEW.md`](../audits/BACKEND_REVIEW.md) | API, engine and chain package |
| [`audits/FRONTEND_REVIEW.md`](../audits/FRONTEND_REVIEW.md) | Web app, signing UX, CSP, service worker, accessibility |
| [`audits/CONTRACT_REVIEW.md`](../audits/CONTRACT_REVIEW.md) | `TreasuryReserveGuard` |
| [`audits/DEPENDENCY_REVIEW.md`](../audits/DEPENDENCY_REVIEW.md) | Dependencies, licences, supply chain |
| [`audits/REMEDIATION_LOG.md`](../audits/REMEDIATION_LOG.md) | Every finding and what was done about it |
| [`audits/RELEASE_RISKS.md`](../audits/RELEASE_RISKS.md) | What remains open at release |

## Legacy TokenIQ v1

The v1 application (tag `v1-legacy-2025`) is retired and must not be deployed. Its history includes a client-side database key for a hosted backend whose access rules were permissive. The owner should rotate or retire that project. Details are kept privately, not in this public repository.
