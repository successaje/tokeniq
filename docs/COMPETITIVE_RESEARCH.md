# Competitive research: executive summary

- **Research date:** 2026-10-11
- **Question:** Is there room for a treasury intelligence and operations product for crypto-native organizations that hold stablecoins in Safes, and what must it do to survive?
- **Detail:** [competitor matrix](research/competitor-matrix.md) · [market opportunities](research/market-opportunities.md) · [customer workflows](research/customer-workflows.md)
- **Product documents built on this:** [`PRODUCT_VISION.md`](PRODUCT_VISION.md) · [`PRD.md`](PRD.md)

## Bottom line

1. **The wedge is open.** No live product we found connects an obligations calendar to a reserve or runway policy, a deployable-surplus figure and an approval flow. Safe Pro sells controls. Stablerail sells payments, policies and earn, but showed no runway or reserve concept. Request Finance sells payables with yield marked "Soon". kpk sells the policy work as a service for about 0.50% of assets a year. Zyfai, Octav and Cryptio each cover one slice.
2. **Thin layers die.** Brahma (sunset 17 Apr 2026), Coinshift Business (sunset by 31 Mar 2026), Parcel, Giza's yield agents (wound down Feb–Mar 2026) and Summer.fi (shut after a $6.04M exploit in Jul 2026) all disappeared. Products that only sit between a user and Safe get absorbed or shut down. Defensibility has to come from intelligence and policy, and every product in this space should ship a documented exit.
3. **Yield is not the pitch.** Blue-chip Base USDC venues showed about 4.2–4.7% at capture, while custodial stablecoin accounts pay 3.98–5%. kpk's ENS mandate returned 2.62% net against a 2.80% benchmark. The value is knowing what is owed and what is safe; yield is a possible result.
4. **Size by exit liquidity, not by rate.** The four largest Morpho V2 vaults had only 8–11% of assets instantly withdrawable, rewards made up 57–61% of net yield on two of them, and venue warnings fire late. A treasury tool must show what can come out, how fast, and watch leading indicators.
5. **Late 2026 is a buying moment.** Safe Pro standard pricing started on 6 Oct 2026, spending limits moved to its €669/month Business plan, and free Workspaces must be claimed by 5 Dec 2026. Safe-based teams that lost Brahma and Coinshift are re-evaluating tools.

## Key findings

**Where competitors sit.** Signing and custody tools (Safe, Den, Zodiac) secure the transaction but do not know what the organization owes. Finance-operations tools (Request, Bitwave, Ramp) handle payables with per-payable approvals branching on amount or tag, and are moving toward custodial or partner-held USD accounts. Accounting tools (Cryptio, Bitwave, TRES, now part of Fireblocks) are read-side and moving upmarket. Managed services (kpk, TokenLogic, Avantgarde) apply a policy by hand. Agentic yield (Zyfai, Giza, Aera) automates allocation without obligations, and Zyfai lets its registry of allowed contracts grow without the user re-signing. Full grid: [competitor matrix](research/competitor-matrix.md).

**What organizations do today.** ENS writes a 3-year stablecoin runway floor and per-protocol caps into its investment policy; Lido keeps at least 2 months of runway in non-yield stablecoins and caps yield-bearing assets at 15%; Aave runs a finance committee, capped allowances and monthly funding posts. Signers are the bottleneck (Aave cited coverage across time zones; Arbitrum wound down a slow 9-of-12 multisig), and signing under attack has failed (Bybit, Feb 2025; Drift, Apr 2026). Safe notifies by browser push only. Details: [customer workflows](research/customer-workflows.md). Why products in this category fail: [market opportunities §3](research/market-opportunities.md#3-what-kills-products-in-this-category).

## What this means for TokenIQ

*These are recommendations, not findings.*

- **Lead with the reserve.** "What is owed, what is protected, what is free" is the product. TokenIQ's engine already computes the requirement as the strictest of a floor, runway months × burn, and obligations in the horizon plus a buffer, and caps the surplus by a maximum-deployed share.
- **Stay on the customer's Safe and use existing enforcement.** Compile policy into Zodiac Roles and a minimal guard later; never take custody. Any widening of scope needs a human decision.
- **Make signing safer, not just faster.** Decoded calls, simulation and the full `safeTxHash` for device checks, plus nudges to signers tied to obligation due dates.
- **Build liquidity-first venue intelligence.** Withdrawable-now figures, organic yield separated from incentives, and leading indicators such as pending curator changes inside their timelock.
- **Publish a documented exit.** Show customers how to leave without TokenIQ.
- **Price flat per organization.** Below a 50 bps manager and near Safe Business is the range to test, never as a fee on yield. This is a hypothesis.

Ranked opportunities and counter-evidence: [market opportunities §5–6](research/market-opportunities.md#5-opportunities-ranked).

## Method

- Four research agents and the research lead worked on 2026-10-11, one area each (Safe ecosystem; yield venues and curators; DAO workflows and failures; finance operations and accounting; agentic and fintech products). Each wrote notes with a source URL on nearly every claim.
- Public pages fetched directly; public APIs queried (DefiLlama, Morpho GraphQL, Discourse forums); open-source front-end code read on GitHub (Aave, Morpho).
- Two pages fetched for this summary on 2026-10-11: onchainden.com and aera.finance.
- Design references (Stripe, Linear, Mercury and others) come from [`research/design-benchmarks.md`](research/design-benchmarks.md).

## Limits

- **The search budget ran out.** The shared web-search budget (200 calls) was exhausted partway through. Later evidence came from direct fetches. Some facts rest on search-result snippets only, and the notes mark them.
- **No logged-in apps were inspected,** except Stablerail's public demo tour, which uses mocked data. Capability cells describe what companies say, not what was observed working.
- **Some sites blocked access:** Request Finance's main site and help centre (Cloudflare), Capterra, G2, DefiLlama's HTML pages, several news sites.
- **Complaint mining was thin.** No first-hand Reddit or X threads; Request's Trustpilot page has 12 reviews and none from the last year.
- **No customer interviews.** Every job-to-be-done is inferred from public governance posts and vendor documentation.
- **Not researched:** Nexum; regulation and licensing in any jurisdiction; tax.

## Figures not treated as settled

Sources disagree on these, so the documents give both values or omit them: Drift's loss ($285M per TRM Labs, $295M per DefiLlama); KelpDAO rsETH (about $290M or $292M); Steakhouse AUM ($1.5B to $4.23B by page and definition); kpk assets ("$8B+ deployed", likely cumulative, vs more than $300M AUM); Safe Business gas sponsorship (conflicting figures); Safe's scale ($35.25B in its Q1 2026 report vs "$60B+" on its site); and a Base vault allow-list exploit on 4 Oct 2026 (single source).

## Sources and notes

The working notes behind these documents are not published. They were written during research on 2026-10-11 and contain long excerpts from third-party pages. Every claim above carries its own source link, with an access date where a page was fetched directly, so each one can be checked without the notes. Five clusters were researched:

| Cluster | Covers |
|---|---|
| Safe and operations | Safe, Safe Pro pricing, Zodiac, Brahma, Coinshift, Multis, Den, Parcel |
| Yield venues | Morpho, Steakhouse, Aave, Fluid, Summer.fi, DeFi Saver; incident lessons |
| DAO workflows | Treasury policies (ENS, Lido, Aave, Arbitrum, Gitcoin), approval patterns, failures |
| Finance operations | Request Finance, Octav, Cryptio, Bitwave, TRES, kpk, payroll tools, Enzyme |
| Agentic yield and fintech | Zyfai, agentic yield, Stablerail, Ramp, Coinbase Business, Squads Altitude (TVL figures from the DefiLlama API) |

TokenIQ has no customers, no partnerships and no independent audit. Its contract and backend reviews are internal self-reviews. Nothing in these documents should be read as saying otherwise.
