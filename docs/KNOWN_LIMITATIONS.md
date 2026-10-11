# Known limitations

What TokenIQ 2.0 does not do, or does only partly, in this release candidate. Read this before relying on it for decisions about real funds. Planned work is in the [Roadmap](ROADMAP.md). Security findings and their status are in [`audits/`](../audits/).

## Assurance

- **No independent audit.** The backend, frontend, contract and dependency reviews are internal self-reviews. Passing tests and a self-review are evidence, not assurance.
- **Not yet deployed.** The production images and Railway configuration exist but have not been run in production. The Docker images were not built locally during this release because the Docker daemon was unavailable; CI builds the web app but not the images.
- **No users yet.** The product has not been used by a real organization. The figures on the public site are illustrative and labelled as such.

## Scope

| Area | What is supported | Not supported |
|---|---|---|
| Networks | Ethereum, Base, Arbitrum One, OP Mainnet. Base Sepolia and Sepolia for testing, in separate organizations. | Other EVM chains, non-EVM chains, bridging. Funds must already sit on a venue's chain. |
| Assets | Allowlisted tokens only: USDC, USDT, DAI, USDS, USDbC, EURC and ETH, on the networks where each is listed. | Any other token in a Safe is ignored, not counted. |
| Venues | Seven code-listed venues: three Morpho V1 vaults (Gauntlet USDC Prime and Steakhouse USDC on Base, Steakhouse USDC on Ethereum) and Aave v3 USDC on all four networks. | Unlisted venues are shown for information only. Morpho Vault V2 is not listed because its ERC-4626 `max*` views return 0. |
| Accounts | Safe v1.3.0 to v1.5.0 for transactions. Wallets can be tracked and verified. | Proposals from wallets that are not Safes. |
| Signers | Safe owners that are regular accounts, signing EIP-712 or `eth_sign`. Hardware wallets through an injected wallet. | Owners that are themselves Safes or other contracts (EIP-1271), and pre-approved hashes. |
| Currencies | Obligations in USD and EUR. EUR is converted with Chainlink EUR/USD. | Other currencies. |
| Proposals | Allocations and withdrawals created from recommendations. | No screen yet for manual allocations or payment proposals; the API supports payments. No batch payments. |
| Notifications | In-app for every event. Email only for sign-in codes, invitations and critical risk alerts. | Email for approvals; Slack, Telegram, push. |
| Sign-in | Email one-time code, passkey, Sign-In with Ethereum. | SSO or SAML. Wallet-only accounts get a placeholder email, so they cannot accept invitations or receive email. |

## Data and trust

- **Prices come from Chainlink only**, with heartbeat-based staleness and L2 sequencer checks. There is no second price source. USD stablecoins are never valued above $1 for reserves.
- **Morpho venue data comes from Morpho's public API**, a centralised service. Aave data is read on-chain. If the API fails, venues are shown as stale and no recommendation uses them.
- **The RPC provider is trusted** for balances, Safe owners, nonces and receipts (BE-18). Use dedicated providers in production; public endpoints are rate-limited and unauthenticated.
- **"Marked paid" settles an obligation without on-chain proof.** This is deliberate, so obligations paid in fiat or from another wallet can be closed. Such payments are labelled as unverified in the app and in exports. On-chain verification checks recipient, token and amount, but not the sender (BE-26).

## Governance and execution

- **Cancelling a proposal does not invalidate Safe signatures already collected** (BE-11). Until it is built into TokenIQ, owners should execute a "reject" transaction at the same nonce in Safe{Wallet}. See [Leaving TokenIQ](LEAVING.md).
- **Approved proposals do not expire** (BE-27). Every prepare and execution re-validates the action and re-checks approval.
- **One owner or admin can loosen treasury limits** (for example the maximum deployed share), with immediate effect on re-validation. Changes are versioned and audited but not separately approved. Approval-policy changes cannot loosen proposals already in flight (BE-16).
- **The approver can be the member who changed a payee's address.** The 48-hour payee hold, audit event and owner notification still apply (BE-17).
- **No step-up authentication.** Approving needs an active session, not a fresh passkey check.
- **Execution recovery is manual.** A transaction that is never mined keeps the proposal `submitted`. A hash cannot be entered by hand, and a `failed` proposal has no retry control in the UI.
- **Revoked sessions stay valid for up to 60 seconds** because of the signed session cache (BE-15).

## Copilot

- **Optional.** It needs `ANTHROPIC_API_KEY`. Without one, it says so and the rest of the app is unaffected.
- **Data leaves the deployment when it is used.** Questions and the treasury data its tools return are sent to Anthropic's API. Review the provider's terms before enabling it.
- **Read-only.** It cannot create, approve, sign or execute anything. Its figures come from TokenIQ's engine, but its wording is not machine-checked.

## Operations

- **Single instances.** The API rate limiter is in memory, so run one API instance until it moves to a shared store. Run exactly one worker.
- **Database roles.** Append-only triggers protect the audit trail from the application, but the role that owns the tables can drop them (BE-31). Use separate migration and runtime roles.
- **No self-service organization deletion.** Sample workspaces can be deleted, but append-only records (audit events, policy versions, decided proposals) remain as a memberless shell. Deleting a real organization is an operator action.
- **Unbounded uploads and history.** Obligation documents and copilot history have no per-organization quota yet (BE-20).
- **Supply chain.** No SBOM or provenance checks. Docker base images are not pinned by digest.

## Web

- The Content-Security-Policy allows inline scripts (BE-30). The copilot renderer emits no HTML, which limits the impact.
- Known design-system deviations are listed in [Design system §13](DESIGN_SYSTEM.md). The release candidate targets WCAG 2.2 AA, and automated axe checks run in CI; a manual screen-reader pass has not been done.

## Before launch (owner decisions)

- No `LICENSE`: the code is public to read but grants no reuse rights.
- Legal pages (`/legal/terms`, `/legal/privacy`, `/legal/risks`) are drafts written by the builders, not reviewed by counsel.
- Contact and security email addresses are not set.
- The WalletConnect and Reown SDKs use community licences with commercial thresholds. Accept them before enabling WalletConnect, or remove it ([`audits/DEPENDENCY_REVIEW.md`](../audits/DEPENDENCY_REVIEW.md)).
