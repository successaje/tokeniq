# Product requirements: TokenIQ 2.0 (early access)

| | |
|---|---|
| **Status** | Draft for the first early-access release |
| **Date** | 2026-10-11 |
| **Code baseline** | Branch `tokeniq-2`, working tree on 2026-10-11 |
| **Related** | [`PRODUCT_VISION.md`](PRODUCT_VISION.md), [`COMPETITIVE_RESEARCH.md`](COMPETITIVE_RESEARCH.md), [`ARCHITECTURE.md`](ARCHITECTURE.md), [`API.md`](API.md), [`DATA_MODEL.md`](DATA_MODEL.md), [`CONTRACTS.md`](CONTRACTS.md), [`TESTING.md`](TESTING.md), [`adr/`](adr) |

This document specifies what the first release does. It was written against the code, not the other way round. Every requirement carries a status:

- **Built**: implemented in this repository.
- **Partial**: some of it is implemented; the requirement says what is missing.
- **Not built**: required or planned, not implemented.

Where a requirement cites a file, that file is the source of truth for the behaviour.

## 1. Problem

Crypto-native organizations hold operating capital as stablecoins in Safe multisigs. They can see balances, but no tool tells them how much of a balance is already owed, how much policy says must stay liquid, and how much is genuinely free. That reasoning lives in spreadsheets, policy documents and forum posts, and every move of funds is coordinated in chat before signers approve a transaction they cannot easily check.

The evidence is in [`research/customer-workflows.md`](research/customer-workflows.md) and [`research/market-opportunities.md`](research/market-opportunities.md). In short: DAOs such as ENS, Lido and Aave write runway floors and exposure caps into policy and execute them by hand; signer coordination is slow; signing under attack has failed (Bybit, Drift); and yield venues expose far less instant liquidity than their headline size suggests.

## 2. Goals and non-goals

### Goals for this release

| ID | Goal |
|---|---|
| G1 | Give an organization a correct, explainable protected-reserve requirement and deployable-surplus figure from its own Safes, obligations and policy. |
| G2 | Make it quick to record obligations and to prove which ones were paid. |
| G3 | Route every fund-moving action through deterministic policy checks, internal approval, Safe owner signatures and tracked on-chain execution, each as a separate record. |
| G4 | Explain every figure: show the binding rule, the arithmetic, the inputs, their freshness and their uncertainty. |
| G5 | Let anyone evaluate the product safely through a clearly labelled sample workspace. |
| G6 | Stay non-custodial: TokenIQ never holds keys or funds. |

### Non-goals for this release

- Custody, fiat accounts, cards or off-ramps.
- An accounting subledger, cost basis, tax or payroll compliance.
- Autonomous or bounded automation (locked; see §10).
- Venues outside the reviewed listing; bridging; non-EVM chains.
- A native mobile app.
- Paid plans or billing.

## 3. Personas

Full profiles, evidence and module mapping: [`research/customer-workflows.md`](research/customer-workflows.md).

| Persona | TokenIQ role | Primary modules |
|---|---|---|
| DAO treasury steward / multisig signer | `approver` or `finance` | Approval center, Risk |
| Startup finance lead or CFO | `owner` or `finance` | Overview, Obligations, Reserves, Reports |
| Protocol finance / ops | `admin` or `finance` | Policies, Opportunities, Approvals, Reports |
| Contributor who gets paid | none (does not sign in) | Obligations, Payments |
| External accountant or auditor | `viewer` | Reports, Activity |

### Role permissions (Built, `apps/api/src/lib/authz.ts`)

| Permission | owner | admin | finance | approver | viewer |
|---|---|---|---|---|---|
| Read treasury, obligations, reports, copilot | ✓ | ✓ | ✓ | ✓ | ✓ |
| Manage organization, members, invitations | ✓ | ✓ | | | |
| Change treasury and approval policies | ✓ | ✓ | | | |
| Manage accounts, record obligations and payments | ✓ | ✓ | ✓ | | |
| Create proposals, dismiss recommendations | ✓ | ✓ | ✓ | | |
| Approve proposals, sign as Safe owner, submit execution | ✓ | ✓ | ✓ | ✓ | |
| Verify account control, acknowledge alerts | ✓ | ✓ | ✓ | ✓ | |

Only owners can grant the owner role, and an organization always keeps at least one owner.

## 4. Release scope by module

| Module | Web routes | API surface | Status |
|---|---|---|---|
| Treasury overview & accounts | `/app`, `/app/treasury`, `/app/accounts`, `/app/allocations` | `treasury`, `accounts` | Built |
| Obligations & payments | `/app/obligations`, `/app/obligations/[id]`, `/app/payments` | `obligations`, `payments` | Partial (payment proposals have no UI) |
| Reserves & liquidity | `/app/reserves` | `treasury`, `treasury/scenario`, `policies` | Built |
| Opportunities & recommendations | `/app/opportunities`, `/app/recommendations` | `opportunities`, `recommendations` | Built |
| Approval center | `/app/approvals`, `/app/approvals/[id]` | `proposals` | Built |
| Copilot | `/app/copilot` | `copilot` | Built (requires a model key) |
| Risk monitoring | `/app/risk` | `alerts`, `notifications` | Partial (no leading venue indicators) |
| Reports & audit | `/app/reports`, `/app/reports/snapshot`, `/app/activity` | `reports`, `activity` | Partial (CSV only; no accounting sync) |
| Settings, team & policies | `/app/settings`, `/app/team` | `orgs`, `members`, `invitations`, `policies` | Built |
| Onboarding incl. sample workspace | `/onboarding/*`, `/signup`, `/login`, `/invite/[id]` | `onboarding`, `sample-workspace` | Built |
| Public site | `/`, `/product`, `/how-it-works`, `/integrations`, `/pricing`, `/security`, `/status`, `/docs`, `/legal/*` | `status`, `meta` | Built (see §12 for copy fixes) |

Supported networks: Ethereum, Base, Arbitrum One and OP Mainnet; Sepolia and Base Sepolia for testing (`packages/chain/src/chains.ts`).

## 5. Functional requirements

### 5.1 Treasury overview & accounts

| ID | Requirement | Status |
|---|---|---|
| ACC-1 | A member with `finance` or above can add a Safe or wallet by network and address. TokenIQ reads the address on-chain and classifies it as a Safe, another contract or an externally owned account. | Built |
| ACC-2 | A newly added account is watch-only. It is tracked but excluded from reserve and deployable maths until a member proves control. | Built |
| ACC-3 | Proving control: TokenIQ issues a single-use challenge bound to the organization, account and signer, valid for 10 minutes. For a Safe the signer must be a current owner; for a wallet, the wallet itself. | Built |
| ACC-4 | If the owner who verified a Safe is later removed from it, the next sync revokes verification and records `account.verification_revoked`. | Built |
| ACC-5 | Every 5 minutes, and on demand, TokenIQ reads balances of allowlisted tokens and positions in listed venues at one pinned block per account, plus the Safe's owners, threshold, nonce, modules and guard. Snapshots are unique per account, asset and block. | Built |
| ACC-6 | Token allowlist per network (`packages/chain/src/tokens.ts`): ETH, USDC, USDT, DAI, USDS and EURC on Ethereum; ETH, USDC, bridged USDbC, DAI and EURC on Base; ETH, USDC, bridged USDC.e and USDT on Arbitrum One; ETH, USDC and USDT on OP Mainnet. Bridged variants are labelled as such. | Built |
| ACC-7 | Prices come from Chainlink feeds. A price is stale when its age exceeds the feed's heartbeat plus a grace period. L2 sequencer uptime feeds are read for Base, Arbitrum and OP. | Built |
| ACC-8 | Members can rename an account, set its purpose, include or exclude it from treasury maths, and stop tracking it. Archived accounts keep their history. | Built |
| ACC-9 | The overview shows gross value, liquid (stable and other), allocated (total, withdrawable now, unknown), reserve-eligible capital and value held in unverified accounts, broken down by asset, network, account and protocol. | Built |
| ACC-10 | The overview lists data issues (price missing, price stale, account never synced, account stale, unverified excluded). Any issue marks the snapshot incomplete, and figures that depend on it are flagged. | Built |
| ACC-11 | Daily stablecoin balance history is reconstructed from stored snapshots (7–365 days, default 30). | Built |
| ACC-12 | Only Safes can be executed through. Wallets and other contracts are read-only. | Built |
| ACC-13 | Execution requires Safe v1.3.0 or later. | Built |
| ACC-14 | Safes whose owners are themselves Safes (nested signers) can be tracked, but their owners cannot sign through TokenIQ: EIP-1271 contract signatures and pre-approved hashes are not accepted (`packages/chain/src/safe.ts`). | Not built |

### 5.2 Obligations & payments

| ID | Requirement | Status |
|---|---|---|
| OBL-1 | An obligation records direction (outflow or expected inflow), title, category, amount, currency (USD or EUR), first due date, recurrence, certainty, priority, status, a "track from" date, counterparty, recipient address, invoice number and notes. | Built |
| OBL-2 | Recurrence: once, weekly, monthly, quarterly or yearly, with an interval and an optional end date or count. Month-end dates stay anchored (a 31st falls on the last day of shorter months). | Built (`packages/core/src/obligations.ts`, `dates.ts`) |
| OBL-3 | Certainty is one of `estimate` (not yet agreed), `committed` (agreed) or `invoiced` (received and checked). Policy decides whether estimates count toward the reserve. | Built |
| OBL-4 | Occurrences before the "track from" date are history and never treated as owed. Unpaid occurrences up to 30 days in the past are shown as overdue. | Built |
| OBL-5 | EUR amounts convert to USD with the Chainlink EUR/USD feed. Outflows round up and inflows round down. If no rate is available, the occurrence is flagged as unconvertible and uncertainty is raised to high. | Built |
| OBL-6 | Supporting documents (PDF, PNG, JPEG, CSV, TXT; up to 5 MB) can be attached to an obligation; TokenIQ stores their SHA-256. | Built |
| OBL-7 | The schedule shows upcoming and overdue occurrences with their payment status. | Built |
| OBL-8 | Marking an occurrence paid with a transaction hash decodes the receipt's Transfer logs. It becomes `paid_verified` only when the asset reached the obligation's recipient (and, for USD obligations paid in USD stablecoins, at least the obligation amount) with enough confirmations. | Built |
| OBL-9 | Marking paid without a hash records `paid_unverified` ("someone says it was paid"); it can be re-checked on-chain later, or undone with a reason. Verified payments cannot be undone. | Built |
| OBL-10 | An occurrence can be marked `skipped`. Paid occurrences (verified **or unverified**) and skipped ones no longer count toward the reserve (`apps/api/src/services/state.ts`). | Built. See §12 item 9: public copy says an occurrence stays owed until matched on-chain. |
| OBL-11 | A payment proposal pays one occurrence from a verified Safe. The recipient must equal the obligation's recorded payee, on its network, in its asset; missing payment terms fail closed. When the transfer is confirmed, the occurrence is settled. | Partial: implemented in the API and engine (`validateAction`, `jobs/data.ts`); the web app has no way to create one yet |
| OBL-12 | Batch payments (several payees in one Safe transaction). | Not built |

### 5.3 Reserves & liquidity

| ID | Requirement | Status |
|---|---|---|
| RES-1 | The protected-reserve requirement is the largest of the enabled rules: a fixed floor; runway months × monthly burn; unpaid outflows due within the horizon (including overdue) × (1 + buffer). The UI names the binding rule. | Built (`packages/core/src/reserve.ts`) |
| RES-2 | Monthly burn is the higher of the declared figure and the itemized recurring outflows, so an understated estimate cannot shrink the reserve. The basis (declared, itemized, itemized exceeds declared, none) is shown. | Built |
| RES-3 | Reserve-eligible capital counts only liquid stablecoins in verified, included accounts, valued at the oracle price but never above $1 (USD stablecoins), less any per-asset haircut, and optionally limited to a list of reserve assets. | Built |
| RES-4 | Protocol positions, non-stable assets and unverified accounts do not count toward the reserve. Unverified accounts can be included only through an explicit policy switch that is recorded in policy history. | Built |
| RES-5 | Expected inflows are shown but never reduce the requirement. | Built |
| RES-6 | Active allocation proposals (from pending approval through submitted) are treated as already spent. Payment proposals are not double-counted because their occurrences are already in the obligations rule. | Built |
| RES-7 | Coverage status is `covered`, `thin` (below the policy's comfort ratio, default 110%), `shortfall` or `no_requirement`, with the shortfall amount and months of spend covered. | Built |
| RES-8 | Deployable surplus = min(reserve-eligible − requirement − pending outflows, gross × maximum-deployed share − already allocated − pending allocations), floored at zero, with an explanation of which limit binds. | Built |
| RES-9 | Uncertainty is low, medium or high, with reasons: burn not declared, no obligations recorded, estimates excluded, missing FX rate, unconvertible obligations, incomplete or stale data. | Built |
| RES-10 | When EUR obligations in the horizon exceed EUR stablecoin holdings, a currency-mismatch warning explains that paying them will need a conversion at a future rate. | Built |
| RES-11 | A projection shows the liquid balance over the obligation horizon in 7-day buckets, with and without expected inflows, the lowest point and the first date it would go negative. | Built |
| RES-12 | Scenarios apply hypothetical shocks to a copy of current state and show base and shocked results side by side: stablecoin depeg to a price, a new obligation, a burn change, a different runway, a frozen venue, a hypothetical allocation. Scenarios never write data. | Built (`packages/core/src/scenarios.ts`) |
| RES-13 | The treasury policy editor lives on the Reserves page and offers three presets (Conservative, Balanced, Growth). Saving requires a reason, creates a new append-only version and is rejected with `policy_version_conflict` if someone else saved first. | Built |
| RES-14 | Default policy (`DEFAULT_TREASURY_POLICY`): 6 months runway, 90-day horizon, 10% buffer, estimates included, maximum 50% deployed, 25% per protocol, 20% per venue, position ≤ 5% of a venue's available liquidity, venue TVL ≥ $25M, venue fee ≤ 25%, USDC only, Morpho and Aave v3, minimum action $5,000, data no older than 60 minutes, autonomy `approval_required`. | Built |

### 5.4 Opportunities & recommendations

| ID | Requirement | Status |
|---|---|---|
| OPP-1 | Venue data is refreshed every 15 minutes from the Morpho API and on-chain Aave reads. Each venue shows native, reward and net APY with what the figure measures, TVL, available liquidity, fee, curator, withdrawal type, warnings, dependencies, source and fetch time. | Built |
| OPP-2 | Only venues in the code-defined listing can become executable proposals. The `listed` flag is recomputed from code on every refresh, and transaction builders take addresses only from the listing. | Built ([ADR 0008](adr/0008-venue-listing-in-code.md)) |
| OPP-3 | The listing as of review 2026-10-11 (`packages/chain/src/listing.ts`): Morpho Vault V1 (MetaMorpho) Gauntlet USDC Prime and Steakhouse USDC on Base, Steakhouse USDC on Ethereum; Aave v3 native USDC reserve on Base, Ethereum, Arbitrum One and OP Mainnet. Criteria, reviewer, rationale and considered-but-not-listed venues are recorded in the same file. | Built |
| OPP-4 | Each venue is checked against the organization's policy: listed, protocol, network, asset, minimum TVL, maximum fee, withdrawals not locked (queued is a warning), no critical warnings, data fresh. Incentive rewards always raise a warning. | Built |
| OPP-5 | Morpho Vault V2 venues are supported with withdrawable liquidity computed from idle assets, the liquidity adapter and in-kind exit paths. | Not built (V2 is excluded from the listing because its ERC-4626 `max*` views return 0) |
| OPP-6 | Recommendations are generated deterministically from current state: `restore_reserve` (withdraw from the most liquid position in a verified Safe to close a shortfall, or explain that none exists), `reduce_concentration` (a protocol over its cap; informational, no action) and `deploy_surplus`. | Built |
| OPP-7 | `deploy_surplus` is produced only when autonomy is not `observe`, the surplus is at least the minimum action, coverage is not short and uncertainty is not high. It picks the highest net-APY venue that passes every policy check and has funds on the same network in the same asset (TokenIQ does not bridge). Amount = min(deployable surplus, liquidity limit, per-venue room, per-protocol room, source balance), rounded down to $1,000. | Built. See open question Q4 on ranking by APY including rewards. |
| OPP-8 | Each recommendation carries its trigger, objective, evidence with record references, upside as an estimate (not a forecast), downside, liquidity impact, what could go wrong, alternatives (always including "do nothing") and the basis of the numbers. | Built |
| OPP-9 | Recommendations are fingerprinted, so the same situation is not raised twice. A member can dismiss one with a reason. | Built |
| OPP-10 | Leading risk inputs for venues: pending curator configuration changes and their effective time, timelock lengths, oracle type (hardcoded or market), collateral look-through, curator concentration, incentive share and expiry. | Not built |

### 5.5 Approval center

| ID | Requirement | Status |
|---|---|---|
| APR-1 | A proposal is a structured action (`allocate`, `withdraw` or `payment`). Free text, including model output, can never become a proposal. | Built |
| APR-2 | In the web app, proposals are created from recommendations. The API also accepts structured actions directly. | Partial: no web form for a manual allocation, withdrawal or payment |
| APR-3 | Creating a proposal requires an idempotency key; repeating it returns the original proposal. | Built |
| APR-4 | Policy is checked three times: at creation, when the Safe transaction is prepared, and immediately before submission. The USD amount must match the token amount within 1% (at least $1). | Built |
| APR-5 | Internal approval follows amount tiers. Default (`DEFAULT_APPROVAL_POLICY`): up to $25,000 needs 1 approval; up to $250,000 needs 2; above that needs 3 including an owner. The proposer cannot approve their own proposal unless policy allows it. Viewers cannot approve. Any rejection rejects. Proposals expire after 72 hours by default. | Built (`packages/core/src/approvals.ts`) |
| APR-6 | Internal approval is a decision record, never a substitute for Safe signatures. The UI keeps four separate steps: policy check, internal approval, owner signatures, on-chain execution. | Built |
| APR-7 | Preparing builds the exact Safe transaction from listed addresses only (exact-amount approvals, never infinite; a zero-approval first for tokens that need it; receiver always the Safe), reads the Safe live and simulates with `Safe.simulateAndRevert`. | Built (`apps/api/src/services/build-tx.ts`) |
| APR-8 | The signing view shows the Safe, nonce, `safeTxHash`, a plain-language list of each call and its target, the simulation result and block, and each owner's signing status. | Partial: the `safeTxHash` is truncated on screen with the full value on hover; it should be shown in full and copyable for checking on a hardware wallet |
| APR-9 | Owners sign the EIP-712 Safe transaction in their own wallets. TokenIQ recovers each signer (EIP-712 or `eth_sign`), checks it against owners read live from the chain, stores signatures append-only and orders them as the Safe requires. | Built |
| APR-10 | When the threshold is met, TokenIQ returns `execTransaction` calldata. Any wallet may submit it and pay gas; TokenIQ records the hash. | Built |
| APR-11 | If the Safe nonce moves, the proposal becomes `stale` and must be prepared and signed again. | Built |
| APR-12 | Execution counts only after the receipt succeeds, the Safe emits `ExecutionSuccess` and the transaction has 3 confirmations on Ethereum or 5 on L2s. `ExecutionFailure` or a revert marks it failed. Balances are re-read after confirmation. | Built (`apps/api/src/jobs/data.ts`) |
| APR-13 | Proposals can be cancelled until submitted, and discussed in comments. | Built |
| APR-14 | Members with approver roles get in-app notifications when a proposal is created, approved, rejected, executed or failed. | Built |
| APR-15 | Signers are nudged outside the app (email, push, chat) when their signature is needed, with urgency tied to the due date of any obligation that depends on it. | Not built |
| APR-16 | TokenIQ proposals appear in the Safe{Wallet} queue. | Not built ([ADR 0005](adr/0005-signatures-in-tokeniq.md): TokenIQ collects signatures itself) |
| APR-17 | Third-party threat screening of recipients and contracts before signing. | Not built |

### 5.6 Copilot

| ID | Requirement | Status |
|---|---|---|
| COP-1 | Members can ask questions in natural language and receive streamed answers. | Built |
| COP-2 | The copilot has only read-only or hypothetical tools: treasury overview, obligations, accounts and holdings, positions, recommendations, opportunities, alerts, policy, scenario, allocation check, proposals, recent activity (`apps/api/src/services/copilot-tools.ts`). | Built |
| COP-3 | The copilot cannot create, approve, sign or execute anything, and cannot change policy, obligations or accounts. | Built (tested in `apps/api/test`) |
| COP-4 | Tools are bound to the organization from the session. Tool results carry `ref` ids, and answers must cite them. | Built |
| COP-5 | Text written by members or external sources (names, notes, venue labels) is wrapped as untrusted data. | Built |
| COP-6 | When data is incomplete, stale or highly uncertain, the answer leads with that. | Built (system prompt) |
| COP-7 | Conversations are private to the user, stored append-only and replayed unchanged. | Built |
| COP-8 | Limits: 40 messages per user per hour; 4,000 characters per message. | Built |
| COP-9 | Without a model key the copilot reports "not configured" and nothing else is affected. It can also be disabled by kill switch. | Built |
| COP-10 | Default model `claude-opus-5-5`, overridable by `COPILOT_MODEL`, with a server-side refusal fallback. | Built |
| COP-11 | Answers' numeric claims are machine-checked against tool results. | Not built (`TESTING.md`: wording is not machine-verified) |

### 5.7 Risk monitoring

| ID | Requirement | Status |
|---|---|---|
| RSK-1 | Alerts are evaluated every 10 minutes, after data changes and on request, de-duplicated by condition fingerprint, and move through open, acknowledged and resolved. | Built |
| RSK-2 | Alert rules (`packages/core/src/risk.ts`): reserve shortfall (critical); thin coverage (warning); overdue obligation (critical if the obligation is critical priority); payments due within 7 days exceeding liquid stablecoins (critical); stablecoin off peg by ≥ 0.5% (warning) or ≥ 2% (critical); stale price; account not synced for 3× the data-age limit; one asset ≥ 80% of the treasury (info); protocol over its cap; venue liquidity under 2× our position (critical under 1×); non-info venue warnings from the data source; an unexplained drop of ≥ 10% in an account's asset value (critical at ≥ 50%); L2 sequencer down; data provider degraded. | Built |
| RSK-3 | Each alert states the condition that is true now, evidence, a recommended action and a link to the record. | Built |
| RSK-4 | Warning and critical alerts create in-app notifications for every member. Critical alerts are also emailed to owners, admins and finance members. Sample workspaces send no alert emails. | Built (`apps/api/src/services/notify.ts`) |
| RSK-5 | Provider health (RPCs, Chainlink, sequencer feeds, Morpho API, Aave reads) is measured from TokenIQ's own calls and shown on the public status page. | Built |
| RSK-6 | Leading venue indicators (see OPP-10) raise alerts while there is still time to exit, for example inside a curator's timelock. | Not built |

### 5.8 Reports & audit

| ID | Requirement | Status |
|---|---|---|
| REP-1 | Every state change writes an `audit_events` row inside the same transaction, with actor (user, system or copilot), action, target, data, IP and user agent. | Built |
| REP-2 | Audit events, approvals and policy versions reject `UPDATE` and `DELETE`, and Safe signatures reject `UPDATE`, enforced by database triggers. | Built |
| REP-3 | The activity page lists the audit trail, newest first, with cursor pagination. | Built |
| REP-4 | CSV exports: activity, obligations, payments, balances (with block number and hash), proposals and policies. Cells that could be read as spreadsheet formulas are neutralized. Each export is itself audited. | Built |
| REP-5 | A printable point-in-time snapshot of the treasury, labelled as a management report, not an audited financial statement. | Built |
| REP-6 | Scheduled reports (monthly or quarterly) and a policy-compliance report. | Not built |
| REP-7 | Shareable read-only reports that a third party can verify against Safe addresses. | Not built |
| REP-8 | Accounting sync (QuickBooks Online, Xero, NetSuite) or connectors to Cryptio or Bitwave. | Not built |

### 5.9 Settings, team & policies

| ID | Requirement | Status |
|---|---|---|
| SET-1 | Sign-in with email one-time codes (6 digits, valid 10 minutes, 5 attempts, stored hashed), passkeys, or Sign-In with Ethereum. No passwords. | Built |
| SET-2 | Settings tabs: Organization (name, purpose), Approvals (approval policy), Preferences (theme and motion, stored in the browser only), Security (sign-in methods, passkeys, sessions). | Built |
| SET-3 | Owners and admins invite members by email with a role; invitations expire after 7 days and can be revoked. | Built |
| SET-4 | Role changes and removals respect the last-owner rule; only owners can grant the owner role. | Built |
| SET-5 | Approval policy: 1–6 amount tiers, each with a required count (1–10) and an optional required role; self-approval switch; proposal expiry (1 hour to 30 days). Saved as an append-only version with a reason. | Built |
| SET-6 | Autonomy levels: `observe`, `approval_required` (default) and `bounded_automation`. Choosing `bounded_automation` is rejected with `automation_not_enabled`; it requires on-chain setup that does not exist yet. | Built |
| SET-7 | Policy changes that widen risk (for example raising caps, lowering approval counts or allowing self-approval) require a second approver. | Not built: a single owner or admin can change either policy today; the change is versioned and audited |

### 5.10 Onboarding, including the sample workspace

| ID | Requirement | Status |
|---|---|---|
| ONB-1 | Steps: organization (name, purpose) → treasury (add a first account) → spending and obligations → reserve policy (preset or custom) → complete. Progress is saved so people can leave and return. | Built |
| ONB-2 | Accounts start read-only; verifying control is a separate, later step. | Built |
| ONB-3 | A sample workspace ("Sample: Northwind Protocol") can be created from onboarding. It uses addresses that belong to no one, simulated balances (USDC, USDT, EURC) with 30 days of history, six obligations of mixed certainty, a simulated EUR rate, and the same public venue data real organizations see. | Built (`apps/api/src/modules/sample.ts`) |
| ONB-4 | The sample is labelled on the overview, recommendations and proposal pages. Proposals can be created and approved to show the flow, but nothing can be prepared, signed or executed (`409 sample_workspace`). | Built |
| ONB-5 | Watch-only onboarding by pasting an address, with no wallet connection required. | Built |
| ONB-6 | Import obligations from CSV. | Not built |

## 6. Non-functional requirements

### 6.1 Security

| ID | Requirement | Status |
|---|---|---|
| SEC-1 | TokenIQ holds no keys and no funds. Owner transactions are never restricted by TokenIQ. | Built |
| SEC-2 | The browser calls only its own origin; the API sits behind a same-origin proxy. Session cookies are first-party, `httpOnly`, `SameSite=Lax`. | Built |
| SEC-3 | Every state-changing request must come from the web app's origin (`403 bad_origin`). Body limits and rate limits apply. | Built |
| SEC-4 | Organization scope is enforced on every route; non-members get `404` so ids do not leak. Every handler asserts a permission. | Built |
| SEC-5 | Execution addresses come only from the code listing and the chain registry; Safe code hashes are checked against canonical deployments. | Built |
| SEC-6 | Logs redact cookies, authorization headers, one-time codes, tokens, signatures and keys. | Built |
| SEC-7 | Kill switches (`DISABLED_FEATURES`: copilot, proposals, signatures, sync, opportunities, email) disable features without a deploy and return `503`. | Built |
| SEC-8 | No secrets in client bundles; secret scanning in CI. | Built |
| SEC-9 | Public statements say plainly that TokenIQ has had internal self-reviews only, no independent audit and no certifications. | Built (`/security`) |
| SEC-10 | Independent security review of the backend and web app before general availability. | Not built |

### 6.2 Money arithmetic

| ID | Requirement | Status |
|---|---|---|
| MON-1 | Reporting-currency values are bigint with 18 decimals; token amounts keep native decimals. Floats are used only for chart geometry. | Built ([ADR 0003](adr/0003-exact-money-arithmetic.md)) |
| MON-2 | Rounding is explicit: requirements round up, availability rounds down; outflow conversions round up and inflow conversions down. | Built |
| MON-3 | The database stores `numeric(38,18)` for USD and `numeric(78,0)` for raw amounts, returned as strings. The API sends decimal strings. | Built |
| MON-4 | Decimal inputs reject scientific notation, separators and excess precision. | Built |
| MON-5 | External floats (Morpho API) are converted through fixed-precision strings and rounded conservatively. | Built |
| MON-6 | Property tests prove round-tripping and rounding brackets. | Built |

### 6.3 Accessibility

| ID | Requirement | Status |
|---|---|---|
| A11Y-1 | Target WCAG 2.2 AA across the public site and app, in light and dark themes. | Partial: automated axe-core checks run in Playwright; no manual audit with assistive technology yet |
| A11Y-2 | Mobile and tablet layouts are tested; no horizontal scrolling of the page. | Built (e2e) |
| A11Y-3 | Reduced-motion preference is honoured; numbers use tabular figures. | Built (design system) |

### 6.4 Performance (targets, not yet measured)

| ID | Target |
|---|---|
| PERF-1 | Treasury overview API p95 under 1.5 s for an organization with up to 20 accounts. |
| PERF-2 | App pages show a usable first view (largest contentful paint) under 2.5 s on a mid-range phone over a 4G connection. |
| PERF-3 | A full account sync cycle completes within its 5-minute cadence for organizations with up to 50 accounts. |
| PERF-4 | New alerts appear within 10 minutes of the data change that triggers them. |
| PERF-5 | Copilot streams its first token within 5 s at the median. |

### 6.5 Reliability and data freshness

| ID | Requirement | Status |
|---|---|---|
| REL-1 | Jobs are idempotent: snapshots unique per account/asset/block, price observations unique per round, alerts unique per active fingerprint, proposal states only move forward. | Built |
| REL-2 | Data older than the policy limit marks figures incomplete and blocks new proposals until it is fresh. | Built |
| REL-3 | Each figure shows its data's age; the status page shows provider health. | Built |
| REL-4 | Migrations are forward-only and backward-compatible with the running release; recovery is restore-from-backup plus redeploy. | Built (`DATA_MODEL.md`, `OPERATIONS.md`) |
| REL-5 | An on-chain fallback when the Morpho API is unavailable (it has no SLA). | Not built: venue data goes stale and alerts fire |

### 6.6 PWA and offline

| ID | Requirement | Status |
|---|---|---|
| PWA-1 | The app is installable. | Built (`apps/web/src/app/manifest.ts`) |
| PWA-2 | The service worker never intercepts or caches `/api/*` or any non-GET request; navigations are network-first and never cached; offline shows a precached offline page. | Built (`apps/web/public/sw.js`) |
| PWA-3 | No fund-moving action (approval, signature, submission, payment record) is queued offline for later replay. Offline means read-nothing, do-nothing. | Built |

### 6.7 Privacy and data handling

| ID | Requirement | Status |
|---|---|---|
| PRIV-1 | Uploaded documents are stored with type, size and hash and downloaded only as attachments. | Built |
| PRIV-2 | Copilot conversations are private to the user who wrote them. | Built |
| PRIV-3 | Data export on termination and notice periods are defined in the terms. | Not built: `/legal/terms` still contains a placeholder for this |

## 7. Explicit assumptions

- Organizations already use Safe and can verify control with an owner wallet.
- USDC is the only asset for allocations in this release; obligations are in USD or EUR.
- Chainlink feeds and public or configured RPCs are honest. TokenIQ pins blocks and checks Safe code hashes, but a malicious RPC could misreport balances (`TESTING.md`).

## 8. Success metrics

All figures are **targets** for the early-access period. None has been measured; TokenIQ has no users yet.

| Area | Metric | Target |
|---|---|---|
| Activation | New non-sample organizations that verify a Safe, record 3+ obligations and save a policy within 7 days | ≥ 50% |
| Design partners | Organizations tracking real Safes read-only | 5 by the end of early access |
| Trust in the figure | Organizations that open the Reserves page weekly | ≥ 60% of active organizations |
| Correctness | Displayed reserve or deployable figures that differ from an engine recomputation of the same inputs | 0 |
| Control | Executions without the required approvals and threshold signatures | 0 |
| Proof | Payments recorded as `paid_verified` rather than `paid_unverified` | ≥ 80% |
| Execution flow | Prepared proposals that reach `executed` without going stale more than once | ≥ 90% |
| Speed | Median time from internal approval to execution | < 48 hours |
| Copilot | Sampled answers whose numbers all cite a tool record | 100% |
| Copilot safety | Copilot actions that change data | 0 |
| Freshness | Account syncs completed within the policy's data-age limit | ≥ 99% |

## 9. Release criteria

The early-access release ships when all of these hold:

1. CI is green: typecheck with no ignored errors, lint, engine unit and property tests, chain unit tests, API integration and security regression tests, contract tests, Playwright end-to-end and axe checks in both themes and on mobile, and the secret scan.
2. The fork end-to-end money path (`apps/api/test/fork-execution.test.ts`) passes on a fresh Base fork, and the live chain tests pass against mainnet on release day.
3. The venue listing review date is no more than 30 days old, and every listed address has been re-checked on-chain.
4. Kill switches are exercised in staging, and the status page reflects a simulated provider outage.
5. [`INCIDENT_RESPONSE.md`](INCIDENT_RESPONSE.md) and [`OPERATIONS.md`](OPERATIONS.md) have been walked through, including a restore from backup.
6. Public and in-app copy describes only features that exist (see §12), and the terms placeholder is resolved.
7. The sample workspace is labelled everywhere it appears and cannot be executed.
8. No TokenIQ contract is deployed, and `bounded_automation` remains locked.
9. The release-risk record referenced in `TESTING.md` exists and is current.

## 10. Out of scope for this release, and future work

| Item | Why not now | Prerequisite |
|---|---|---|
| Deploying `TreasuryReserveGuard` | Internal review only (22 findings; TRG-10 open); must not hold authority over real funds before an independent audit | Independent audit; Safe v1.5.0; decision on TRG-10 |
| Bounded automation | Depends on the guard and Zodiac Roles | Above, plus Roles scoping |
| Compiling the treasury policy into Zodiac Roles permissions | Design and review effort; must keep "widening needs a human" | Roles v2 integration design |
| Accounting sync (QuickBooks, Xero, NetSuite) or Cryptio/Bitwave connectors | Integrate rather than build a subledger | Partner choice |
| Tokenized treasury funds as venues | Eligibility, KYC and redemption terms differ by issuer | Listing criteria for permissioned assets |
| Morpho Vault V2 venues | Withdrawable liquidity cannot be read through ERC-4626 views | Exit-path computation (OPP-5) |
| Leading venue risk indicators | Data model and thresholds not designed | Morpho `pendingConfigs`, timelocks, oracle metadata |
| Signer nudges by email, Slack or Telegram | Notification channels beyond in-app not built | Channel choice; per-user settings |
| Safe{Wallet} queue integration | TokenIQ collects signatures itself | Transaction Service API key and rate limits |
| Payment proposals in the web app; batch payments | API exists; UI not designed | Payee address capture in obligation forms |
| Nested-Safe and contract signers (EIP-1271) | Not supported by the signature collector | Contract-signature verification |
| More currencies than USD and EUR | FX sources and stablecoin coverage | Feeds per currency |
| Non-EVM chains, bridging, fiat rails, cards, custody | Outside the product's model | — |
| Native mobile app | PWA covers reading and signing through wallet apps | Usage evidence |
| Pricing and billing | Pricing not set | Willingness-to-pay research |

## 11. Open questions

| ID | Question | Notes |
|---|---|---|
| Q1 | How will TokenIQ price? | Anchors in [`market-opportunities.md`](research/market-opportunities.md#4-pricing-anchors). The vision rules out fees on yield or assets. |
| Q2 | Should widening policy changes require a second approver (SET-7)? | Today one admin can lower approval counts or allow self-approval. Safe signatures still apply, but the internal control weakens. |
| Q3 | When and how to support Morpho Vault V2? | Curators are moving to V2 and Morpho's interface is V2-first; V1 listings may lose visibility. |
| Q4 | Should `deploy_surplus` rank venues by net APY excluding incentives? | Code ranks by `apy.netBps`, which includes rewards, and adds a warning. Research found rewards were 57–61% of net APY on two large vaults. |
| Q5 | Is a payment-proposal UI in scope for early access? | The API, engine checks and settlement exist. |
| Q6 | Email for approval requests: build it, or correct the integrations page? | The page says email covers approval requests; code emails sign-in codes, invitations and critical alerts only. |
| Q7 | How should the full `safeTxHash` and EIP-712 domain/message hashes be presented for hardware-wallet checks? | Needed after Bybit. |
| Q8 | How to resolve TRG-10 (module-based social recovery blocked while the guard is installed)? | Product decision recorded in `audits/CONTRACT_REVIEW.md`. |
| Q9 | What goes into the "leaving TokenIQ" guide, and where does it live? | Required by the vision's no-lock-in principle. |
| Q10 | Should TokenIQ support Safes whose owners are Safes? | Common in mature DAOs (Aave's two-layer setup). |
| Q11 | Who are the first design partners, and do they want read-only first? | No customers or interviews yet. |

## 12. Discrepancies found while writing this document

These are places where code, docs and copy disagree. Each needs a decision: fix the code or fix the words.

1. **Email scope.** `apps/web/src/components/marketing/integrations-data.ts` says email covers "approval requests". Approval events are in-app only (`apps/api/src/services/notify.ts`, `modules/proposals.ts`).
2. **Payment proposals.** The engine, API and settlement job support them, but no web flow creates one. Marketing does not claim it, but the product page's startup audience line implies paying the team from TokenIQ.
3. **Pending-proposal copy.** The reserve ledger labels pending outflows "Approved or awaiting signature", but allocation proposals count from `pending_approval` onward (`ACTIVE_PROPOSAL_STATUSES` in `apps/api/src/services/state.ts`).
4. **`safeTxHash` display.** Shown truncated, with the full value only in a tooltip.
5. **Unused recommendation kind.** `hold` is declared in `RecommendationKind` but never generated.
6. **Missing release-risk file.** `TESTING.md` links to `audits/RELEASE_RISKS.md`, which does not exist yet.
7. **Companion file name.** `research/design-benchmarks.md` names `visual-directions.md` as its companion; the repository has `design-directions.md`.
8. **Terms placeholder.** `/legal/terms` contains a bracketed placeholder for notice periods and data export.
9. **Unverified payments settle obligations.** The home page says a payment is paid when matched to an on-chain transfer and is still owed until then (`apps/web/src/components/marketing/home-sections.tsx`), and `research/legacy-audit.md` lists "paid only when verified on-chain" as a guardrail. In code, a `paid_unverified` record also removes the occurrence from the reserve requirement. Either count unverified payments as still owed, or change the copy. Counting them as owed is the more conservative choice and fits the "protect obligations first" principle.
