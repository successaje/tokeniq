# API reference

The API is served under `/api`. Browsers reach it through the web app's same-origin `/api` proxy. The machine-readable contract is [`docs/api/openapi.json`](api/openapi.json) (OpenAPI 3.1). It is generated from the validated route definitions with `pnpm --filter @tokeniq/api openapi`. In development an interactive reference is served at `/api/docs`.

## Conventions

- **Authentication.** Identity is managed by Better Auth under `/api/auth/*`: email one-time codes, passkeys and Sign-In with Ethereum. Sessions are `httpOnly`, `SameSite=Lax` cookies (`tokeniq.*`). There are no API keys for end users.
- **Organization scope.** Every route under `/api/v1/orgs/{orgId}` requires membership. Non-members receive `404` so organization ids do not leak. Permissions per role are listed in `apps/api/src/lib/authz.ts` (summary below).
- **Origin.** `POST`, `PUT`, `PATCH` and `DELETE` must come from the web app's origin (`403 bad_origin` otherwise).
- **Money.**
  - USD amounts are decimal strings (`"125000.5"`).
  - Raw token amounts are integer strings in the token's smallest unit.
  - Basis points are integer strings or numbers (`512` = 5.12%).
  - Values are never floats.
- **Errors.** `{"error": {"code", "message", "details?", "requestId"}}`. `message` is written for people; `code` is stable. `validation_error` includes `details: [{path, message}]`.

| Status | Meaning |
|---|---|
| `400` | Invalid input (`validation_error`, specific codes) |
| `401` | Not signed in or session expired |
| `403` | Signed in but not permitted (`forbidden`, `cannot_approve`, `bad_origin`) |
| `404` | Not found or not visible to you |
| `409` | Conflicts with current state (`policy_version_conflict`, `already_decided`, `nonce_moved`, `sample_workspace`, …) |
| `422` | Rejected by policy or verification (`policy_check_failed` with the failing checks, `simulation_failed`, `transfer_mismatch`, …) |
| `429` | Rate limited (`retry-after` header) |
| `503` | A dependency or feature is unavailable (`copilot_not_configured`, `chain_read_failed`, kill switches) |

- **Idempotency.** Any organization-scoped JSON `POST` accepts an `Idempotency-Key` header (8–100 characters: letters, digits, `.`, `_`, `:`, `-`). Keys are per person and kept for 24 hours.
  - A retry with the same key and body replays the first successful response, with the header `idempotent-replayed: true`.
  - The same key with a different body gets `422 idempotency_key_reused`.
  - A retry while the first request is still running gets `409 idempotency_in_progress`.
  - Failed requests are not remembered, so they can be retried with the same key.
  - `POST /proposals` also requires an `idempotencyKey` in the body. Repeating it returns the original proposal (`200`, `duplicate: true`).
- **Kill switches.** `DISABLED_FEATURES` (comma-separated: `copilot`, `proposals`, `signatures`, `sync`, `opportunities`, `email`) disables features without a deploy. Disabled features return `503`.

## Roles

| Permission | owner | admin | finance | approver | viewer |
|---|---|---|---|---|---|
| Read treasury, obligations, reports, copilot; trigger an account sync (at most every 30 s per account) | ✓ | ✓ | ✓ | ✓ | ✓ |
| Manage organization and onboarding, members, invitations (including listing them) | ✓ | ✓ |  |  |  |
| Change treasury and approval policies | ✓ | ✓ |  |  |  |
| Manage accounts, record obligations and payments | ✓ | ✓ | ✓ |  |  |
| Create proposals, dismiss recommendations | ✓ | ✓ | ✓ |  |  |
| Approve proposals, sign as Safe owner, submit execution | ✓ | ✓ | ✓ | ✓ |  |
| Verify account control, acknowledge alerts | ✓ | ✓ | ✓ | ✓ |  |

Only owners can grant the owner role. An organization always keeps at least one owner. A proposer cannot approve their own proposal unless the approval policy allows it.

## Endpoints

Routes outside the OpenAPI document:
- `POST /api/v1/orgs/{orgId}/obligations/{id}/documents` (multipart upload: PDF, PNG, JPEG, CSV or TXT up to 5 MB).
- `GET …/documents/{docId}` (download as an attachment).
- `GET /api/v1/orgs/{orgId}/reports/export/{activity|obligations|payments|balances|proposals|policies}.csv`.
- `POST /api/v1/orgs/{orgId}/copilot/messages`: Server-Sent Events, with events `thread`, `text`, `tool`, `notice`, `error` and `done`.

### Status

| Method | Path | Summary |
|---|---|---|
| `GET` | `/api/health` | Liveness and database reachability |
| `GET` | `/api/status` | Service and data-provider status |
| `GET` | `/api/v1/meta` | Supported networks and assets |

### Organizations

| Method | Path | Summary |
|---|---|---|
| `GET` | `/api/v1/me` | Current user, memberships and sign-in methods |
| `PATCH` | `/api/v1/me` | Update your display name |
| `POST` | `/api/v1/orgs` | Create an organization (you become its owner) |
| `GET` | `/api/v1/orgs/{orgId}` | Organization details |
| `PATCH` | `/api/v1/orgs/{orgId}` | Update organization name or purpose |
| `POST` | `/api/v1/orgs/{orgId}/onboarding` | Record onboarding progress so people can leave and return |
| `GET` | `/api/v1/orgs/{orgId}/members` | List members |
| `PATCH` | `/api/v1/orgs/{orgId}/members/{memberId}` | Change a member's role |
| `DELETE` | `/api/v1/orgs/{orgId}/members/{memberId}` | Remove a member (or leave the organization) |
| `GET` | `/api/v1/orgs/{orgId}/invitations` | Pending invitations |
| `POST` | `/api/v1/orgs/{orgId}/invitations` | Invite someone by email. Returns `emailSent` and `inviteUrl`, so the link can be shared by hand if the email failed |
| `DELETE` | `/api/v1/orgs/{orgId}/invitations/{invitationId}` | Revoke an invitation |
| `GET` | `/api/v1/invitations/{invitationId}` | View an invitation addressed to you |
| `POST` | `/api/v1/invitations/{invitationId}/accept` | Accept an invitation |
| `POST` | `/api/v1/sample-workspace` | Open your sample workspace with simulated data: `201` when created, `200` with `created: false` when you already have one |
| `DELETE` | `/api/v1/orgs/{orgId}/sample-workspace` | Delete a sample workspace you solely own (`409 not_sample_workspace` for real organizations) |

### Policies

| Method | Path | Summary |
|---|---|---|
| `GET` | `/api/v1/orgs/{orgId}/policies` | Current treasury and approval policies |
| `PUT` | `/api/v1/orgs/{orgId}/policies/treasury` | Save a new treasury policy version |
| `PUT` | `/api/v1/orgs/{orgId}/policies/approval` | Save a new approval policy version |
| `GET` | `/api/v1/orgs/{orgId}/policies/history` | Policy change history |

### Treasury

| Method | Path | Summary |
|---|---|---|
| `GET` | `/api/v1/orgs/{orgId}/treasury` | Treasury overview: balances, reserve requirement, deployable surplus, projection |
| `GET` | `/api/v1/orgs/{orgId}/treasury/history` | Daily stablecoin balance history reconstructed from stored snapshots |
| `POST` | `/api/v1/orgs/{orgId}/treasury/scenario` | Run a stress scenario without changing any data |
| `GET` | `/api/v1/orgs/{orgId}/treasury/sync-status` | Freshness of balances, prices and venue data |

### Obligations

| Method | Path | Summary |
|---|---|---|
| `GET` | `/api/v1/orgs/{orgId}/obligations` | List obligations |
| `POST` | `/api/v1/orgs/{orgId}/obligations` | Record an obligation |
| `GET` | `/api/v1/orgs/{orgId}/obligations/schedule` | Upcoming and overdue occurrences with payment status |
| `GET` | `/api/v1/orgs/{orgId}/obligations/{id}` | Obligation with upcoming occurrences, payments and documents |
| `PATCH` | `/api/v1/orgs/{orgId}/obligations/{id}` | Update an obligation |

### Accounts

| Method | Path | Summary |
|---|---|---|
| `GET` | `/api/v1/orgs/{orgId}/accounts` | Treasury accounts |
| `POST` | `/api/v1/orgs/{orgId}/accounts` | Add a Safe or wallet (read-only until verified) |
| `PATCH` | `/api/v1/orgs/{orgId}/accounts/{id}` | Rename, change purpose, or include/exclude from treasury maths |
| `DELETE` | `/api/v1/orgs/{orgId}/accounts/{id}` | Stop tracking an account (history is kept) |
| `POST` | `/api/v1/orgs/{orgId}/accounts/{id}/sync` | Read balances now (`429 sync_rate_limited` with `retry-after` within 30 s of the last sync) |
| `POST` | `/api/v1/orgs/{orgId}/accounts/{id}/verify/challenge` | Get a message to sign proving control of the account |
| `POST` | `/api/v1/orgs/{orgId}/accounts/{id}/verify` | Submit the signed challenge |

### Payments

| Method | Path | Summary |
|---|---|---|
| `GET` | `/api/v1/orgs/{orgId}/payments` | Recorded payments (newest due date first) |
| `POST` | `/api/v1/orgs/{orgId}/payments` | Record an obligation occurrence as paid (optionally verified on-chain) or skipped |
| `POST` | `/api/v1/orgs/{orgId}/payments/{id}/verify` | Re-check an unverified payment on-chain |
| `DELETE` | `/api/v1/orgs/{orgId}/payments/{id}` | Undo a payment record that is not verified on-chain |

### Opportunities & recommendations

| Method | Path | Summary |
|---|---|---|
| `GET` | `/api/v1/orgs/{orgId}/opportunities` | Capital venues with suitability against your policy |
| `GET` | `/api/v1/orgs/{orgId}/recommendations` | Open recommendations (recomputed from current data on every request) |
| `POST` | `/api/v1/orgs/{orgId}/recommendations/{id}/dismiss` | Dismiss a recommendation with a reason |

### Proposals & approvals

| Method | Path | Summary |
|---|---|---|
| `POST` | `/api/v1/orgs/{orgId}/proposals` | Create a proposal from a recommendation or a structured action |
| `GET` | `/api/v1/orgs/{orgId}/proposals` | List proposals |
| `GET` | `/api/v1/orgs/{orgId}/proposals/summary` | Counts for navigation badges |
| `GET` | `/api/v1/orgs/{orgId}/proposals/{id}` | Proposal with approvals, signatures, executions and a fresh policy check |
| `POST` | `/api/v1/orgs/{orgId}/proposals/{id}/decision` | Approve or reject (internal approval; not a Safe signature) |
| `POST` | `/api/v1/orgs/{orgId}/proposals/{id}/comments` | Comment on a proposal |
| `POST` | `/api/v1/orgs/{orgId}/proposals/{id}/cancel` | Cancel a proposal that has not been submitted on-chain |
| `POST` | `/api/v1/orgs/{orgId}/proposals/{id}/prepare` | Build and simulate the Safe transaction owners will sign |
| `POST` | `/api/v1/orgs/{orgId}/proposals/{id}/signatures` | Submit a Safe owner's signature over the safeTxHash |
| `POST` | `/api/v1/orgs/{orgId}/proposals/{id}/execution-data` | Calldata for execTransaction with collected signatures (any wallet may submit it) |
| `POST` | `/api/v1/orgs/{orgId}/proposals/{id}/executions` | Record a submitted execution transaction hash for tracking |

Rules that apply across these endpoints:

- **Re-checked, never trusted.** Each proposal is validated again with current data when it is read, prepared, signed and released for execution. It is never counted against itself. Allocations already in flight count toward venue and protocol limits.
- **Approval policy at creation.** The approval policy in force when a proposal is created is stored with it, and approval must satisfy both that policy and the current one. Decisions count only from current members whose current role may approve.
- **Lapsed approval.** If approval no longer holds at prepare or execution time, the request fails with `409 approval_lapsed` and the proposal returns to `pending_approval` (or `expired`).
- **Payee hold.** Payment proposals fail the `payee_hold` check until the obligation's payee address has been unchanged for the approval policy's `newPayeeHoldHours` (default 48).

### Risk & activity

| Method | Path | Summary |
|---|---|---|
| `GET` | `/api/v1/orgs/{orgId}/alerts` | Risk alerts (re-evaluated on request) |
| `POST` | `/api/v1/orgs/{orgId}/alerts/{id}/acknowledge` | Acknowledge an alert |
| `GET` | `/api/v1/orgs/{orgId}/activity` | Organization audit trail (newest first, cursor-paginated) |
| `GET` | `/api/v1/orgs/{orgId}/notifications` | Your notifications |
| `POST` | `/api/v1/orgs/{orgId}/notifications/read` | Mark all notifications read |

### Reports

| Method | Path | Summary |
|---|---|---|
| `GET` | `/api/v1/orgs/{orgId}/reports/snapshot` | Point-in-time treasury snapshot for printable summaries |

### Copilot

| Method | Path | Summary |
|---|---|---|
| `GET` | `/api/v1/orgs/{orgId}/copilot/status` | Whether the copilot is available |
| `GET` | `/api/v1/orgs/{orgId}/copilot/threads` | Your conversations |
| `GET` | `/api/v1/orgs/{orgId}/copilot/threads/{id}` | Messages in a conversation |
