# Backend security review

> Internal security review by an AI-assisted engineering process. **Not an independent third-party audit.**

| Item | Value |
|---|---|
| Scope | `apps/api/src/**`, `packages/core/src/**`, `packages/chain/src/**`, `packages/db/src/schema.ts` and migrations, `apps/api/test/*`; `apps/web` read only where it shapes a backend boundary |
| Date | 2026-10-11, branch `tokeniq-2`, uncommitted working tree on top of `924f12c2` |
| Method | Manual review of every route, middleware, engine function and chain helper; adversarial tests against the running app (in-process) with a scripted EVM node (`apps/api/test/mock-chain.ts`); race tests with concurrent requests; fix-then-revert checks that the race tests fail without the fix |
| Tests added | `apps/api/test/security.test.ts` (48 tests), `packages/core/test/decisions.test.ts` (7 tests, "validateAction binds amounts and payees"), `packages/core/test/money.test.ts` (decimalString bounds) |
| Threat model | [`THREAT_MODEL.md`](THREAT_MODEL.md) · Fix log: [`REMEDIATION_LOG.md`](REMEDIATION_LOG.md) |

Severity: **High** = a single insider role (or an outsider) can bypass a financial control or move funds against policy given owner signatures that rely on TokenIQ's checks. **Medium** = integrity or availability of a control is breakable under plausible conditions, or cross-tenant interference. **Low** = limited impact or needs unusual conditions. **Info** = hardening note.

## Summary

| ID | Severity | Title | Status |
|---|---|---|---|
| BE-01 | High | USD amount of a structured action was not bound to the token amount moved on-chain | Fixed |
| BE-02 | High | Payment proposals could send to any address, in any asset, on any network | Fixed |
| BE-03 | Medium | Approval decisions were not serialised and had no per-member uniqueness | Fixed |
| BE-04 | Medium | Another organization could squat a public transaction hash and block execution tracking | Fixed |
| BE-05 | Medium | One on-chain transfer could mark any number of obligation occurrences "paid (verified)" | Fixed |
| BE-06 | Medium | Client IP spoofable; Better Auth limits collapse into one shared bucket behind proxies; no per-email OTP limit | Fixed (needs `TRUSTED_PROXY_COUNT` in production) |
| BE-07 | Medium | Testnet tokens (valued at $1) could be mixed into a mainnet organization's reserve | Fixed |
| BE-11 | Medium | Cancelling a proposal does not revoke collected Safe signatures | Open (product change) |
| BE-13 | Medium | Concurrent GET /alerts (and recommendation refreshes) returned 500 on a duplicate key | Fixed (reported by the lead's browser E2E suite) |
| BE-16 | Medium | One admin can weaken approval/treasury policy for proposals already in flight | Fixed for approval policy (`3e57c556`); residual noted |
| BE-17 | Medium | Finance can change an obligation's payee address and then propose paying it | Fixed: payee hold, audit, notification (`3e57c556`); residual noted |
| BE-18 | Medium | RPC trust: owners, nonce, balances, receipts and smart-account signature checks come from the RPC | Accepted with recommendations |
| BE-08 | Low | Structured actions were accepted as `z.any()` | Fixed |
| BE-09 | Low | Copilot: recommendation and alert text reached the model unwrapped | Fixed |
| BE-10 | Low | Last-owner rule had a check-then-act race | Fixed |
| BE-12 | Low | Amounts that overflow `numeric(38,18)` returned 500 | Fixed |
| BE-14 | Low | Concurrent creates with one idempotency key returned 500 | Fixed |
| BE-15 | Low | Revoked sessions stay valid for up to 60 s (signed cookie cache) | Accepted, documented |
| BE-19 | Low | Better Auth routes had no origin check for non-form content types | Fixed |
| BE-20 | Low | Resource abuse: viewers can trigger syncs; unbounded sample workspaces, documents and copilot history | Open |
| BE-21 | Low | `Idempotency-Key` header sent by the web app is ignored by the API | Open |
| BE-22 | Low | Two identical proposals prepared at the same nonce hit `proposals_safe_tx_hash_uq` (500) | Open |
| BE-23 | Low | Control characters allowed in organization and user names used in emails and signed messages | Open |
| BE-24 | Low | EUR obligations paid in EURC were verified without an amount check | Fixed |
| BE-25 | Low | Production config does not enforce HTTPS `APP_URL`, dedicated RPCs or `TRUSTED_PROXY_COUNT` | Open |
| BE-26 | Low | Payment verification does not require the sender to be an organization account | Open (product decision) |
| BE-27 | Low | Approved proposals never expire | Accepted |
| BE-28 | Info | Safe state is read at `latest − confirmations`; a prepare right after an execution can use a stale nonce | Accepted (fails safe) |
| BE-29 | Info | Unhandled-error logs include Drizzle query parameters | Partly fixed (wider redaction) |
| BE-30 | Info | Web CSP allows `'unsafe-inline'` scripts (cross-cutting, web) | Open (web) |
| BE-31 | Info | Append-only triggers can be dropped by the table-owner role the app connects as | Open (ops) |
| BE-32 | Info | A decoy transaction recorded first marks a proposal `failed` until the real hash is recorded again | Accepted (recoverable) |
| — | By design | Viewers can export CSV reports (`reports.export` includes `viewer`, `lib/authz.ts:27`) | Intentional: exports contain only data viewers can already read; documented here |

Counts: 2 High, 10 Medium, 15 Low, 5 Info. Fixed: 2 High, 6 Medium, 7 Low (+1 Info partly). Open/accepted: 4 Medium, 8 Low, 4 Info.

---

## High

### BE-01 · USD amount not bound to the token amount

- **Severity:** High
- **Component:** `packages/core/src/actions.ts:47-151` (`validateAction`, pre-fix); consumers `apps/api/src/modules/proposals.ts` (create, prepare, execution-data) and the approval tier (`packages/core/src/approvals.ts:31`)
- **Reproduction:** As a finance member of an organization with a verified Safe holding 1,000,000 USDC: `POST /api/v1/orgs/{org}/proposals` with `{ action: { type: "allocate", accountId, opportunityId: <listed venue>, amountUsd: "20000", assetAmountRaw: "900000000000" }, idempotencyKey }`. Pre-fix: 201, one approval required (≤ $25k tier), every reserve and exposure check computed on $20k; `prepare` then builds a deposit of 900,000 USDC.
- **Root cause:** Every USD-denominated check (deployable surplus, reserve after, deploy/protocol/venue caps, venue liquidity share, approval tier, pending outflows) used `amountUsd`, while `build-tx` moved `assetAmountRaw`. The only raw-amount check was "balance ≥ raw". Nothing related the two numbers.
- **Impact:** A single finance member could push a transfer of any size through the lowest approval tier and past the reserve policy. Safe owners still sign, but the product's internal approval and policy layer (what signers rely on) was bypassable. Withdrawals were affected too (approval tier only; funds return to the Safe).
- **Evidence:** Test "BE-01: rejects a proposal whose USD figure understates the token amount moved on-chain" returned 201 before the fix.
- **Remediation:** `validateAction` now values `assetAmountRaw` with `impliedUsdValue` (the higher of market value and $1 per USD-pegged token, never understated) and fails `amount_consistent` unless `amountUsd` is within 1% (min $1). The asset comes from the source holding (API passes `actionAsset`), from the position for withdrawals, and payments fail closed without it (`amount_valued`). The recommendation engine and the copilot's `check_allocation` pass the holding. (`packages/core/src/actions.ts:57,93-112,233`; `apps/api/src/modules/proposals.ts:78`)
- **Verification:** `security.test.ts` › "BE-01: rejects a proposal whose USD figure understates…"; core `decisions.test.ts` › "rejects an allocation whose USD figure understates the token amount", "accepts amounts within the 1% tolerance…", "rejects understated withdrawals".
- **Status:** Fixed

### BE-02 · Payment recipient, asset and network not bound to the obligation

- **Severity:** High
- **Component:** `packages/core/src/actions.ts:124-133` (pre-fix payment branch); `apps/api/src/services/build-tx.ts:85-98`
- **Reproduction:** As finance: create a payment proposal for any unpaid obligation occurrence with `recipient: <attacker address>` (and `assetSymbol` of any stablecoin). Pre-fix: only `ADDRESS_RE` was checked; the `amount_matches` check is a warning; build-tx encodes `transfer(attacker, raw)`.
- **Root cause:** The obligation's recorded `recipientAddress`, `recipientChainId` and `paymentAsset` were never compared with the action.
- **Impact:** Funds redirected to an arbitrary address under an obligation's name, combined with BE-01 at the lowest approval tier. Approvers see "Pay $X for <obligation>".
- **Evidence:** Test "BE-02: rejects payments to anyone but the obligation's recorded payee" returned 201 before the fix.
- **Remediation:** New `paymentTerms` context; `recipient_matches` (fails when the obligation has no payee, or it differs), `payment_network`, `payment_asset`. Missing terms fail closed. (`packages/core/src/actions.ts:190-207`; `apps/api/src/modules/proposals.ts:74-79`)
- **Verification:** `security.test.ts` › "BE-02: rejects payments to anyone but the obligation's recorded payee", "BE-02: rejects payments in another asset…", "settles a payment proposal once, through its own execution"; core › "passes a payment to the recorded payee…", "rejects payments to an address other than the obligation's payee", "fails closed when the obligation has no recorded payee…", "rejects payments on another network, in another asset, or understating the amount".
- **Status:** Fixed. Residual: the payee itself is editable by finance (BE-17).

## Medium

### BE-03 · Approval decision races

- **Severity:** Medium
- **Component:** `apps/api/src/modules/proposals.ts:336-349` (pre-fix decision handler); `packages/db/src/schema.ts` `approvals` (no unique index)
- **Reproduction:** Fire several `POST …/proposals/{id}/decision` for the same member concurrently, or have the last two required approvers decide at the same moment.
- **Root cause:** "Already decided" and status checks ran before the transaction without locks; `approvals` had no `(proposal_id, user_id)` uniqueness; each decision transaction evaluated only the rows it could see, so two concurrent completing approvals could each see one approval and leave the proposal `pending_approval`.
- **Impact:** Duplicate decision rows in an append-only table (permanent); contradictory approve/reject rows from one member; proposals stuck pending although the tier is satisfied.
- **Evidence:** Race tests; the same-member race is also blocked by the index alone.
- **Remediation:** Unique index `approvals_proposal_user_uq` (migration `0002_security_constraints.sql`); the decision transaction locks the proposal row (`SELECT … FOR UPDATE`), re-checks status, expiry and prior decision, and maps a unique violation to 409. (`apps/api/src/modules/proposals.ts:403-446`)
- **Verification:** `security.test.ts` › "BE-03: concurrent decisions by the same member record exactly one decision", "BE-03: concurrent approvals by different members that complete the tier leave it approved, not stuck". Note: the second race is timing-dependent; it did not reproduce reliably without the lock, so the test asserts the correct outcome rather than proving the race.
- **Status:** Fixed

### BE-04 · Execution transaction-hash squatting across organizations

- **Severity:** Medium
- **Component:** `packages/db/src/schema.ts` `executions_chain_tx_uq (chain_id, tx_hash)`; `apps/api/src/modules/proposals.ts:534` (pre-fix)
- **Reproduction:** Attacker org has any proposal in `ready_to_execute` (they control their own Safe). They watch the victim Safe (public mempool or block) and `POST …/proposals/{theirs}/executions { txHash: <victim's> }` first. The victim's later insert hit the global unique index and silently did nothing, but the victim's proposal still moved to `submitted`.
- **Root cause:** Global uniqueness on a public value plus `onConflictDoNothing` with an unconditional status change.
- **Impact:** The victim's proposal stays `submitted` forever (never tracked, counted as a pending outflow, payment occurrence never settled).
- **Evidence:** "BE-04: another organization recording the same transaction hash first does not block tracking" (no execution row for the victim before the fix).
- **Remediation:** Uniqueness is now per proposal (`executions_proposal_tx_uq (proposal_id, tx_hash)`); each tracker checks its own Safe and `safeTxHash`, so the squatter's proposal is marked failed and the victim's executes.
- **Verification:** the test above (also covers decoy transactions, confirmation depth and idempotent re-runs of `trackExecution`).
- **Status:** Fixed

### BE-05 · One transfer could settle many occurrences

- **Severity:** Medium
- **Component:** `apps/api/src/modules/payments.ts:109-136` (pre-fix); `payments` table
- **Reproduction:** Record October's verified payment with tx T, then `POST /payments` for November with the same T. Pre-fix: both `paid_verified`.
- **Root cause:** No link between a settlement and the Transfer log it consumed.
- **Impact:** A finance member (or a mistake) could mark a whole year of payroll "verified" with one transfer, cutting the reserve requirement and inflating the deployable surplus that policy checks real allocations against. "Verified" is shown to approvers and auditors as on-chain evidence.
- **Evidence:** "BE-05: one on-chain transfer settles one occurrence only" (second record returned 201 before the fix).
- **Remediation:** New `payments.transfer_log_index`; partial unique index `payments_transfer_uq (organization_id, chain_id, tx_hash, transfer_log_index)`; unique violations map to 409 `transfer_already_used` / `already_settled` (create and re-verify). A batch transfer paying several obligations still works (one log each).
- **Verification:** the test above; "rejects transfers to someone other than the payee, or below the amount".
- **Status:** Fixed. Related open item: BE-26.

### BE-06 · Client IP and rate limiting

- **Severity:** Medium
- **Component:** `apps/api/src/lib/rate-limit.ts:13` (pre-fix), `apps/api/src/app.ts:50,53` (pre-fix), `apps/api/src/auth.ts` (Better Auth `ipAddress`), `apps/api/src/lib/route.ts:53`
- **Reproduction:** (a) Rotate `X-Forwarded-For` on each request: the API limiter (leftmost entry) never triggers, and audit IPs are attacker-chosen. (b) In production the request passes the platform edge and the web `/api` rewrite, so `X-Forwarded-For` has two entries; Better Auth 1.7 then refuses to pick an IP and puts every client in one shared bucket per path — five `send-verification-otp` calls a minute from anyone lock everyone out of email sign-in. (c) No per-email limit: an attacker can email-bomb a victim with codes.
- **Root cause:** IP taken from a client-controlled header; Better Auth not told which header/hop to trust.
- **Impact:** Sign-in denial of service for all users; ineffective API rate limits; spoofed audit IPs; OTP email flooding. (Brute force stays impractical: 6 digits, 5 attempts per code.)
- **Remediation:** `TRUSTED_PROXY_COUNT` (env) selects the entry appended by the outermost trusted proxy (`clientIp`); the API resolves it once, uses it for audit records, and passes it to Better Auth in `x-tokeniq-client-ip` (client values are overwritten) with `ipAddressHeaders`. The API limiter is keyed by signed-in user (fallback: IP). Per-email limits: 5 code sends and 10 code attempts per 15 minutes. Docs: `docs/DEPLOYMENT.md`, `docs/OPERATIONS.md`.
- **Verification:** "BE-06: limits one-time codes per email address, whatever the client IP claims", "BE-06: resolves the client IP from the trusted proxy hop…", production test "disables API docs, refuses dev origins, and issues Secure, HttpOnly, SameSite=Lax cookies" (two-entry `X-Forwarded-For` with `TRUSTED_PROXY_COUNT=2`).
- **Status:** Fixed. Operators must set `TRUSTED_PROXY_COUNT=2` on Railway; unset keeps the spoofable legacy behaviour (BE-25).

### BE-07 · Testnet accounts mixed into mainnet maths

- **Severity:** Medium
- **Component:** `apps/api/src/services/state.ts:161-163` (testnet stablecoins priced at $1), `apps/api/src/modules/accounts.ts:95` (pre-fix)
- **Reproduction:** In an organization with mainnet Safes, add and verify a Base Sepolia Safe you own that holds test USDC.
- **Root cause:** Test tokens are priced at the peg "so flows can be exercised", and nothing stopped them sharing an organization with real funds.
- **Impact:** Reserve-eligible capital and deployable surplus inflated by worthless tokens; real allocations pass policy checks they should fail.
- **Remediation:** Adding an account whose network type (testnet/mainnet) differs from the organization's existing accounts returns 422 `mixed_networks`.
- **Verification:** "BE-07: refuses to mix testnet accounts into an organization with mainnet accounts".
- **Status:** Fixed

### BE-11 · Cancel does not revoke collected signatures

- **Severity:** Medium
- **Component:** `apps/api/src/modules/proposals.ts:478` (cancel allowed from `awaiting_signatures`, `ready_to_execute`)
- **Reproduction:** Collect threshold signatures, call `execution-data` (any approver), then cancel the proposal. The calldata with valid signatures still executes on-chain until the Safe nonce moves.
- **Root cause:** Off-chain cancellation cannot invalidate Safe signatures; only consuming the nonce can.
- **Impact:** A cancelled payment or allocation can still be executed by anyone holding the calldata. TokenIQ will not track it (status `cancelled`), though balances reconcile on the next sync.
- **Remediation (recommended):** When cancelling from `awaiting_signatures`/`ready_to_execute`, warn that signatures remain valid and offer a nonce-burning rejection transaction (Safe's standard "reject" flow: a 0-value self-call at the same nonce); keep tracking executions of cancelled proposals and alert if one lands.
- **Status:** Open (product change)

### BE-13 · Concurrent reconciles on GET returned 500

- **Severity:** Medium (user-visible 500 on the overview)
- **Component:** `apps/api/src/modules/monitoring.ts:36-47` (`reconcileAlerts`), called from `GET /alerts` and the evaluate job; same pattern in `apps/api/src/modules/opportunities.ts` (`refreshRecommendations`)
- **Reproduction:** Load the overview and the navigation badge together (two `GET /alerts`), or run two reconciles at once: `duplicate key value violates unique constraint "risk_alerts_org_fingerprint_active_uq"`.
- **Root cause:** Read-then-insert without serialisation.
- **Remediation:** Both reconciles take `pg_advisory_xact_lock(hashtext('<kind>:<orgId>'))` at the start of their transaction, so per-org reconciles run one after another; "opened" alerts (and their notifications) are reported once. Other GET-reachable writes reviewed: notifications use `onConflictDoNothing` on `(user_id, dedupe_key)`; `expireStale` is a conditional UPDATE — both safe.
- **Verification:** "BE-13: concurrent alert reconciles for one organization never collide" (fails without the lock — checked by reverting it), "BE-13: concurrent GETs of alerts and recommendations return 200".
- **Status:** Fixed

### BE-16 · Single-admin policy changes

- **Severity:** Medium
- **Component:** `apps/api/src/modules/policies.ts:31-95`; approval tier evaluated with the current policy at decision time (`proposals.ts` decision handler)
- **Reproduction:** An admin sets one tier `{ upToUsd: null, requiredApprovals: 1 }` with `allowSelfApproval: true` (or raises `maxDeployedBps`), then approves a pending large proposal.
- **Impact:** One privileged insider removes the four-eyes control for proposals already in flight. Changes are versioned and audited, and Safe owners still sign.
- **Remediation (recommended):** Require a second owner to approve policy changes that loosen controls, or apply them only to proposals created afterwards; notify owners on every policy change.
- **Status:** Fixed for the approval policy in `3e57c556`. Each proposal stores the approval policy in force at creation, and approval must satisfy both it and the current policy (`evaluateApprovalsStrictest`), so loosening never speeds up a proposal in flight. Approvals from removed or demoted members stop counting, and approval is re-checked before prepare and execution (`proposal.approval_lapsed`). **Residual:** a single owner or admin can still loosen treasury limits (for example `maxDeployedBps`), which apply at once to re-validation, and policy changes are not separately approved or pushed to owners. Tests: `apps/api/test/governance.test.ts`, `packages/core/test/governance.test.ts`.

### BE-17 · Payee address change, then payment

- **Severity:** Medium
- **Component:** `apps/api/src/modules/obligations.ts:244-273` (PATCH sets `recipientAddress`); BE-02 binds payments to the current payee
- **Reproduction:** Finance edits an obligation's `recipientAddress` to their own address, then proposes the payment; it passes `recipient_matches`.
- **Impact:** Classic payee-change fraud; still needs approvals and owner signatures.
- **Remediation (recommended):** Flag payment proposals whose payee changed recently (the audit log has `obligation.updated` with `recipientAddress` from/to); require the approver to differ from the member who changed the payee; notify owners on payee changes.
- **Status:** Fixed in `3e57c556`. Obligations record `recipient_set_at`. Payments to an address added or changed less than `newPayeeHoldHours` ago (approval policy, default 48, 0 disables) fail the `payee_hold` check, which also fails closed when the time is unknown. Changes are audited as `obligation.payee_changed` and notified to owners and admins. **Residual:** the approver is not yet required to differ from the member who changed the payee. Tests: `apps/api/test/governance.test.ts`.

### BE-18 · RPC trust

- **Severity:** Medium
- **Component:** `packages/chain/src/clients.ts:26` (public fallbacks always appended), `readSafeInfo`, `simulateSafeTransaction`, `verifyErc20Transfer`, `readSafeExecution`, `client.verifyMessage` in `auth.ts` (SIWE) and `accounts.ts` (verification)
- **Description:** A compromised or malicious RPC (including a public fallback used when the dedicated one fails) can report arbitrary owners/threshold/nonce, balances, receipts and ERC-1271/6492 results. Consequences: fake account verification and SIWE sign-in as any smart-account address (viem verifies 6492/1271 by `eth_call` before ECDSA), wrong treasury figures, false "executed"/"paid (verified)".
- **What it cannot do:** move funds — owners' wallets compute the `safeTxHash` they sign, and the Safe checks signatures on-chain.
- **Remediation (recommended):** In production disable public fallbacks when `RPC_URL_<id>` is set; cross-check verification and receipts with a second provider; prefer ECDSA-first (`mode: 'eoa'`) for EOA verification.
- **Status:** Accepted with recommendations

## Low

| ID | Component | Reproduction / root cause | Impact | Remediation | Verification | Status |
|---|---|---|---|---|---|---|
| BE-08 | `proposals.ts:117` (pre-fix `action: z.any()`), `services/dto.ts:103` (`BigInt(j.assetAmountRaw)`) | Unknown `type`, extra fields, `"0x…"`, `" 1"`, negative, zero and > uint256 raw amounts were accepted; `BigInt` parses hex/whitespace; > uint256 crashed prepare with a 500 | Junk proposals stored; 500s; amounts that differ from what users typed | Strict Zod `ActionInput` discriminated union with `.strict()`, positive integer ≤ uint256 (`proposals.ts:48`) | "BE-08: rejects malformed structured actions before they reach the engine" | Fixed |
| BE-09 | `services/copilot-tools.ts:137,163` (pre-fix) | `list_recommendations` spread the stored payload (venue names from the Morpho API in title/evidence/alternatives); `list_alerts` returned titles/evidence that quote labels, venue names and provider errors | Prompt-injection text presented to the model as trusted data (tools are read-only; output has no links) | Narrative wrapped as `untrusted_json`; alert text as `untrusted_text`; engine action and check ids stay structured | "BE-09: passes alert and recommendation text to the model as untrusted data" | Fixed |
| BE-10 | `organizations.ts:255,284` (pre-fix) | Owner count read outside the transaction; two owners demoting/removing each other concurrently could both succeed | Organization with no owner | Owner rows locked `FOR UPDATE` inside the transaction (`lockOwners`) | "BE-10: two owners demoting each other at the same time leave one owner" (fails without the lock) | Fixed |
| BE-12 | `packages/core/src/policy.ts:5-16` | `decimalString` had no integer-digit bound; amounts > 20 integer digits overflowed `numeric(38,18)` → 500 | 500s, noisy logs | Max 20 integer digits | "rejects oversized JSON bodies and amounts that would overflow storage (BE-12)"; core "decimalString bounds" | Fixed |
| BE-14 | `proposals.ts:132-188` | Check-then-insert on the idempotency key; concurrent retries hit `proposals_org_idempotency_uq` → 500 | Clients see an error for a request that succeeded | Unique violation answered as the duplicate (200 with the winner's id) | "BE-14: concurrent creates with one idempotency key…" (fails without the fix) | Fixed |
| BE-15 | `auth.ts:44` `cookieCache.maxAge: 60` | After sign-out/revocation the signed `session_data` cookie can still authenticate for ≤ 60 s; the session token alone stops at once. Membership is checked from the database on every request, so removal from an organization is immediate | Short window after revocation | Documented; lower `maxAge` or disable the cache for admin-triggered revocations | "revoking a session stops its token at once…", "removing a member takes effect on their very next request" | Accepted |
| BE-19 | `app.ts:53` (pre-fix) | `/api/auth/*` relied on Hono `csrf()` (form types only) and Better Auth; a JSON `sign-out` from a foreign origin returned 200 | Logout CSRF needs a non-browser client today; defence in depth | Same origin check as `/api/v1/*` for all non-GET auth requests | "rejects state-changing requests from other origins…" | Fixed |
| BE-20 | `accounts.ts:183` (sync, no permission), `sample.ts`, `obligations.ts:279`, `copilot.ts:112` | Viewers can trigger RPC-heavy syncs; unlimited sample workspaces and document uploads; full thread history replayed to the model every turn | Cost and resource abuse by members | Require `accounts.verify` (or a cooldown) for manual sync; cap sample workspaces and documents per org; cap replayed history | — | Open |
| BE-21 | `apps/web/src/lib/api.ts:35` sends `idempotency-key`; table `idempotency_keys` exists; no server middleware | Retried obligation creation creates duplicates | Duplicate obligations inflate the reserve | Implement the middleware for financial POSTs (obligations, payments, accounts) | — | Open |
| BE-22 | `proposals.ts:525`, `schema.ts:509` | Two identical proposals prepared at the same Safe nonce produce the same `safeTxHash` → unique violation → 500 | Confusing error | Map to 409 "another proposal already uses this exact transaction" | — | Open |
| BE-23 | `organizations.ts:131,150,179`; `accounts.ts:37-53`; invitation email | Names may contain newlines; they appear in TokenIQ-branded emails and in the verification message a wallet signs | Phishing-style content; misleading signed text | Reject control characters in names and labels | — | Open |
| BE-24 | `payments.ts:52` (pre-fix) | Amounts checked only for USD obligations in USD stablecoins; a 1-unit EURC transfer "verified" a €9,500 obligation | Overstated settlement | `minimumPaymentRaw`: checked 1:1 whenever the token's peg equals the obligation currency | "BE-24: checks amounts for EUR obligations paid in a EUR stablecoin" | Fixed |
| BE-25 | `env.ts:17` | Production accepts `http://localhost` `APP_URL`, no dedicated RPC, no `TRUSTED_PROXY_COUNT` | Misconfiguration silently weakens controls | Refuse to boot in production without HTTPS `APP_URL` and `TRUSTED_PROXY_COUNT`; warn without RPC overrides | — | Open |
| BE-26 | `packages/chain/src/payments.ts:132`, `payments.ts` | `from` is not required to be an organization account; a third party paying the same vendor verifies the occurrence | Overstated "verified" | Require the sender to be a tracked account for `paid_verified`; otherwise `paid_unverified` with the reason | — | Open (product decision) |
| BE-27 | `proposals.ts` (`expireStale` touches `pending_approval` only) | Approved proposals can be prepared weeks later | Stale intent; mitigated by full re-validation at prepare and execution-data | Expire approved-but-unprepared proposals after the TTL | — | Accepted |

## Info

| ID | Note | Status |
|---|---|---|
| BE-28 | `readSafeInfo` pins `latest − confirmations` (`packages/chain/src/safe.ts:82`), so the nonce can be a few blocks stale right after an execution. Signatures collected for a used nonce are wasted and `execution-data` refuses (`nonce_moved`); funds are never at risk | Accepted |
| BE-29 | `app.ts` logs unhandled errors with `err`; Drizzle query errors carry parameters (emails, signatures). Redaction widened to `*.cookie`, `*.authorization`, `headers.authorization` and the logger accepts a destination for testing (`lib/logger.ts`); query parameters in error messages are not redacted | Partly fixed |
| BE-30 | `apps/web/next.config.ts`: `script-src 'self' 'unsafe-inline'`. The copilot renderer emits no HTML, links or images, which limits impact; nonce-based CSP recommended (web team) | Open (web) |
| BE-31 | Append-only triggers (`0001_append_only_guards.sql`) bind the application, but the role that owns the tables can drop them. Use a separate migration role and a non-owner runtime role | Open (ops) |
| BE-32 | `trackExecution` marks a proposal `failed` when the first recorded transaction is mined without the matching Safe event; the real hash must then be recorded again (allowed from `failed`). Covered in the BE-04 test | Accepted |

---

## Adversarial scenarios and outcomes

Outcome: **pass** = the control held before any change; **fixed** = it failed and is now fixed with a regression test; **open/accepted** = see the finding. Tests are in `apps/api/test/security.test.ts` unless noted.

| # | Scenario | Outcome | Test / evidence |
|---|---|---|---|
| 1 | Cross-org access with another org's ids on 23 routes (obligations, documents, payments, proposals incl. decision/prepare/execution-data, recommendations, accounts incl. sync/verify, alerts, copilot threads, members, invitations), via the attacker's own org path and directly | pass (404 everywhere) | "returns 404 for every org-scoped route given another organization's ids" |
| 2 | Structured action naming another org's account | pass (422, nothing created) | same test |
| 3 | Copilot thread of another member in the same org | pass (404) | same test |
| 4 | Copilot tools reading another org | pass (org fixed by server closure) | same test |
| 5 | Admin grants/invites owner, demotes/removes owner; finance manages members or policy | pass (403) | "admins cannot grant, invite, demote or remove owners" |
| 6 | Approver/viewer creates proposals; viewer decides, prepares or signs | pass (403) | "does not let approvers or viewers create proposals…" |
| 7 | Viewer exports reports | by design (200) | "viewers can export reports by design" |
| 8 | Member removed while their session is active | pass (next request 404) | "removing a member takes effect on their very next request" |
| 9 | Invitation accepted by another email; reused; revoked; expired; case-insensitive email | pass | "invitations are bound to the invited email…" |
| 10 | Two owners demote each other concurrently | fixed (BE-10) | "BE-10: two owners demoting each other…" |
| 11 | CSRF: JSON and multipart from a foreign origin, no Origin/Referer, Better Auth sign-out (text/plain and JSON), CORS preflight | pass for `/api/v1`; fixed for `/api/auth` JSON (BE-19) | "rejects state-changing requests from other origins…" |
| 12 | OTP brute force: correct code after 5 wrong attempts | pass (code invalidated) | "invalidates a one-time code after 5 wrong attempts" |
| 13 | OTP flooding with rotated `X-Forwarded-For` | fixed (BE-06) | "BE-06: limits one-time codes per email address…" |
| 14 | Spoofed `X-Forwarded-For` for rate limits and audit IPs | fixed (BE-06) | "BE-06: resolves the client IP from the trusted proxy hop…" |
| 15 | Session revocation latency | accepted (BE-15): token stops at once; signed cache ≤ 60 s | "revoking a session stops its token at once…" |
| 16 | Production cookies `__Secure-`, `Secure`, `HttpOnly`, `SameSite=Lax`; docs disabled; dev origins ignored; short secret rejected | pass | "production configuration" tests |
| 17 | SIWE nonce replay; other domain; expired; wrong chain; another wallet's signature | pass (401) | "Sign-In with Ethereum" tests |
| 18 | Concurrent proposal creates with one idempotency key | fixed (BE-14) | "BE-14: …" |
| 19 | Concurrent decisions by one member; concurrent completing approvals | fixed (BE-03) | "BE-03: …" (two tests) |
| 20 | Decision after expiry; decisions/prepare/sign/execute on cancelled or rejected proposals | pass (409) | "refuses decisions after expiry, and on cancelled or rejected proposals" |
| 21 | `amountUsd` small, `assetAmountRaw` huge (allocate, withdraw, payment) | fixed (BE-01) | "BE-01: …"; core tests |
| 22 | Payment to an attacker, in another asset, on another network | fixed (BE-02) | "BE-02: …" (two tests); core tests |
| 23 | Negative, zero, hex, whitespace, > uint256, scientific, unknown type, extra fields, impossible dates | fixed (BE-08) | "BE-08: …" |
| 24 | Signature from a non-owner; over a different hash; forged v=1 pre-approved hash | pass (422) | "rejects signatures from non-owners, over another hash…" |
| 25 | Old signature replayed after re-prepare with a new nonce | pass (filtered by `safeTxHash`; old signer must sign again) | "counts each owner once and only for the current safeTxHash…" |
| 26 | Duplicate signature submission | pass (counted once) | same test |
| 27 | Threshold raised / signer removed / simulation now failing between signing and execution | pass (409/409/422) | "re-checks owners, threshold and simulation…" |
| 28 | Recording a tx hash for another org's proposal | pass (404) | "BE-04: …" |
| 29 | Another org squats the victim's tx hash first | fixed (BE-04) | "BE-04: …" |
| 30 | Decoy tx from the victim Safe with another `safeTxHash` | pass (not executed; marked failed, recoverable — BE-32) | "BE-04: …" |
| 31 | Execution finality: matching event below confirmation depth; re-running the tracker | pass (stays `submitted`; one `proposal.executed` audit event) | "BE-04: …" |
| 32 | Payment proposal settles its occurrence once; second proposal for it refused | pass | "settles a payment proposal once, through its own execution" |
| 33 | One transfer used for two occurrences | fixed (BE-05) | "BE-05: …" |
| 34 | Transfer to someone else / below the amount | pass (422) | "rejects transfers to someone other than the payee, or below the amount" |
| 35 | EUR obligation paid with a tiny EURC transfer | fixed (BE-24) | "BE-24: …" |
| 36 | build-tx: venue not on the code listing; payment to the Safe; non-stablecoin or unknown asset; withdraw receiver | pass | "build-tx: call targets come from code, never from data" |
| 37 | Prepare uses listing addresses, not DB/API addresses | pass | "prepares from code-defined addresses and simulates" |
| 38 | Stale prices / stale accounts | pass (treasury incomplete; proposals refused with `data_complete`) | `api.test.ts` "flags stale prices…"; observed in this suite when a sync introduced unpriced tokens |
| 39 | Unverified accounts in reserve maths | pass (excluded, reported as `unverifiedValue`) | "excludes unverified accounts from reserve maths and keeps sample data out…" |
| 40 | Sample workspace data leaking into a real org; sample accounts used for real transactions | pass (org-scoped; `isSample` blocks prepare/sign/execute) | same test; `proposals.test.ts` "never prepares, signs or executes in a sample workspace" |
| 41 | Testnet Safe added to a mainnet org | fixed (BE-07) | "BE-07: …" |
| 42 | Fake Safe contract with arbitrary owners | accepted (affects only the adding org; verification needs an owner key) | THREAT_MODEL B3 |
| 43 | Malicious RPC | accepted (BE-18) | — |
| 44 | Prompt injection via obligation titles/notes | pass (wrapped) | `copilot.test.ts` "marks member-written text as untrusted data" |
| 45 | Prompt injection via alerts and recommendations (venue names from the Morpho API) | fixed (BE-09) | "BE-09: …" |
| 46 | Copilot writes anything | pass (all tools read-only) | `copilot.test.ts` "expose only read-only or hypothetical operations", "runs scenarios and allocation checks without writing anything" |
| 47 | Copilot hourly limit enforced before the model is called | pass | "enforces the per-user hourly message limit before calling the model" |
| 48 | Copilot output rendering | pass (no HTML, links or images: `apps/web/src/components/app/copilot/markdown.tsx`) | review |
| 49 | Upload HTML as a document; fake PDF; > 5 MB; > 6 MB body | pass (400/400/400/413) | "checks document type, PDF signature and size" |
| 50 | Filename/Content-Disposition injection; download sniffing | pass (sanitised; `attachment`, `nosniff`, `default-src 'none'`) | "serves uploads as sanitised attachments…" |
| 51 | CSV formula injection with `=`, `+`, `-`, `@`, tab | pass | `api.test.ts` "exports CSV…"; "neutralises spreadsheet formulas in every leading position" |
| 52 | Oversized JSON; overflowing amounts | pass (413); fixed (BE-12) | "rejects oversized JSON bodies…" |
| 53 | 500 responses leaking RPC URLs, keys or stacks | pass (generic message + request id) | "does not leak RPC error details in 500 responses" |
| 54 | Secrets in logs (OTP, signature, token, cookie, authorization) | pass after widening redaction (BE-29) | "redacts secrets from logs" |
| 55 | Concurrent alert reconciles / recommendation refreshes from GETs and jobs | fixed (BE-13) | "BE-13: …" (two tests) |
| 56 | Duplicate job processing | pass (pg-boss `singletonKey`; snapshots unique per block; tracking moves forward only) | review of `jobs/*.ts`; tracker idempotency in "BE-04" |
| 57 | Provider outage | pass (fail closed: incomplete data blocks proposals; 500s are generic) | "does not leak RPC error details…"; review |
| 58 | Alert flooding | pass (alerts de-duplicated by fingerprint, notifications by `(user, dedupe_key)`, email only for critical) | review of `services/notify.ts` |
| 59 | Cancelled proposal executed with previously collected signatures | open (BE-11) | — |
| 60 | Admin loosens policy for an in-flight proposal; finance changes payee then pays | blocked (BE-16, BE-17 fixed in `3e57c556`; residuals noted) | `governance.test.ts` |

## Test results (2026-10-11)

- `pnpm --filter @tokeniq/core test`: 59 passed
- `pnpm --filter @tokeniq/chain test`: 62 passed, 11 skipped (live network tests)
- `TEST_DATABASE_URL=postgres://localhost:5432/tokeniq_test_security pnpm --filter @tokeniq/api test`: 87 passed, 6 skipped (opt-in fork E2E); `security.test.ts` 48/48
- `pnpm --filter @tokeniq/{core,chain,db,api} typecheck`: clean
- Race tests BE-10, BE-13, BE-14 were confirmed to fail with their fix reverted.
