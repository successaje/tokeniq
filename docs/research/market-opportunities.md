# Market opportunities

- **As of:** 2026-10-11.
- **Evidence:** the research notes and [`competitor-matrix.md`](competitor-matrix.md). Every dated fact has a source link. Facts that rest on a search snippet or a single source are labelled.
- **Analysis** is labelled *Analysis* or *Opinion*. It is the research team's judgement, not a finding.

## 1. The unclaimed wedge

**No live product we found connects an organization's obligations to a reserve policy, a deployable-surplus figure and an approval flow on the organization's own Safe.** Each piece exists somewhere, sold separately:

| Slice of the job | Who sells it today | In what form |
|---|---|---|
| Obligations and payables | Request Finance, Bitwave, Ramp, Squads Altitude; Den for batch payments | Software |
| Runway and reserve policy | kpk (as a service, about 50 bps a year on ENS); DAO policy documents such as the ENS and Lido rules | Consulting or governance documents |
| Deployable surplus ("what is safe to put to work, given what we owe") | Nobody observed | — |
| Yield venues | Safe Earn, Stablerail, Zyfai, Gauntlet Aera, Coinbase Business, Ramp, Squads Altitude | Software or managed vaults |
| On-chain limits | Zodiac Roles, Safe spending limits, Den | Infrastructure |
| Approvals | Request Finance, Stablerail, Safe, Den, Ramp | Software |
| Signing safety | Safe Shield, Stablerail | Software |

Evidence that organizations need the connected version and currently do it by hand:

- **ENS** keeps at least 3 years of operating spend in stablecoins (about $49.34M) plus a separate 6-month USDC buffer in its timelock, which kpk tops up every quarter without a vote ([ENS 2026 IPS](https://discuss.ens.domains/t/6-46-social-2026-endowment-investment-policy-update/22106)).
- **Lido** set a floor of at least 2 months of projected runway in non-yield stablecoins and capped yield-bearing instruments at 15% of the treasury, checked quarterly ([TMC-6](https://research.lido.fi/t/tmc-6-convert-dao-treasury-stablecoins-into-susds-and-update-config-on-easy-track-and-aragon-finance-accordingly/10868); parameters come from a reply in the thread).
- **Aave DAO** runs this as people and posts: a service provider (TokenLogic), a Finance Committee, swap-steward allowances and monthly funding updates ([funding update](https://governance.aave.com/t/direct-to-aip-august-september-2026-funding-update/25597)).
- **Arbitrum's** payroll multisig was funded in ARB. After ARB fell, it held about $52K against $81.3K of commitments ([wind-down](https://forum.arbitrum.foundation/t/wind-down-the-mss-transfer-payment-responsibilities-to-the-arbitrum-foundation/29279)). Separately, about $150K of surplus USDC had built up across program wallets before being swept back ([ATMC](https://forum.arbitrum.foundation/t/transfer-6-000-eth-and-idle-stablecoins-from-the-treasury-to-the-treasury-management-portfolio/30691)).
- **GSR** (7 Aug 2026) found more than 70% of DAO treasury assets in the DAO's own token and recommended 12–24 months of runway in stablecoins ([Crypto Briefing](https://cryptobriefing.com/daos-native-token-treasury-concentration-risk/)).

*Analysis.* The connected chain is what an IPS describes and what a finance committee executes. Turning it into software is the wedge. The pieces around it (venues, custody, accounting, signing) already exist, and TokenIQ should integrate with them rather than rebuild them.

## 2. Why now

| Date | Event | Why it matters | Source |
|---|---|---|---|
| 21 Feb 2025 | Bybit lost about $1.4–1.5B after malicious code in the Safe web app targeted its 3-of-6 signers | Signers now expect decoded calldata, hash checks on the device, and simulation | [BleepingComputer](https://www.bleepingcomputer.com/news/security/lazarus-hacked-bybit-via-a-breached-safe-wallet-developer-machine/), [Cyfrin](https://www.cyfrin.io/blog/safe-wallet-hack-bybit-exploit) |
| 4–7 Nov 2025 | Stream Finance disclosed a $93M loss; about $285M of linked exposure. Losses split by curator: some curators had none | Curator choice and collateral look-through decide outcomes | [Forklog](https://forklog.com/en/news/collateral-damage-from-stream-finance-hack-estimated-at-285-million), [Protos](https://protos.com/stream-finance-meltdown-winners-and-losers-in-defi-risk-curator-reckoning/) |
| 24 Nov 2025 | GnosisDAO voted to end kpk's treasury mandate | DAOs are re-examining managed-treasury services | [The Crypto Times](https://www.cryptotimes.io/2025/11/25/gnosis-to-fire-treasury-management-partner-kpk-with-community-vote/) |
| 7 Jan 2026 | Fireblocks bought TRES Finance for $130M | Crypto accounting is consolidating into institutional stacks | [Fortune](https://fortune.com/2026/01/07/fireblocks-tres-finance-acquisition-130-million) |
| 26 Feb 2026 | Giza announced the wind-down of its ARMA and Pulse yield agents (third-party report) | Agentic yield products are fragile | [review](https://ownyourmind.ai/projects/giza/) |
| 12 Mar 2026 | Cryptio raised a $45M Series B | The accounting layer is moving upmarket | [CoinDesk](https://www.coindesk.com/business/2026/03/12/crypto-accounting-firm-cryptio-raises-usd45-million-in-series-b-funding-round) |
| 22 Mar 2026 | Resolv USR: a compromised key minted about 80M unbacked USR; about $25M extracted; Fluid absorbed bad debt | Stablecoin issuer and oracle design are treasury risks | [The Block](https://www.theblock.co/post/394582), [Halborn](https://www.halborn.com/blog/post/explained-the-resolv-hack-march-2026) |
| By 31 Mar 2026 | Coinshift Business sunset | Safe-based treasury users need a new home | [beta.coinshift.xyz](https://beta.coinshift.xyz) |
| 1 Apr 2026 | Drift: signers were socially engineered into pre-signing transactions, followed by a zero-timelock migration. Loss figures differ ($285M per TRM, $295M per DefiLlama) | Timelocks and verified signing matter | [TRM Labs](https://trmlabs.com/resources/blog/north-korean-hackers-attack-drift-protocol-in-285-million-heist) |
| 14 Apr 2026 | Squads launched Altitude Earn (tokenized treasuries "up to 5.00%") | Fintech-style stablecoin accounts now pay yield | [Squads](https://squads.xyz/blog/compound-your-capital-with-altitude-earn) |
| 17 Apr 2026 | Brahma products sunset | More orphaned Safe-based users | [docs.brahma.fi](https://docs.brahma.fi) |
| 18 Apr 2026 | KelpDAO rsETH exploit through a 1-of-1 LayerZero verifier setup; Aave froze rsETH markets. Size reported as about $290M or $292M depending on source | Bridge and restaking dependencies reach blue-chip venues | [CoinDesk](https://www.coindesk.com/tech/2026/04/20/kelp-dao-claims-layerzero-s-default-settings-are-what-actually-caused-the-usd290-million-disaster), [Aave report](https://governance.aave.com/t/rseth-incident-report-april-20-2026/24580) |
| 9 Jun 2026 | Safe introduced Workspace for treasury teams | Safe is moving into treasury operations itself | [Safe blog](https://safe.global/blog/introducing-workspace-the-onchain-operating-environment-for-treasury-teams) |
| 5–6 Jul 2026 | Lazy Summer lost $6.04M through stale marks left over from Stream; Summer.fi shut down | Contagion can surface 8 months later; thin layers die | [CoinGabbar](https://www.coingabbar.com/en/crypto-currency-news/summer-fi-shutdown-6-04m-lazy-summer-vault-exploit), [summer.fi](https://summer.fi) |
| 17 Sep 2026 | Request Finance suspended its card programme because its provider is winding down | Provider risk is real for finance apps | [Request help](https://intercom.help/request-faq/en/articles/16118140-important-update-about-cards) |
| 6 Oct 2026 | Safe Pro standard pricing began; spending limits and proposers moved to the Business plan (€669/mo and up) | A visible price anchor and a buying moment for Safe-based teams | [Safe](https://safe.global/blog/safe-pro-early-partner-program), [help](https://help.safe.global/articles/9640607537-spending-limits-and-the-proposer-role) |
| 5 Dec 2026 | Deadline to claim free Safe Workspaces created before 6 Oct | Teams will re-evaluate their tooling before this date | [Safe help](https://help.safe.global/articles/7110904247-claim-your-free-period-workspaces-created-before-6-october) |

Market backdrop: total DeFi TVL went from $155.3B (1 Oct 2025) to $68.2B (1 Jul 2026) and back to $92.5B (11 Oct 2026), per the DefiLlama API (lead notes). One more incident, a Base vault allow-list exploit on 4 Oct 2026, rests on a single source ([CryptoTicker](https://cryptoticker.io/en/base-vault-whitelist-multisig-hack-october-2026)) and is not relied on here.

*Analysis.* Three things line up in late 2026: Safe-based teams lost two treasury layers and face a new Safe subscription; a year of curator and stablecoin incidents has made "how much can we get out, and how fast" the real question; and fintech accounts have set a 4–5% baseline that DeFi yield must beat after risk.

## 3. What kills products in this category

| Product | What it did | What happened | Source |
|---|---|---|---|
| Utopia Labs | DAO payroll and payments ($23M Series A) | Product shut on 6 Nov 2023 | [Blockchain.News](https://blockchain.news/news/yield-protocol-and-utopia-labs-announce-wind-down) |
| Multis | Crypto business accounts | Acquired by Safe in Apr 2024; multis.com returned 404 on 2026-10-11 | Safe-cluster notes (acquisition source URL not captured) |
| Parcel | DAO payments | Site static with a 2024 copyright; app domains do not resolve (checked 2026-10-11) | Safe-cluster notes |
| Coinshift Business | Safe treasury management, payouts, cash-flow tracking | Sunset by 31 Mar 2026 | [banner](https://beta.coinshift.xyz) |
| Brahma | Safe Sub-Accounts with guards and policies | Sunset 17 Apr 2026; recovery tool provided | [docs](https://docs.brahma.fi) |
| Giza ARMA / Pulse | Autonomous yield agents | Wind-down Feb–Mar 2026; TVL from a $45.6M peak to about zero | [review](https://ownyourmind.ai/projects/giza/), DefiLlama via lead notes |
| Summer.fi / Lazy Summer | Automated yield vaults | $6.04M exploit, then shut down | [CoinGabbar](https://www.coingabbar.com/en/crypto-currency-news/summer-fi-shutdown-6-04m-lazy-summer-vault-exploit) |
| Request Finance (cards), Entendre | Web3 finance tools | Request pivoted to SMB stablecoin accounts and suspended cards; Entendre pivoted to AI agents for finance operations | [Request](https://www.requestfinance.com/), [Entendre](https://entendre.ai/) |

*Analysis: the patterns.*

1. **Thin layers over Safe get absorbed or shut down.** Brahma, Coinshift, Multis and Parcel all sat between the user and Safe, and Safe now sells Workspace, policies and Earn itself. A product that only adds a nicer interface over Safe has no moat.
2. **Agent-run yield has stayed small.** DefiLlama's "AI Agents" category was led by MorpheusAI ($20.1M) and Zyfai ($10.5M) at capture; DWF Ventures estimated about $39M in agent-managed positions in April 2026 ([Yahoo Finance](https://finance.yahoo.com/markets/crypto/articles/ai-agents-already-run-fifth-144838777.html)).
3. **Risk is inherited.** Lazy Summer's loss came from marks left over from an incident eight months earlier.
4. **Providers fail.** Request's card suspension shows what happens when a partner winds down.
5. **The web3-only market pulls companies away.** Request and Entendre both broadened beyond crypto-native buyers.

What this implies for TokenIQ (*opinion*): defensibility has to come from the intelligence and policy layer, not from custody or a front end. The product should hold no assets, use Safe and Zodiac rather than replace them, and ship a documented exit so that a customer loses nothing if TokenIQ disappears.

## 4. Pricing anchors

| Offering | Price | Unit | Source |
|---|---|---|---|
| Safe Starter | €189/mo | Plan (2 Safes) | [Safe pricing](https://safe.global/pricing) |
| Safe Business (policies, proposers) | €669 / €999 / €1,669 per month | Plan | [plans](https://help.safe.global/articles/1569083243-plans-at-a-glance) |
| Safe Earn | 10% of rewards | Yield | [Safe help](https://help.safe.global/en/articles/322149-defi-lending-in-safe-wallet) |
| Zodiac | Free / $250 Starter / Enterprise | Plan (period not captured) | [Zodiac](https://www.zodiac.eco/pricing) |
| Request Finance | Free / $50 / $300 / $600 per month / custom | Plan; approvals and Xero/QBO start at $300 | [Request](https://www.requestfinance.com/pricing) |
| Octav | $149 or $499 per year | Per address | [Octav](https://octav.fi/) |
| Across DAO on Octav | $1,440/yr | 4 wallets plus monthly reports | [Across forum](https://forum.across.to/t/octav-onboarding-to-track-across-dao-treasury/1958) |
| Stablerail | $213 / $850 / $2,550 per month, plus 10% of yield | Plan | [Stablerail](https://stablerail.com) |
| Zyfai | 10% of earnings | Performance fee | [Zyfai](https://docs.zyf.ai/docs/product/other/fees.md) |
| kpk on ENS | About 0.50% a year | Assets under management | [ENS review](https://discuss.ens.domains/t/kpk-h1-2026-review-for-the-ens-endowment/22358) |
| Arbitrum TMC managers | karpatkey 0.5%; Avantgarde 0.5% + 10% performance; Gauntlet free | Assets | [Arbitrum](https://forum.arbitrum.foundation/t/tmc-proposed-allocations-v2-stablecoin-strategy/28786) |
| TokenLogic for Aave | $2M allowance + $2.5M GHO stream + 5,000 AAVE over 12 months | Mandate | [Aave forum](https://governance.aave.com/t/arfc-tokenlogic-phase-ii-extension/24846) |
| Rise | $49/mo | Per contractor | [Rise](https://www.riseworks.io/pricing) |
| YieldSeeker Pro | $29/mo | Per user | [YieldSeeker](https://www.yieldseeker.xyz) |
| Cryptio, Bitwave | By quote | — | [Cryptio](https://cryptio.co/pricing), [Bitwave](https://www.bitwave.io/pricing) |
| **TokenIQ** | Free during early access; no pricing set; no fee on funds or yield | — | `apps/web/src/app/(marketing)/pricing/page.tsx` |

*Analysis.* Software for this buyer clusters at €189–€1,669 a month (Safe) and $300–$850 a month (Request, Stablerail). Services charge in basis points, which costs $50K a year per $10M at 50 bps. A flat price per organization, set below a 50 bps manager and near Safe Business, is the obvious range to test. A fee on yield would put TokenIQ's incentive on deploying more, which conflicts with a reserve-first product. This is an untested hypothesis, not a pricing decision.

## 5. Opportunities, ranked

Ranking (*opinion*): strength of evidence for the pain × how unclaimed the slot is × fit with a non-custodial, Safe-first product, discounted by build cost and risk.

| Rank | Opportunity | Evidence | TokenIQ today |
|---|---|---|---|
| 1 | **Obligations-aware reserve and deployable surplus on the customer's Safe** | No product observed computes it; ENS, Lido and Aave do it in policy documents and posts (§1) | Built: obligations, strictest-rule reserve, surplus capped by a maximum-deployed share |
| 2 | **Liquidity-first venue sizing and leading risk indicators** | Large Morpho V2 vaults showed 8–11% instant liquidity; built-in warnings fire late; Stream losses split by curator; Lazy Summer stale marks ([Morpho warnings](https://docs.morpho.org/interface/warnings/), [Protos](https://protos.com/stream-finance-meltdown-winners-and-losers-in-defi-risk-curator-reckoning/)) | Partial: position capped at 5% of venue liquidity by default; low-liquidity and venue-warning alerts; rewards flagged. Leading indicators (pending curator changes, timelocks, oracle type, collateral look-through) not built |
| 3 | **From approval to signature to execution, with signing safety and nudges** | Aave cited limited signer coverage across time zones ([ARFC](https://governance.aave.com/t/arfc-update-signers-and-safe-configuration/22442)); Arbitrum wound down its 9-of-12 payments multisig as too slow ([forum](https://forum.arbitrum.foundation/t/wind-down-the-mss-transfer-payment-responsibilities-to-the-arbitrum-foundation/29279)); Safe notifies by browser push only; Bybit and Drift | Partial: tiers, roles, owner signatures in-app, simulation, receipt tracking. Proposal notifications are in-app only; no email or chat nudges to signers |
| 4 | **Board- and community-grade reporting with an exportable audit trail** | Safe's activity log is not exportable; DAOs publish monthly or quarterly; Across pays $1,440/yr for reports | Partial: printable snapshot and six CSV exports; no scheduled or shareable reports |
| 5 | **Compile the treasury policy into on-chain limits (Zodiac Roles, a guard)** | kpk charges about 50 bps for IPS plus Roles setup; ENS needs an executable proposal for each permission change | Not built. `TreasuryReserveGuard` exists, has had an internal review only, and is not deployed |
| 6 | **Pay obligations from the Safe** | ENS made 10+ recurring payments a month, chasing signers each time ([vendor case study](https://paragraph.com/@loopcrypto/loop-saves-ens-dao-5-hours-per-month-with-payment-scheduling)); Pokt ran payments from spreadsheets ([forum](https://forum.pokt.network/t/dao-finance-operations-update/4729)) | Partial: the API supports payment proposals bound to the obligation's payee, network and asset; the web app has no entry point yet |
| 7 | **Accounting connectors** | Close is still CSV-driven (vendor-adjacent blog); accounting vendors are consolidating | Not built; CSV only |

Deliberately not pursued (*opinion*):

- **Custodial accounts and fiat rails.** Ramp, Coinbase, Request (via Bridge) and Squads own this, and it needs licensing and partners.
- **Autonomous agents moving funds.** The graveyard and Zyfai's growing-registry model are the warning. Automation, if ever, stays bounded on-chain and off by default.
- **TokenIQ-run vaults or pooled funds.** That would recreate the custody risk the rebuild removed.
- **Bridging and cross-chain routing.** Out of scope for 2.0 (see [`legacy-audit.md`](legacy-audit.md)).

## 6. Risks and counter-evidence

1. **The DeFi yield premium is thin.** Blue-chip Base USDC venues showed 4.15–4.71% at capture ([risk.zyf.ai](https://risk.zyf.ai/)). Ramp's promotional rate was 3.98%, Coinbase Business about 4.1%, Squads "up to 5.00%" on tokenized treasuries, and Mercury's treasury "up to 4.00%" net of fees as of 2 Oct 2026 (per [`design-benchmarks.md`](design-benchmarks.md) §3.3). kpk's ENS mandate returned 2.62% net against a 2.80% benchmark, and an Arbitrum delegate questioned whether a 3.21% mandate was worth it ([Arbitrum forum](https://forum.arbitrum.foundation/t/kpk-treasury-management-updates/30667)). Steakhouse High Yield USDC netted 3.10% after a 25% performance fee. *Implication:* yield cannot be the pitch. The value has to be knowing what is owed and what is safe, with yield as an optional result.
2. **The category graveyard (§3).** Most predecessors shut down or pivoted. TokenIQ could be next if it is only a layer over Safe.
3. **Custodial alternatives are easier to buy.** Self-serve onboarding, fiat rails, cards and ERP sync come bundled. Teams that do not need multisig may prefer them.
4. **Safe could build this.** Safe owns distribution, launched Workspace and policies in 2026, and reports more than $10M of annualized revenue ([forum](https://forum.safefoundation.org/t/2025-reflections-and-2026-outlook/6861)).
5. **Stablerail is close.** It already combines payments, policies, signing checks, an AI copilot and earn. Adding a runway figure would narrow TokenIQ's lead.
6. **The stablecoin pool may be small.** More than 70% of DAO treasury assets sit in the DAO's own token (GSR), and many large DAOs outsource treasury work to managers who bring their own tools (kpk, TokenLogic, Avantgarde).
7. **No demand evidence of our own.** TokenIQ has no customers and has run no interviews. Complaint mining was thin. Willingness to pay is untested.
8. **Trust.** TokenIQ has no independent audit and no track record, in a market that has just seen Bybit, Drift and several curator failures.
9. **Data dependencies.** The Morpho API has no SLA ([docs](https://docs.morpho.org/tools/offchain/api/get-started/)); a dishonest RPC could misreport balances ([`TESTING.md`](../TESTING.md)).
10. **The venue landscape is shifting.** Morpho's interface is V2-first and curators are moving vaults to V2 ([forum](https://forum.morpho.org/t/steakhouse-vault-v2-simplification/2235)). TokenIQ lists only V1 vaults because V2 withdrawable liquidity cannot be read through ERC-4626 views. The listing may need V2 support sooner than planned.
11. **Regulation was not researched.** Nothing here assesses whether any feature triggers licensing in any jurisdiction.

## 7. What would change this assessment

- Interviews with 10–15 Safe-based finance leads that confirm or reject the "reserve first, then surplus" job.
- Evidence that Safe or Stablerail is shipping an obligations or runway feature.
- Willingness-to-pay signals at a flat organizational price, compared with Safe Business.
- A design partner willing to run TokenIQ read-only next to an existing manager (kpk-style) for a quarter.
