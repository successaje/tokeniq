# Competitor matrix

- **As of:** 2026-10-11 unless a row says otherwise. Every fact below was captured on or before that date.
- **Evidence:** the research notes listed in [`../COMPETITIVE_RESEARCH.md`](../COMPETITIVE_RESEARCH.md#sources-and-notes), plus two pages fetched on 2026-10-11 for this document (Den and Aera, marked "fetched").
- **Scope:** products a crypto-native organization might use instead of, or next to, TokenIQ. Yield venues and curators are listed separately because TokenIQ routes funds *to* them rather than competing with them. Stripe, Linear and Mercury appear only as UX references.

## How to read the symbols

| Symbol | Meaning |
|---|---|
| ✓ | Public material shows the capability. |
| partial | Some of it, or a limited form. The cell says which part. |
| ✗ | The research looked at the product's public material and found no sign of it. This is absence of evidence, not proof of absence. |
| unknown | Not examined, or the page could not be read. |
| historic | The product had it, but the product has shut down. |

Logged-in apps were not inspected for any product except Stablerail's public demo tour, which uses mocked data. Most cells therefore describe what a company says, not what was observed working.

## 1. Planning capabilities

| Product | Treasury visibility across Safes and chains | Obligations / AP | Runway or reserve policy | Deployable-surplus calculation | Yield venues |
|---|---|---|---|---|---|
| **Safe{Wallet} / Safe Pro** | ✓ Workspace links several Safes; requires Safe Pro | ✗ | ✗ | ✗ | partial: "Earn" through Kiln/Morpho, 10% fee on rewards |
| **Zodiac Roles** | ✗ (permissions module) | ✗ | ✗ | ✗ | ✗ |
| **Den** | ✓ multi-chain, multi-wallet (EVM only), per its site | partial: batch payments, vendor disbursements | ✗ | ✗ | ✗ (none described) |
| **Brahma** (sunset) | unknown | unknown | unknown | unknown | unknown |
| **Coinshift Business** (sunset) | historic: portfolio history | historic: mass and recurring payouts, Superfluid streams | historic: "cash flow tracker" (scope unknown) | unknown | unknown |
| **Request Finance** | partial: balances ("Cash Position") | ✓ bills, AP, AR, payroll, batch payouts | ✗ | ✗ | ✗ "Yield Rewards" labelled Soon |
| **Octav** | ✓ read-only, 50+ chains claimed | ✗ | ✗ | ✗ | ✗ |
| **Cryptio** | partial: a "Treasury Dashboard" help page exists (did not load) | unknown | unknown | unknown | unknown |
| **Bitwave** | partial: wallets connected to accounting/ERP | ✓ stablecoin AP/AR | ✗ (its buyer's guide omits forecasting) | ✗ | ✗ (buyer's guide omits yield) |
| **TRES Finance / Fireblocks** | ✓ 220+ networks claimed | unknown | unknown | unknown | partial: Fireblocks Earn (Morpho vaults curated by Sentora) |
| **kpk** (ex-karpatkey) | ✓ as a service: reports and dashboards | ✗ | ✓ as a service: runway and liquidity diagnostics, then an IPS | partial as a service: allocation inside the IPS | ✓ discretionary, inside the IPS |
| **Zyfai** | partial: one agent account per user | ✗ | ✗ | ✗ | ✓ 60–80+ pools (counts differ across its pages) |
| **Giza** (wound down) | unknown | unknown | unknown | unknown | historic: ARMA and Pulse yield agents |
| **Gauntlet Aera** | partial: public vault dashboard | ✗ (none described) | ✗ | ✗ | ✓ automated stablecoin yield across lending protocols |
| **Stablerail** | ✓ "Total Liquidity" split into Available and Earning | partial: pay, receive, payout runs; no obligations calendar seen | ✗ (not seen in the demo tour) | ✗ | ✓ Morpho curated vaults, 10% fee on yield |
| **Ramp Stablecoin Account** | partial: one custodial account on 7 networks | ✓ bills, card statements, vendors | unknown | ✗ | partial: promotional rewards (3.98% reported) with conditions |
| **Coinbase Business** | partial | partial: payouts, payment links | unknown | ✗ | ✓ USDC rewards of about 4.1% |
| **Squads Altitude** (Solana) | partial: business accounts | ✓ payments, AP, invoicing, cards | unknown | ✗ | ✓ Altitude Earn: tokenized treasuries, private credit, a Gauntlet DeFi vault |
| **TokenIQ 2.0** (this repo) | ✓ Safes and wallets on Ethereum, Base, Arbitrum One, OP Mainnet | ✓ obligations calendar; payments verified on-chain | ✓ strictest of floor, runway and obligations | ✓ | partial: 7 listed USDC venues (3 Morpho V1 vaults, 4 Aave v3 markets) |

## 2. Control capabilities

| Product | Policy enforced on-chain | Approval workflow | Signing safety / simulation | Accounting / ERP sync | AI / agent features |
|---|---|---|---|---|---|
| **Safe{Wallet} / Safe Pro** | partial: m-of-n threshold; spending limits (Business plan and up). Proposers are off-chain with no on-chain record | partial: owner signatures, proposer role, Workspace Admin/Member roles. No amount-tiered internal approvals seen | ✓ Safe Shield (Blockaid, Tenderly, Hypernative); simulation from Starter; Security Hub score | partial: CSV export (date filter only, monetary transactions only). Activity log kept 12 months, not exportable | unknown: "Shield Copilot" rates severity using third-party providers |
| **Zodiac Roles** | ✓ scoped permissions by target, function and parameters; allowances with refill periods | ✗ (a permissions layer, not a workflow) | unknown | unknown | unknown |
| **Den** | ✓ claimed: a Guardian co-signer plus on-chain contracts validate policies | ✓ M-of-N, spending limits, allowlists, delegated payments | partial: "human-readable review" claimed; simulation not mentioned | ✗ (none highlighted) | ✗ (none mentioned) |
| **Brahma** (sunset) | historic: guards and policies on Safe Sub-Accounts | unknown | unknown | unknown | unknown |
| **Coinshift Business** (sunset) | unknown | unknown | unknown | unknown | unknown |
| **Request Finance** | ✗ | ✓ single or multi-step, conditional on amount and tag only; Growth plan ($300/mo) and up | partial: double-payment check (only for payments made through Request) | ✓ QuickBooks Online, Xero (Growth+), NetSuite (Enterprise) | unknown |
| **Octav** | ✗ | ✗ | ✗ | partial: tagging, PDF/CSV reports, NAV; no ERP sync seen | unknown |
| **Cryptio** | unknown | unknown | unknown | ✓ subledger; NetSuite | unknown |
| **Bitwave** | unknown | ✓ approval flows on AP/AR | unknown | ✓ QuickBooks Online, NetSuite, Sage Intacct, Xero | unknown: markets itself for "agentic finance" |
| **TRES Finance / Fireblocks** | unknown | ✓ Fireblocks' existing approval and policy stack (per Morpho's announcement of Fireblocks Earn) | unknown | ✓ QuickBooks Online, Xero | unknown |
| **kpk** | ✓ Safe + Zodiac Roles; each permissions change goes through a DAO executable proposal | partial: manager acts with discretion inside the IPS; the DAO approves policy and permission changes | unknown | partial: monthly, quarterly and annual reports | claimed: homepage mentions policy-first AI agents |
| **Zyfai** | ✓ session keys limited to a Target Registry of contracts, functions and parameters. The registry can grow **without the user re-signing** | ✗ (no multisig team guidance) | n/a (automated) | unknown | ✓ rule-based agent, SDK, MCP server, ERC-8004 registrations |
| **Giza** (wound down) | unknown | unknown | unknown | unknown | historic: autonomous yield agents |
| **Gauntlet Aera** | ✓ owner-set allowlists of assets and protocols | partial: owners set allowlists; Gauntlet "guardians" execute | unknown | unknown | partial: automated rebalancing (not described as AI) |
| **Stablerail** | unknown | ✓ quorum approvals, self-approval presets ($1k / $10k / $50k), document thresholds, new-recipient flags, payout runs with new addresses auto-paused | ✓ risk verdict and score, sanctions and source-of-funds checks before signing | partial: ledger and CSV; ERP not seen | ✓ AI copilot and a behavioural monitoring agent |
| **Ramp Stablecoin Account** | ✗ (custodial) | unknown for this account; Ramp's wider platform has amount-tiered approval policies (design benchmarks §3.4) | n/a (custodial) | ✓ ERP sync | unknown |
| **Coinbase Business** | ✗ (Coinbase-held account; inference) | unknown | n/a | ✓ QuickBooks/Xero through CoinTracker | unknown |
| **Squads Altitude** | unknown | unknown | unknown | unknown | unknown |
| **TokenIQ 2.0** (this repo) | partial: the Safe threshold only. `TreasuryReserveGuard` is written and tested but **not deployed**; Zodiac Roles compilation is not built | ✓ amount tiers, required roles, no self-approval by default, expiry; owner signatures collected in-app | partial: decoded call list, `Safe.simulateAndRevert`, live owner and nonce checks, `safeTxHash` shown. No third-party threat screening | partial: six CSV exports; no ERP sync | partial: read-only copilot that cites records and runs hypothetical scenarios; it cannot create or approve anything |

## 3. Custody, pricing and status

| Product | Custody model | Public pricing | Status (alive?) | Primary sources |
|---|---|---|---|---|
| **Safe{Wallet} / Safe Pro** | Self-custodial smart account; owners hold keys | Core free (1 standalone Safe); Starter €189/mo; Business €669 / €999 / €1,669 per month; Enterprise custom. Swap fees 0.05–0.70%; Earn takes 10% of rewards | Alive. Safe Pro standard pricing started 6 Oct 2026; free Workspaces must be claimed by 5 Dec 2026 | [pricing](https://safe.global/pricing), [plans](https://help.safe.global/articles/1569083243-plans-at-a-glance), [early partner](https://safe.global/blog/safe-pro-early-partner-program), [claim](https://help.safe.global/articles/7110904247-claim-your-free-period-workspaces-created-before-6-october) |
| **Zodiac Roles** | Module on the customer's own Safe | Free / $250 "Starter" (billing period not captured) / Enterprise | Alive. Zodiac Labs GmbH; docs updated 9 Oct 2026 | [pricing](https://www.zodiac.eco/pricing), [allowances](https://docs.roles.gnosisguild.org/general/allowances), [GitHub](https://github.com/gnosisguild/zodiac-modifier-roles) |
| **Den** | Self-custody with a Guardian co-signer and on-chain contracts (details not explicit) | Not public | Alive. Claims SOC 2 Type II and audits by Certora and yAudit (not verified). den.xyz is now a domain marketplace | [onchainden.com](https://onchainden.com) (fetched 2026-10-11, summary only) |
| **Brahma** | Safe Sub-Accounts | n/a | **Sunset** 17 Apr 2026, 21:00 UTC. A recovery tool removes Brahma's guards and policies. The notes record a Polymarket acquisition on 18 Mar 2026 reported by Fortune and The Block; that link was not captured | [docs.brahma.fi](https://docs.brahma.fi) (fetched 2026-10-11) |
| **Coinshift Business** | unknown | n/a | **Sunset** by 31 Mar 2026 (site banner). coinshift.xyz now carries a different product title | [beta.coinshift.xyz](https://beta.coinshift.xyz), [docs index](https://docs.coinshift.xyz/llms.txt) |
| **Request Finance** | Business Account runs on Bridge (balances held as USDB); Request says it does not take custody. Safe payments are signed in Safe | Free; Starter $50/mo; Growth $300/mo; Pro $600/mo; Enterprise custom. Off-ramp 0.5–1% plus flat fees | Alive, **pivoted** to SMB stablecoin accounts. Card programme suspended because its provider is winding down (updated 17 Sep 2026) | [pricing](https://www.requestfinance.com/pricing), [approvals](https://intercom.help/request-faq/en/articles/9825973-approval-policies-overview), [cards](https://intercom.help/request-faq/en/articles/16118140-important-update-about-cards) |
| **Octav** | Read-only; never asks for keys | Free; Lite $149/yr per address; Growth $499/yr per address; Enterprise custom. API $100–$20,000/mo | Alive | [octav.fi](https://octav.fi/), [API](https://octav.fi/api), [Across example](https://forum.across.to/t/octav-onboarding-to-track-across-dao-treasury/1958) |
| **Cryptio** | Accounting software (read side) | By quote or proof of concept | Alive. $45M Series B on 12 Mar 2026; SOC 1 and SOC 2 Type II | [cryptio.co](https://cryptio.co/), [CoinDesk](https://www.coindesk.com/business/2026/03/12/crypto-accounting-firm-cryptio-raises-usd45-million-in-series-b-funding-round) |
| **Bitwave** | unknown | Not public (Startups / Enterprises / Institutions) | Alive | [bitwave.io](https://www.bitwave.io/), [buyer's guide](https://www.bitwave.io/blog/crypto-treasury-management-software-buyers-guide) |
| **TRES Finance / Fireblocks** | Fireblocks custody platform | Not captured | TRES **acquired** by Fireblocks on 7 Jan 2026 for $130M | [Fortune](https://fortune.com/2026/01/07/fireblocks-tres-finance-acquisition-130-million), [Fireblocks Earn](https://morpho.org/blog/fireblocks-brings-onchain-yield-to-2400-enterprise-customers-with-morpho) |
| **kpk** | Non-custodial: limited permissions inside client-owned Safes | About 0.50%/yr management fee on ENS ($221,275 for H1 2026 on $67.7M); 0.5% on the Arbitrum TMC; 2% of AUM on SafeDAO (2024) | Alive, **rebranded** from karpatkey. GnosisDAO voted to end its mandate in Nov 2025 | [treasuries](https://kpk.io/treasuries), [about](https://kpk.io/about), [ENS H1 2026](https://discuss.ens.domains/t/kpk-h1-2026-review-for-the-ens-endowment/22358) |
| **Zyfai** | Each agent account is a Safe (Safe7579) owned by the user's wallet; session key held in a TEE | 10% performance fee on earnings, half to ZFI stakers | Alive. TVL $10.44M on 2026-10-11 (DefiLlama). Its dashboard showed "$0 of funds moved" at capture, apparently a loading bug | [session keys](https://docs.zyf.ai/docs/product/control/session-keys.md), [fees](https://docs.zyf.ai/docs/product/other/fees.md), [DefiLlama API](https://api.llama.fi/protocol/zyfai) |
| **Giza** | unknown | n/a | **Wound down**: ARMA and Pulse wind-down announced 26 Feb 2026, migration deadline 26 Mar 2026 (third-party review; primary announcement not found). TVL peaked at $45.6M on 2026-01-20, then fell to about zero | [ownyourmind.ai review](https://ownyourmind.ai/projects/giza/) |
| **Gauntlet Aera** | Non-custodial vaults; only owners deposit or withdraw | Not published | Closed beta per its site. DefiLlama lists Aera V3 at $169M and V2 at $47M | [aera.finance](https://www.aera.finance/) (fetched 2026-10-11) |
| **Stablerail** | Self-custodial MPC built on Privy | Starter $213/mo; Growth $850/mo; Business $2,550/mo; plus 10% of yield | Alive (public demo tour with mocked data) | [stablerail.com](https://stablerail.com), [demo](https://app.stablerail.com/demo) |
| **Ramp Stablecoin Account** | Custodial segregated wallet | Not captured | Alive. US businesses except New York | [Ramp support](https://support.ramp.com/hc/en-us/articles/50390917452947-Ramp-Stablecoin-Account-overview) |
| **Coinbase Business** | Coinbase-held account (inference) | Not captured | Alive; self-serve onboarding | [Decrypt](https://decrypt.co/344647/coinbase-launches-stablecoin-payments-platform-businesses) |
| **Squads Altitude** | Self-custodial (Squads) | Not captured | Alive. $18M raise in Apr 2026; claims 500+ businesses and $200M+ in payments | [Altitude Earn](https://squads.xyz/blog/compound-your-capital-with-altitude-earn), [FinTech Global](https://fintech.global/2026/04/30/squads-raises-18m-to-expand-stablecoin-finance-platform/) |
| **TokenIQ 2.0** | Non-custodial; never holds keys; funds stay in the customer's Safe | Free during early access; no pricing set; no fee on funds or yield | Pre-launch. No customers. No independent audit (internal self-reviews only) | [`ARCHITECTURE.md`](../ARCHITECTURE.md), [`CONTRACTS.md`](../CONTRACTS.md) |

## 4. Product notes

Short notes on what each row means for TokenIQ. Analysis is marked as such.

**Safe{Wallet} / Safe Pro.** Safe is moving its organizational features behind a subscription. Spending limits and the proposer role now need the Business plan ([source](https://help.safe.global/articles/9640607537-spending-limits-and-the-proposer-role)). Safe itself says its activity log is not an audited log and cannot be exported ([source](https://help.safe.global/articles/1970669787-activity-log)). Exporting transaction data has "no easy way" beyond its API ([source](https://help.safe.global/articles/9247427019-export-transaction-data)). Notifications are browser push only; there is no email or Slack ([source](https://help.safe.global/articles/9750082418-how-to-start-receiving-web-push-notifications-in-the-web-wallet)). Safe reported more than $10M of annualized revenue and a cut from about 100 to 60 staff ([forum](https://forum.safefoundation.org/t/2025-reflections-and-2026-outlook/6861)). The notes record two different figures for gas sponsorship on the Business plan, so this document does not state one. The pricing page describes Business tiers by number of Safes (5–20) and the help page by seats (5/10/20); which unit applies was not confirmed. *Analysis:* Safe is the platform TokenIQ depends on and the most likely company to build obligations-aware features. TokenIQ should complement Safe rather than replace it.

**Zodiac Roles.** The enforcement layer that kpk, ENS and the Arbitrum TMC already use. ENS migrated to Roles v2 in EP 5.12 ([source](https://docs.ens.domains/dao/proposals/5.12)). Its allowances (amount, refill, period) are documented as available to Roles Modifiers owned by a Zodiac OS account ([source](https://docs.roles.gnosisguild.org/general/allowances)). *Analysis:* TokenIQ should generate Roles configurations rather than invent its own permission system.

**Den.** A live alternative to Safe as an organizational wallet, with payments, policies and approvals in one product. Everything in its row comes from one marketing page fetched on 2026-10-11 ([onchainden.com](https://onchainden.com)); none of it was verified in the product.

**Brahma and Coinshift Business.** Both were Safe-adjacent treasury layers and both shut down in early 2026. Brahma's docs point users to a recovery tool that produces a Safe Transaction Builder file removing its guards and policies ([docs](https://docs.brahma.fi)). Coinshift's docs index still lists its business features after the sunset ([index](https://docs.coinshift.xyz/llms.txt)). *Analysis:* a documented exit was the only thing that protected their users.

**Request Finance.** The most complete AP product in the set, now aimed at mainstream SMBs, with web3 as one vertical among eight ([homepage](https://www.requestfinance.com/)). It pays from Safes through a Safe App, with owners signing in Safe ([source](https://intercom.help/request-faq/en/articles/8622172-how-do-i-pay-with-safe-wallet-formerly-gnosis-safe)). Its own usage claims disagree with each other (1,500+ finance teams on the homepage, 2,000+ organizations in an older help article). *Analysis:* approvals are per payable; there is no treasury-level reserve rule.

**Octav.** Read-only portfolio intelligence. Across DAO paid $1,440 a year for 4 wallets and 12 monthly reports ([forum](https://forum.across.to/t/octav-onboarding-to-track-across-dao-treasury/1958)). *Analysis:* its paste-an-address onboarding is the bar for TokenIQ's watch-only start, and its per-address pricing penalizes organizations with many wallets.

**Cryptio, Bitwave, TRES/Fireblocks.** The accounting layer is consolidating and moving upmarket. Cryptio is adding treasury and loan apps according to a search snippet only. *Analysis:* TokenIQ should export to these tools, not compete with them.

**kpk.** Sells as a service what TokenIQ wants to make into software: diagnostics, an IPS, on-chain policy through Zodiac Roles, then reporting ([treasuries](https://kpk.io/treasuries)). On ENS it returned 2.62% net in H1 2026 against a 2.80% benchmark, for about 0.50% a year in fees ([review](https://discuss.ens.domains/t/kpk-h1-2026-review-for-the-ens-endowment/22358)). Its AUM figures do not reconcile across its own pages, so none is quoted here.

**Zyfai.** The largest yield agent by TVL in DefiLlama's "AI Agents" category at capture, at $10.44M. Its docs say users do not re-sign when new pools or protocols join the registry ([session keys](https://docs.zyf.ai/docs/product/control/session-keys.md)). *Analysis:* that is the anti-pattern TokenIQ's policy model must avoid: any widening of scope needs human approval.

**Gauntlet Aera.** Non-custodial treasury vaults with owner-set allowlists and Gauntlet-run execution, in closed beta ([aera.finance](https://www.aera.finance/), fetched 2026-10-11). Gauntlet also curates one of TokenIQ's listed Morpho vaults, so it is both a venue partner and an adjacent competitor.

**Stablerail.** The closest live product to TokenIQ's scope: payments, policies, signing checks, an AI copilot and Morpho-based earn in one app. The demo tour showed no runway, obligations calendar or reserve floor ([demo](https://app.stablerail.com/demo); lead notes). *Analysis:* Stablerail could add a runway feature quickly. TokenIQ's difference has to be the obligations-to-reserve maths and staying on the customer's existing Safe.

**Ramp, Coinbase Business, Squads Altitude.** Stablecoin business accounts that pay 3.98–5% on idle balances ([Ramp](https://support.ramp.com/hc/en-us/articles/50390917452947-Ramp-Stablecoin-Account-overview), [Decrypt](https://decrypt.co/344647/coinbase-launches-stablecoin-payments-platform-businesses), [Squads](https://squads.xyz/blog/compound-your-capital-with-altitude-earn)). Ramp's 3.98% is promotional and conditional. Squads' 5.00% is an "up to" figure on tokenized treasuries. *Analysis:* these set the yield bar that any DeFi allocation has to beat after risk.

## 5. Venues and curators (not competitors)

TokenIQ routes funds to these. They matter because their data and failure modes shape what TokenIQ must show.

| Venue / curator | Role | Facts that matter for a treasury | TokenIQ today | Sources |
|---|---|---|---|---|
| **Morpho** | Lending network; vaults run by independent curators | DefiLlama TVL $11.33B, borrowed $5.76B (2026-10-11). The four largest V2 vaults with liquidity data had only 8.2–11.1% instantly withdrawable. Rewards were about 57% and 61% of net APY on two of the top five. V2 vaults return 0 from ERC-4626 `max*` views. The API exposes `pendingConfigs`, timelocks, caps and warnings, but has no SLA. Built-in warnings fire late (for example `low_liquidity` below 0.5%). | Lists 3 **V1** (MetaMorpho) USDC vaults: Gauntlet USDC Prime (Base), Steakhouse USDC (Base), Steakhouse USDC (Ethereum). V2 excluded because withdrawable liquidity cannot be read on-chain | [DefiLlama](https://api.llama.fi/protocol/morpho), [API docs](https://docs.morpho.org/tools/offchain/api/get-started/), [warnings](https://docs.morpho.org/interface/warnings/), [Vault V2](https://github.com/morpho-org/vault-v2) |
| **Steakhouse Financial** | Curator (61 vaults on Morpho) | No exposure to Stream xUSD in Nov 2025 per Protos. Tiers: Prime, High Yield, Term, Turbo. Steakhouse High Yield USDC (Base, V2) showed 4.15% APY, 3.10% net, with a 25% performance fee. Its AUM figures range from $1.5B to $4.23B depending on the page, so none is quoted as settled. | Curates 2 of the 3 listed Morpho vaults | [Protos](https://protos.com/stream-finance-meltdown-winners-and-losers-in-defi-risk-curator-reckoning/), [app](https://app.steakhouse.financial), [risk](https://www.steakhouse.financial/docs/risk-management) |
| **Aave** | Lending protocol | Aave total TVL $18.55B (2026-10-11). V4 launched on Ethereum on 30 Mar 2026. During the April 2026 rsETH incident Aave froze rsETH across 11 V3 markets and then WETH. Its open-source front end blocks risky borrows until the user ticks a risk acknowledgement. | Lists the native USDC reserve of the Aave v3 core market on Base, Ethereum, Arbitrum One and OP Mainnet | [DefiLlama](https://api.llama.fi/protocol/aave), [V4](https://www.theblock.co/post/395617), [rsETH report](https://governance.aave.com/t/rseth-incident-report-april-20-2026/24580), [interface](https://github.com/aave/interface) |
| **Gauntlet** (curator) | Curator; also Aera | Claimed no Stream/Elixir exposure; The Block, citing D2 Finance, reports Gauntlet-curated Morpho vaults were affected by Resolv USR in Mar 2026. Arbitrum DAO had no Stream exposure because its Gauntlet Prime vault only allowed WBTC and wstETH markets. | Curates 1 listed Morpho vault | [Gauntlet](https://vaultbook.gauntlet.xyz/resources/market-volatility), [The Block](https://www.theblock.co/post/394582), [Arbitrum](https://forum.arbitrum.foundation/t/update-stream-finance-xusd-situation-and-impact-assessment/30206) |

For comparison, blue-chip USDC venues on Base showed 4.15–4.71% on Zyfai's public risk dashboard at capture (Compound V3 USDC 4.71%, Morpho Gauntlet USDC Prime 4.63%, Gauntlet USDC Core 4.16%, Spark USDC 4.15%) ([risk.zyf.ai](https://risk.zyf.ai/)). These are instantaneous figures from a third party's dashboard, not TokenIQ measurements.

## 6. UX references (not competitors)

From [`design-benchmarks.md`](design-benchmarks.md) (research date 2026-10-11). These shape how TokenIQ looks and behaves, not what it does.

| Reference | What TokenIQ takes | What TokenIQ avoids | Source section |
|---|---|---|---|
| **Stripe** | Typographic restraint; empty-state rules (title ends with a period, action matches title, filtered-empty differs from first-use); loading, error, empty, content render order | Large gradient art; 300 ms micro-motion in a working app | §3.1 |
| **Linear** | Calm density; dimmed navigation so content leads; themes generated from a few perceptual inputs including contrast; ⌘K as a superset of menus; about 100 ms feedback | Black-and-indigo look; faint grey-on-black text a finance user must read in an audit | §3.2 |
| **Mercury** | Every rate shown with an as-of date, "net of fees", named instruments and liquidity terms in time units; separation of duties as a default; a public seeded demo | Mood photography hero; pill CTAs on dense screens | §3.3 |

## 7. Gaps in this matrix

- Logged-in products were not inspected, so no row confirms that a feature works.
- Den, Squads Altitude, Coinbase Business and Ramp rest on one or two pages each.
- Pricing for Bitwave, Cryptio, TRES/Fireblocks, Ramp, Coinbase Business, Squads Altitude, Den and Aera was not public or not captured.
- Customer complaints were barely mined: Request's Trustpilot page has 12 reviews, none from the last 12 months; G2 and Capterra were blocked.
- Not researched: Nexum, Utila, Integral beyond its homepage, Ledger Enterprise, and Fireblocks as a full product.
