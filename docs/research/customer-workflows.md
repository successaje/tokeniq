# Customer workflows

- **As of:** 2026-10-11.
- **Evidence and inference are marked.** **[E]** is a fact from a cited public source. **[I]** is our inference or a hypothesis. TokenIQ has run no customer interviews, so every job-to-be-done below is an inference built from public governance posts, vendor documentation and incident reports.
- **Module status** refers to the code in this repository on 2026-10-11: **Built**, **Partial** (some of it, explained) or **Not built**.

## Personas at a glance

| Persona | Typical organization | Primary job **[I]** | TokenIQ role | Main modules |
|---|---|---|---|---|
| DAO treasury steward / multisig signer | DAO, foundation, committee | Sign only what is correct and within policy, without becoming the bottleneck | `approver` or `finance` | Approval center, Risk |
| Startup finance lead or CFO | Web3 startup holding stablecoins | Know how many months are protected before anyone proposes yield | `owner` or `finance` | Overview, Obligations, Reserves, Reports |
| Protocol finance / ops | Protocol foundation, finance committee, treasury working group | Apply an agreed policy to every move and report against it | `admin` or `finance` | Policies, Opportunities, Approvals, Reports |
| Contributor who gets paid | Any of the above | Be paid the agreed amount, in the agreed token, on time | None (does not sign in) | Obligations, Payments |
| External accountant or auditor | Outside firm or DAO reviewer | Reconstruct what happened, who decided it and under which policy | `viewer` | Reports, Activity |

## 1. DAO treasury steward / multisig signer

**Who.** A person who holds one key on one or more organizational Safes, often unpaid or paid a small stipend. Arbitrum paid its payment-multisig signers $1,500 a month and chairs $2,500 **[E]** ([Arbitrum forum](https://forum.arbitrum.foundation/t/wind-down-the-mss-transfer-payment-responsibilities-to-the-arbitrum-foundation/29279)).

**Job to be done [I].** When a transaction reaches my queue, I want to know what it does, why it exists and that it fits our policy, so that I can sign quickly without being the weak link.

**Current workflow [E].**
- Signers review transactions in Safe{Wallet} and sign with their own keys. Aave's main Safes ran 3-of-4 and its operating Safes drew capped amounts through on-chain allowances sized at 1–2 weeks of spending ([Aave ARFC, Jun 2025](https://governance.aave.com/t/arfc-update-signers-and-safe-configuration/22442)).
- Aave's June 2026 setup uses two layers: budget Safes at 2-of-3, where every signer is itself an organization-controlled Safe, and operations Safes that draw capped amounts. It names three principles: hot/cold separation, just-in-time capped funding, and proposers who cannot sign ([Aave ARFC, Jun 2026](https://governance.aave.com/t/arfc-june-update-signers-and-safe-configuration/25023)).
- Lido's Treasury Management Committee is a 4-of-7 multisig that never takes custody; strategies get 7 days of forum discussion and at least 72 hours of token-holder veto ([Lido](https://research.lido.fi/t/proposal-to-approve-lido-dao-treasury-management-principles-and-authorize-the-formation-of-a-treasury-management-committee/4279)).
- The SEAL framework recommends at least 3 signers, 7+ once a Safe holds over $1M, hardware wallets, separate Safes by function and a mandatory delay ([SEAL](https://frameworks.securityalliance.org/wallet-security/secure-multisig-best-practices)).

**Pain points [E].**
- *Coverage and speed.* Aave cited limited signer coverage, time zones and workload. Arbitrum wound down its 9-of-12 payments multisig (in practice 7 or 8 of 12) because it was too slow.
- *Verification under attack.* Bybit's 3-of-6 signers approved a malicious delegatecall shown by a compromised Safe web app; about $1.4–1.5B was lost ([BleepingComputer](https://www.bleepingcomputer.com/news/security/lazarus-hacked-bybit-via-a-breached-safe-wallet-developer-machine/)). Drift's signers were socially engineered into pre-signing transactions ([TRM Labs](https://trmlabs.com/resources/blog/north-korean-hackers-attack-drift-protocol-in-285-million-heist)).
- *Execution errors.* A Yearn multisig script swapped a whole balance and lost about $1.4M, 63% of its value ([crypto.news](https://crypto.news/yearn-finance-lost-1-4m-due-to-a-multisig-script-error/)).
- *Notifications.* Safe offers browser push only, no email or Slack ([Safe help](https://help.safe.global/articles/9750082418-how-to-start-receiving-web-push-notifications-in-the-web-wallet)).
- *Queue mechanics.* Transactions with the same nonce conflict, and rejecting one on-chain costs gas ([Safe help](https://help.safe.global/articles/3608612277-reject-and-delete-transactions)).

**What TokenIQ does.**

| Need | Module | Status |
|---|---|---|
| See what the Safe will do in plain words | Approval center: "What the Safe will do" lists each decoded call and its target | Built |
| Know it was simulated | `Safe.simulateAndRevert` before anyone signs; result and block shown | Built |
| Check the hash on a hardware wallet | `safeTxHash` shown | Partial: shown truncated, full value only on hover |
| Know who has signed | Owner list with signed / not signed, `x of threshold` | Built |
| Avoid nonce conflicts | Proposal marked `stale` when the Safe nonce moves; re-prepare and re-sign | Built |
| Know the action fits policy | Policy checks re-run at creation, preparation and before submission | Built |
| Be told when a signature is needed | In-app notification when a proposal is approved | Partial: no email, push or chat nudge; no reminder tied to an obligation's due date |
| Know not to sign during an L2 outage | `sequencer_down` alert advises not to sign | Built |
| Sign when the owner is itself a Safe (Aave's nested-signer pattern) | Signature collection | Not built: contract (EIP-1271) signatures and pre-approved hashes are rejected (`packages/chain/src/safe.ts`) |

**Inference [I].** The signer's real cost is attention. A signer who trusts that policy checks and simulation already ran needs only to verify the hash on the device. The open gap is reaching signers outside the app before an obligation falls due.

## 2. Startup finance lead or CFO

**Who.** The person who answers to founders or a board for cash, in a startup that holds most operating capital as stablecoins in one or more Safes.

**Job to be done [I].** Before anyone suggests earning yield, I want to know how many months of payroll and vendors are protected, so that I can defend runway and explain every move to the board.

**Current workflow [E], with gaps filled by [I].**
- Payables run through tools such as Request Finance, whose approval rules branch only on amount and tag and whose example adds a CFO step at $1,000 or more ([Request help](https://intercom.help/request-faq/en/articles/11418908-how-to-set-up-an-approval-policy-including-departments)). Payment from a Safe happens inside Safe, with owners signing there ([Request help](https://intercom.help/request-faq/en/articles/8622172-how-do-i-pay-with-safe-wallet-formerly-gnosis-safe)).
- Month-end close relies on CSV exports from wallets, exchanges and banks, then normalizing, cost basis and FX work ([Lisk blog](https://lisk.com/blog/posts/closing-the-books-when-half-your-cash-is-onchain/), vendor-adjacent).
- Runway is usually a spreadsheet next to these tools **[I]**. No product in the matrix computes a reserve from obligations.

**Pain points.**
- *Runway priced in a volatile token* **[E]**. Gitcoin's treasury was over 99.5% GTC in 2022 and fell to an average of $24.6M by Q1 2025 ([Gitcoin](https://gov.gitcoin.co/t/dao-financial-report-q1-2025/20441)). Startups holding their own token face the same risk **[I]**.
- *Liabilities funded in the wrong currency* **[E]**. Arbitrum's payroll multisig held ARB against USD commitments and came up about $29K short.
- *Even "safe" stablecoins move* **[E]**. USDC fell to about $0.88 during the SVB weekend in March 2023 ([The Block](https://www.theblock.co/post/218993/usdc-and-dai-remain-at-about-0-90-following-circles-disclosure-of-funds-at-svb)).
- *Knowledge gaps* **[E, dated]**. In Request's 2022 survey of 250+ finance leaders, 63% cited crypto knowledge gaps ([PR Newswire](https://prnewswire.co.uk/news-releases/request-finance-announces-the-release-of-web3-cfo-guide-301702785.html)). The figure is four years old.

**What TokenIQ does.**

| Need | Module | Status |
|---|---|---|
| One figure for what is free | Overview and Reserves: reserve-eligible capital, requirement, binding rule, deployable surplus | Built |
| Runway in months | Reserves: months of spend covered by available capital | Built |
| Burn that cannot be understated | Burn = higher of declared and itemized recurring obligations | Built |
| See commitments by certainty | Obligations: estimate, committed, invoiced; estimates can be excluded by policy | Built |
| Test bad cases | Scenarios: depeg, new obligation, burn change, runway change, frozen venue, hypothetical allocation | Built |
| Explain to the board | Printable snapshot; CSV exports | Built (management report, not audited statements) |
| EUR costs | EUR obligations converted with the Chainlink EUR/USD feed; warning when EUR obligations exceed EURC holdings | Built (USD and EUR only) |
| Push to accounting | — | Not built |

## 3. Protocol finance / ops

**Who.** A foundation finance team, a DAO finance committee, or a treasury working group that executes a policy approved by governance.

**Job to be done [I].** I want our agreed policy checked on every move automatically, so that the committee can act within limits without a governance vote each time, and report compliance afterwards.

**Current workflow [E].**

| Organization | Policy | How it is executed | Reporting |
|---|---|---|---|
| ENS | 3 years of opex in stablecoins; ≤30% per protocol; ≥90% low-risk; mainnet only | kpk acts inside the IPS through Zodiac Roles v2; IPS changes by Snapshot | Monthly report on constraint compliance, live dashboard, annual review ([ENS IPS](https://discuss.ens.domains/t/6-46-social-2026-endowment-investment-policy-update/22106)) |
| Lido | ≥2 months of runway in non-yield stables; yield-bearing ≤15% of treasury | Aragon vote; Easy Track for foundation drawdowns with per-period stablecoin limits | Quarterly cap check ([TMC-6](https://research.lido.fi/t/tmc-6-convert-dao-treasury-stablecoins-into-susds-and-update-config-on-easy-track-and-aragon-finance-accordingly/10868), [Easy Track](https://docs.lido.fi/guides/easy-track-guide)) |
| Aave | Runway above six months of burn (TokenLogic mandate) | Finance Committee, swap-steward allowances, monthly funding posts | Funding updates ([Aave](https://governance.aave.com/t/arfc-tokenlogic-financial-services-provider/20182)) |
| Arbitrum | Tokenized T-bills redeemable within 3 business days; managers cap protocols at 20–25% | Safe + Zodiac Roles; Foundation as custodian; forum → Snapshot → Tally in about 4 weeks | Monthly attestations; dashboards ([STEP](https://forum.arbitrum.foundation/t/final-arbitrum-stable-treasury-endowment-program/20139), [TMC](https://forum.arbitrum.foundation/t/tmc-proposed-allocations-v2-stablecoin-strategy/28786)) |
| Gitcoin | Yield to cover most of about $609K/yr of ops | 2-of-5 manager multisig controls an Avatar Safe owned by Gitcoin | Quarterly reports by business unit ([SGTM-004](https://gov.gitcoin.co/t/sgtm-004-generating-yield-on-dao-treasury-assets-to-support-runway/20217)) |

**Pain points [E].**
- *Curator and collateral risk.* In the Stream collapse, Gitcoin had about 2% of its vault in an affected Morpho vault; Arbitrum had none because its Gauntlet Prime vault allowed only WBTC and wstETH markets ([Arbitrum](https://forum.arbitrum.foundation/t/update-stream-finance-xusd-situation-and-impact-assessment/30206)).
- *Idle surplus.* About $150K of USDC built up across Arbitrum program wallets before a sweep.
- *Manager risk.* GnosisDAO voted to end kpk's mandate and unwind positions in a 14-day handover ([The Crypto Times](https://www.cryptotimes.io/2025/11/25/gnosis-to-fire-treasury-management-partner-kpk-with-community-vote/)).
- *Venue emergencies.* kpk made a precautionary Aave exit for ENS during the rsETH incident ([ENS review](https://discuss.ens.domains/t/kpk-h1-2026-review-for-the-ens-endowment/22358)).

**What TokenIQ does.**

| Need | Module | Status |
|---|---|---|
| Encode the policy | Treasury policy: reserve rules, haircuts, allowed chains/assets/protocols, max deployed, per-protocol and per-venue caps, share of venue liquidity, minimum TVL, maximum fee | Built |
| Change policy with a record | New version per change, with author and reason; append-only | Built |
| Check every move | `validateAction` runs every applicable policy check (account, data freshness, reserve, caps, venue suitability, liquidity); any failure blocks the proposal | Built |
| Watch concentration | Per-protocol alerts and recommendations | Built |
| See venue liquidity against our position | `venue_liquidity` alert when liquidity is under 2× our position | Built |
| Early warning before venue warnings fire | Pending curator changes, timelocks, oracle type, collateral look-through | Not built |
| Enforce policy on-chain | Zodiac Roles compilation; `TreasuryReserveGuard` | Not built (guard written, not deployed) |
| Report compliance | Snapshot, CSV exports | Partial: no scheduled or constraint-compliance report |

## 4. Contributor who gets paid

**Who.** An employee, contractor, steward or grantee paid in stablecoins.

**Job to be done [I].** I want to be paid the agreed amount, in the agreed token and network, on the due date, and to know when it is coming.

**Evidence [E].**
- Pantera's 2025 survey of 1,600+ respondents found 9.6% of workers paid in crypto in 2024, up from 3%; USDC was 63% of stablecoin pay and USDT 28.6% ([Cointelegraph](https://cointelegraph.com/news/crypto-salaries-triple-2024-stablecoins-payrolls-report)).
- ENS stewards are paid monthly in USDC: $4,000, $5,500 for lead or secretary, $3,000 for scribe (search snippet only) ([ENS forum](https://discuss.ens.domains/t/ens-dao-steward-compensation/18063)).
- Pokt ran weekly and monthly payments from spreadsheets and called it burdensome before moving to a 2-of-4 Safe and streaming ([Pokt](https://forum.pokt.network/t/dao-finance-operations-update/4729)).
- Payroll tools let the contract currency differ from the payment token, for example USD salary paid in USDC ([Request help](https://intercom.help/request-faq/en/articles/8624295-how-to-run-payroll)).

**What TokenIQ does.** Contributors do not sign in. They benefit indirectly:

| Need | Module | Status |
|---|---|---|
| Payroll protected before anything is deployed | Obligations feed the reserve; critical priority | Built |
| Paid to the right address, network and token | Payment proposals must match the obligation's recorded payee, network and asset | Partial: enforced in the API; the web app cannot create a payment proposal yet |
| Payment proven | Marking paid with a transaction hash decodes Transfer logs and checks recipient, amount and confirmations | Built |
| Late payment noticed | `obligation_overdue` and `obligation_unfunded` alerts; critical ones emailed to owners, admins and finance | Built |
| Payee self-service, payslips, streaming | — | Not built, not planned for 2.0 |

## 5. External accountant or auditor

**Who.** An outside accountant closing the books, a DAO's financial reviewer, or a community delegate checking a mandate.

**Job to be done [I].** I need a complete, tamper-evident record of what was decided, by whom, under which policy, and what happened on-chain, in a format my tools accept.

**Evidence [E].**
- Safe says its activity log keeps 12 months, cannot be exported and is not an audited log ([Safe help](https://help.safe.global/articles/1970669787-activity-log)). Its CSV export has a date filter only and covers monetary transactions only ([Safe help](https://help.safe.global/articles/7125131043-how-to-export-your-transaction-history-as-a-csv)).
- DAOs publish quarterly or monthly reports: Uniswap Foundation quarterly unaudited summaries ([Uniswap](https://gov.uniswap.org/t/uniswap-foundation-summary-q3-2025-financials/25921)); Across buys monthly reports from Octav.
- Accounting tools sync to ERPs: Request to QuickBooks, Xero and NetSuite; Bitwave adds Sage Intacct; Cryptio to NetSuite.

**What TokenIQ does.**

| Need | Module | Status |
|---|---|---|
| Read-only access | `viewer` role | Built |
| Tamper-evident history | Audit events, approvals, policy versions and Safe signatures are append-only, enforced by database triggers | Built |
| Raw evidence | CSV exports: activity, obligations, payments, balances (with block number and hash), proposals, policies; formula injection neutralized | Built |
| Paid vs claimed | Payments are `paid_verified` (matched on-chain), `paid_unverified` (recorded by a member) or `skipped` | Built |
| Point-in-time view | Printable snapshot, labelled as a management report, not an audited statement | Built |
| ERP sync, cost basis, FX retranslation, period close | — | Not built; integrate with accounting tools rather than replace them |

## 6. Adjacent: delegated treasury managers

kpk, TokenLogic, Avantgarde and Gauntlet run treasuries for DAOs under mandates **[E]** (fees in [`market-opportunities.md`](market-opportunities.md#4-pricing-anchors)). They are not a TokenIQ persona today. **[I]** They could be a channel (a shared policy and reporting layer between a DAO and its manager) or a competitor (kpk already sells diagnostics, IPS and reporting). This needs interviews before any product decision.

## 7. The end-to-end workflow and where each persona acts

| Step | Persona | TokenIQ module | Status |
|---|---|---|---|
| Add Safes read-only; prove control with an owner's signature | Finance lead | Accounts, Onboarding | Built |
| Record payroll, vendors, grants, invoices | Finance lead | Obligations | Built |
| Agree reserve rules and limits | Finance lead, protocol ops | Reserves / Settings → Policies | Built |
| See the requirement, coverage and deployable surplus | All | Overview, Reserves | Built |
| Receive a deterministic recommendation | Finance lead | Recommendations | Built |
| Create a proposal from it | Finance | Recommendations → Approval center | Built (from recommendations only) |
| Approve internally by amount tier | Approvers | Approval center | Built |
| Prepare and simulate the Safe transaction | Signer | Approval center | Built |
| Sign in own wallet | Signers | Approval center | Built |
| Submit; any wallet pays gas | Anyone | Approval center | Built |
| Track receipt, Safe event and confirmations; reconcile | System | Background jobs | Built |
| Pay obligations through a proposal | Finance, signers | — | Partial (API only) |
| Report to board, community, accountant | Finance, auditor | Reports, Activity | Built (CSV and snapshot) |

## 8. Requirements these workflows imply

Each comes from evidence above. Status reflects the code today.

1. **Separate the decision from the signature.** Internal approval, owner signatures and on-chain execution are three records (Bybit, Aave proposers who cannot sign). Built.
2. **No widening of scope without a human.** Adding a venue, raising a cap or changing a policy must be a recorded human action (Zyfai's growing registry is the counter-example). Built for policies and the venue listing (code review and deploy).
3. **Size by exit liquidity, not by yield.** Built for the 5%-of-liquidity cap; leading indicators not built.
4. **Fund liabilities in their own currency.** Built for USD and EUR mismatch warnings.
5. **Reach signers where they are, tied to due dates.** Not built beyond in-app notices.
6. **Everything exportable.** Built for CSV; accounting sync not built.

## 9. Gaps in this evidence

- No interviews, no usage data and no first-hand complaints (Reddit and X threads could not be fetched).
- Startup CFO evidence is thinner than DAO evidence, because DAOs publish their governance and startups do not.
- Nothing here covers tax, 1099s or payroll compliance.
