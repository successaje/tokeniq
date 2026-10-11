# TokenIQ: design benchmarks research

- **Research date:** 2026-10-11
- **Prepared by:** Design Director (research pass for the TokenIQ rebuild)
- **Question:** What do the best money, data and developer products do that a treasury intelligence product for crypto-native organizations should match or beat? Which crypto patterns should we avoid?
- **Companion file:** `visual-directions.md` (three directions, scoring, recommendation, contrast tables)

---

## 1. Method

| Technique | What it produced | Tag used below |
|---|---|---|
| Fetching official pages, docs, help centers and design blogs | Stated principles, copy patterns, approval rules, disclosure wording | **[P]** primary source |
| Inspecting live pages in a Chromium browser pane at 1280×800 and 375×812, with JavaScript reading computed styles from up to 8,000 elements per page | Real typefaces, sizes, weights, tracking, `font-variant-numeric`, CSS custom properties, transition durations and easings, and the number of `prefers-reduced-motion` rules in readable stylesheets | **[L]** live inspection |
| Third-party design write-ups and "design.md" aggregators | Hex values and font names where the primary source was not readable | **[S]** secondary, lower confidence |
| Downloading font license files (google/fonts and project repos) and measuring digit widths in the browser with `tabular-nums` on and off | Confirmed OFL license and tabular-figure support for each candidate typeface | **[T]** test we ran |
| WCAG 2.x relative-luminance math (Python) | Contrast ratios for competitor and TokenIQ color pairs | **[T]** |

Each product section below separates **Evidence** (something observed, with its URL) from **Analysis** (our interpretation), then lists what TokenIQ should **take** and what it should **avoid**.

## 2. Limitations

- **No logged-in product access.** The Stripe Dashboard, Ramp, the Mercury app and the Brex app all sit behind login. We inspected their public docs, help centers, marketing product imagery and public demos instead. `demo.mercury.com` stayed on "Loading…" in our session.
- **We did not accept terms or consent banners.** Morpho's first-visit risk gate and Safe's cookie banner were left untouched, as were the wallet "Connect" flows. We read the DOM behind the Morpho modal. Safe{Wallet} screens past the welcome loader were not reachable without a wallet.
- **The web-search budget ran out partway through.** Later evidence comes from direct fetches and live inspection. Some help-center articles (Mercury) returned 403, so the search-result summaries of them are labelled as such.
- **Wise's design system site (wise.design) renders client-side,** so its foundations pages could not be extracted. Wise evidence comes from the live site, the pricing page and press coverage of the rebrand.
- **Computed-style sampling has limits.** It sees CSS transitions, not JavaScript or WebGL animation. A count of `prefers-reduced-motion` rules can read low when stylesheets are cross-origin (CSSOM access is blocked), so a count of 0 means "none detected", not "none exist".
- **Marketing pages are not product UI.** We use them for narrative, hero and trust patterns. Product patterns come from docs, design-system sites, help centers and public app surfaces (Uniswap Explore, the Morpho vault table, the Safe welcome screen).
- **Some figures will change.** Live counters, yields and customer numbers are dated 2026-10-11.

---

## 3. Per-product evidence and analysis

### 3.1 Stripe: marketing site, Dashboard and Stripe Apps patterns, public design writing

**Evidence**

- [L] https://stripe.com (1280×800):
  - Typography: every element uses `sohne-var` with the OpenType `ss01` stylistic set. The H1 is weight 300 with tracking of −0.01em.
  - Hero composition: a two-tone headline (a dark sentence, then a muted continuation in `#64748D`, which measures 4.75:1 on white), left-aligned copy, gradient "wave" art on the right, and a customer logo bar directly underneath.
  - Live ticker: above the H1 sits a pill reading "Global GDP running on Stripe: 1.73056514%", the only element on the page that uses tabular figures.
  - Buttons have a 4px radius.
  - Motion: about 460 elements transition at `0.3s cubic-bezier(0.25, 1, 0.5, 1)`, an ease-out quart. Micro-interactions run at 0.12–0.15s.
- [P] https://stripe.com (fetched):
  - Stats shown as large callouts: "135+" currencies, "$1.9T" in 2025 payment volume, "99.999%" historical uptime.
  - Sections are segmented by audience (Enterprises, Startups, Platforms).
  - The footer has many columns and carries a banking-partner disclaimer.
- [P] https://stripe.com/blog/accessible-color-systems:
  - Stripe built its palette in CIELAB.
  - The rule: "Any two colors are guaranteed to have sufficient contrast for small text if they are at least five levels apart, and at least four levels apart for icons and large text."
- [P] https://docs.stripe.com/stripe-apps/style. The spacing scale is 2, 4, 8, 16, 24, 32 and 48 px. Fonts and layout come only from tokens: no arbitrary font faces, and layout is built from x, y and z stacks.
- [P] https://docs.stripe.com/stripe-apps/patterns/empty-state:
  - The title states what is missing and ends with a period ("No successful payments.").
  - The description stays under 14 words.
  - The action wording matches the title ("No customers yet" pairs with "Add customer").
  - A filtered-empty state is different from a first-use empty state: never show "create first item" when filters hide existing data.
  - Render order: loading, then error, then empty, then content.
- [P] https://docs.stripe.com/stripe-apps/patterns/loading:
  - Delay spinners by 200–300ms for most fetches, 0ms for known-slow operations and 100ms for view transitions.
  - Size the loader to the scope that is loading (large, medium or small).
  - Never wrap the tab bar in a loading state.
  - Buttons use a `pending` prop to prevent double submission.
- [P] https://docs.stripe.com/stripe-apps/patterns/chart-layout:
  - "Pair charts with headline metrics: Show the current value above the chart."
  - Fixed chart heights: 180px for an overview chart, 320px for a featured chart.
  - No more than three charts per row; charts become hard to read below about 200px wide.
  - Loading, error, empty and populated states all use the same height.
  - The chart type follows the user's question: line for "is this going up?", bar for "how much is each?", meter for "what's the breakdown?", sparkline for a quick trend.
- [P] https://docs.stripe.com/stripe-apps/patterns/communicating-state:
  - Toasts are temporary, fewer than four words and at most 30 characters.
  - Banners persist, have a title and body, and require an action to dismiss.
- [S] https://fontalternatives.com/inspiration/stripe-sohne/. Söhne (Klim Type Foundry) is a commercial license, and Stripe's product text sits mostly at 13–14px.

**Analysis**

- Stripe's authority comes from typographic restraint: one light-weight family, a two-tone headline that gives the claim first and the detail second, and dense but calm product imagery.
- The GDP ticker is the clever part. It shows one live, precise number in tabular figures that proves scale without a chart.
- The Apps guidelines are effectively a public, testable spec for financial dashboards. Their headline-above-chart rule, fixed chart heights and distinct empty, error and loading states map directly onto TokenIQ.
- The CIELAB "levels apart" rule shows how to make contrast predictable from token steps instead of checking pairs by trial and error.

**Take:** a two-tone hero claim; one live precise metric; the headline-value-above-chart rule; fixed-height chart containers; state order (loading, error, empty, content); empty-state copy rules; a token ladder where contrast is guaranteed by step distance.
**Avoid:** large gradient art (it is Stripe's signature, and decorative gradients drift toward "AI template"); a 300ms default for UI micro-motion, which is fine on marketing pages and slow in a working app.

---

### 3.2 Linear: website, app shell density and keyboard-first operation

**Evidence**

- [L] https://linear.app:
  - Typography: `Inter Variable` with the `cv01` and `ss03` features. The H1 is 64px at weight 510 with −0.022em tracking; the H2 is 40px at weight 510. Body text is 15/24.
  - Tokens: background `#08090a`, primary text `#f7f8f8`, tertiary text `#8a8f98` (6.13:1 on the background), `--color-accent: #7170ff`, `--color-brand-bg: #5e6ad2`.
  - Motion tokens: `--speed-quickTransition: .1s`, `--speed-regularTransition: .25s`, `--ease-out-quad: cubic-bezier(.25,.46,.45,.94)`. About 270 elements transition at 0.1s.
  - The hero is a real product UI screenshot, dark by default, that fades in on load. The UI mock uses tabular numerals.
- [P] https://linear.app/now/how-we-redesigned-the-linear-ui:
  - Linear moved from HSL to LCH so that colors with equal lightness look equally light.
  - Each theme is generated from three inputs ("base color, accent color, and contrast") instead of 98 variables, and the contrast input generates high-contrast accessibility themes automatically.
  - Inter Display is used for headings.
  - Text and neutral icons were made darker in light mode and lighter in dark mode.
- [P] https://linear.app/now/behind-the-latest-design-refresh (March 12, 2026):
  - Two principles: "Don't compete for attention you haven't earned" and "Structure should be felt not seen."
  - The sidebar was made "a few notches dimmer", there are fewer dividers and smaller icons, and the gray is warmer and less saturated.
  - Density is unchanged even though the noise is lower.
- [P] https://linear.app/docs/display-options. `Shift+V` opens display options, `Cmd/Ctrl+B` toggles list and board, and every option is also exposed in the command menu. Display properties show or hide fields without filtering anything.
- [P] https://linear.app/method/introduction. Software should be "Purpose-built" and opinionated, and the guidance is to "aim for clarity" and avoid invented terminology.
- [P] https://linear.app (fetched). Social proof: "Powers over 40,000 product teams", plus quotes from OpenAI, Ramp and Opendoor. The footer is grouped into Product, Features, Company, Resources, Connect and Legal.

**Analysis**

- Linear is the reference for "calm density": many items on screen, little chrome. The tools are hierarchy through dimming (the navigation recedes and the content leads), a single weight family with fine variable weights (510 instead of 500 or 600), and very fast feedback (100ms).
- Generating every theme from three inputs is the most scalable idea in this set. Contrast becomes a parameter rather than a separate theme.
- Keyboard-first does not mean keyboard-only. Every option lives in the command menu, and shortcuts are taught in place.

**Take:** themes generated from a few perceptual (LCH/OKLCH) inputs, including a contrast input; a dimmed navigation layer; 100ms feedback and roughly 250ms transitions; ⌘K as a superset of every menu; display-property toggles on tables; opinionated defaults.
**Avoid:** copying Linear's black-and-indigo look (it is now the default "startup app" aesthetic); faint gray-on-black for anything a finance user must read in an audit.

---

### 3.3 Mercury: banking for startups (treasury, runway and approvals)

**Evidence**

- [L] https://mercury.com:
  - Typography: custom variable fonts `arcadia` and `arcadiaDisplay`. Headlines use weight 480 (H1 about 45px); UI text uses 420.
  - Hero: a full-bleed cinematic photograph (a desk on a misty mountainside) with a centered headline, "Radically different banking".
  - CTAs: an email field, a primary pill button ("Open account", `#5266EB` with a 32px radius; white on it measures 4.71:1), and a secondary "Launch demo" link.
  - The legal line is pinned inside the hero: "Mercury is a fintech company, not an FDIC-insured bank…"
  - Motion: mostly 0.3s and 0.15s on `cubic-bezier(0,0,0.2,1)`. Four `prefers-reduced-motion` rules were detected.
- [P] https://mercury.com (fetched). Trust stats: "300K+", "1 in 3 startups", "$20B+ monthly transaction volume", "4.9 Apple App Store rating". A protection and security section explains FDIC sweep coverage of "up to $5M". Press logos appear near the end.
- [P] https://mercury.com/treasury:
  - The yield is shown as "up to 4.00%" with an explicit "as of 10/02/2026" and described as "net of fees". Tiers are listed by balance.
  - The underlying funds are named with tickers (MRGXX and MCRYX) and their holdings are described in plain words.
  - Liquidity is stated per instrument: "same-day" if initiated "by 3pm ET", or "1-2 business days" (up to 4).
  - The fee range is disclosed (0.15–0.6% annualized), as are the SIPC limits.
- [P, via search-result summaries of Mercury help-center articles that returned 403 to direct fetch]:
  - support.mercury.com/hc/en-us/articles/28768929696788 (Enabling dual admin approvals). Approval rules use amount thresholds, can name multiple approvers, can set per-user daily limits, and can require dual admin approval for sensitive actions such as permission changes.
  - support.mercury.com/hc/en-us/articles/45985054591508 (Separation of duties). Team members "can't approve payments they've created."
- [L] https://demo.mercury.com. A public, no-signup product demo exists. It did not finish loading in our session.

**Analysis**

- Mercury sells calm through art direction: photography, a soft indigo and a bespoke variable typeface. Its treasury page is the model for disclosing yield. Every rate carries a date, a fee basis, named instruments and liquidity terms.
- Its approvals are policy objects (thresholds, approvers, limits and separation of duties), not ad-hoc buttons.
- A public demo is a strong trust device for a money product, because buyers can inspect the real UI before committing.

**Take:** "as of" dates on every rate; "net of fees"; naming what the money is actually in; liquidity terms stated in time units; separation of duties as a default; a public, seeded demo workspace.
**Avoid:** mood photography as the hero (expensive, generic, and it does not demonstrate intelligence); pill-shaped CTAs on a dense product.

---

### 3.4 Ramp: spend controls, approval policies, bill pay and treasury

**Evidence**

- [L] https://ramp.com:
  - Typography: `Lausanne` (commercial) with `ss01`. The H1 is 64px at weight 400.
  - A lime CTA with near-black text and an 8px radius.
  - A live ticker pill reads "US CORPORATE PAYMENTS PROCESSED BY RAMP: 0.92…%", the same device as Stripe's GDP ticker.
  - The background is a dotted grid, and a large product-image area sits below the hero.
  - Motion: mostly 0.3s on `cubic-bezier(0.4,0,0.2,1)`. Nine reduced-motion rules were detected.
- [P] https://ramp.com (fetched):
  - Hero: "Time is money. Save both."
  - Proof: "Join 70,000 of the world's most ambitious companies" and a quantified customer result ("Notion: $1M+ saved").
  - The footer lists partner-bank disclosures, the street address and a phone number.
- [P] https://support.ramp.com/approval-matrices-setup-and-reference:
  - Each threshold means "up to this amount", and "the lowest sufficient threshold wins".
  - Sequential mode "builds an escalating chain" (for example Team Lead, then VP, then CTO) with up to 10 tiers.
  - Teams should "Always include a catch-all row" so that every request routes to someone.
- [P] https://support.ramp.com/bill-pay-approvals (via search summary). The builder layers and nests conditions (amount, entity, vendor, department, GL fields). Within a step, "Require all" demands every approver before the request moves on.
- [P] https://ramp.com/treasury:
  - "Target Balance automation – set an operating minimum and funds move back automatically."
  - Yield is shown as "up to 4.62%" with its methodology ("1-day SEC yield … as of September 3, 2026") and "net of an advisory fee of up to 0.15%".
  - Liquidity terms: "same-day" or "typically available in 2 business days".
  - Risk wording is explicit: "not FDIC insured", "may lose value".

**Analysis**

- Ramp is the reference for policy UX. Approvals are a deterministic matrix (thresholds, tiers, sequential or parallel steps, a catch-all), and the UI's job is to make the routing predictable and explainable.
- "Target balance" is almost exactly TokenIQ's "protected liquidity" concept, phrased as an operating minimum that the system defends automatically.

**Take:** policy as a readable matrix; a "why this was routed to you" explanation; a catch-all rule enforced at authoring time; an operating minimum (floor) as a first-class object; methodology footnotes for yield.
**Avoid:** lime CTA plus loud claims ("Save both"). The energy is growth-oriented and conflicts with "calm control".

---

### 3.5 Vercel and the Geist design system

**Evidence**

- [P] https://vercel.com/font and https://github.com/google/fonts/blob/main/ofl/geist/OFL.txt:
  - Geist and Geist Mono are licensed under the SIL OFL 1.1.
  - Geist has nine weights and ships as a variable font. A Geist Pixel family also exists.
  - [T] Tabular figures are confirmed for Geist: digit widths differ by 0px with `tabular-nums` and by 103.7px without it, across ten digits at 32px.
- [P] https://vercel.com/geist/colors:
  - There are 10 color scales.
  - Steps 1–3 are component backgrounds, 4–6 are borders, 7–8 are high-contrast backgrounds and 9–10 are text and icons.
  - "P3 colors are used on supported browsers and displays."
  - Gray-alpha is used only when the background should show through.
- [L] https://vercel.com:
  - Tokens are authored in OKLCH, for example `--ds-blue-700: oklch(57.61% .2321 258.23)`.
  - The H1 is GeistSans at 64px, weight 400, with tracking of −0.06em.
  - The page follows the system theme (`color-scheme: dark` was detected).
  - Motion: 0.1–0.15s on `cubic-bezier(0.4,0,0.2,1)`. Eight reduced-motion rules were detected.
- [P] https://vercel.com/geist/typography. Type tokens follow `text-heading-{72…14}`, `text-label-{20…12}` (including `-mono` variants), `text-copy-{24…13}` and `text-button-{16,14,12}`. Each token sets size, line height, tracking and weight together.
- [P] https://vercel.com/geist/materials. Radii are 6px for base and small surfaces, 12px for medium and large surfaces, menus and modals, and 16px for fullscreen views. Shadow lift increases from surface to floating layers.
- [P] https://vercel.com/design/guidelines (Web Interface Guidelines):
  - Use `font-variant-numeric: tabular-nums` for numerical comparisons.
  - Put a non-breaking space between a number and its unit.
  - "Honor `prefers-reduced-motion`" and never use `transition: all`.
  - Give loading indicators a ~150–300ms show delay and a ~300–500ms minimum visible time.
  - "Skeletons mirror final content exactly to avoid layout shift."
  - "Require confirmation or provide Undo with a safe window" for destructive actions.
  - "Persist state in the URL."
  - Hover, active and focus states have more contrast than the rest state. Use `:focus-visible`.
  - "All states designed": empty, sparse, dense and error.
  - APCA is preferred for perceptual contrast checks.

**Analysis**

- Geist is the most complete open reference for a token architecture: step-semantic scales, OKLCH/P3, type tokens that bundle size, line height, tracking and weight, and material levels.
- The guidelines read as a ready-made test plan. Many TokenIQ benchmarks below are lifted from them almost word for word because they can be verified.

**Take:** step-semantic color scales; OKLCH tokens with P3 enhancement; bundled type tokens with mono variants for labels; two or three radii; the guidelines as acceptance criteria.
**Avoid:** −0.06em display tracking on numbers (it hurts digit legibility); a black-on-black developer aesthetic for a CFO audience.

---

### 3.6 Wise: transparent fees and rates, plain-language money movement

**Evidence**

- [L] https://wise.com/us/ (desktop and 375×812):
  - Typography: the H1 is `"Wise Sans"` at weight 900, about 87px, with line-height 0.85 and uppercase. Body text is `Inter` at 18/26 with `calt`.
  - Color: the text color is `#163300` on the lime brand color (9.45:1).
  - The calculator text reads, in order:
    - "1 USD = 0.8927 EUR · Guaranteed for 37h"
    - "You send exactly"
    - "Sending over 25,000 USD or equivalent? We'll discount our fee"
    - "Recipient gets"
    - "Arrives · Today – in seconds"
    - "Total fees · Included in USD amount · 5.47 USD"
  - On mobile, the calculator sits in the first viewport, the rate chip carries a lock icon, and a rating ("4.8 ★ on Google Play 1.3M reviews") appears above the headline.
  - Motion: 26 reduced-motion rules were detected, the most of any site we inspected.
- [P] https://wise.com/us/pricing/:
  - "We only use the mid-market rate — the one you can check on Google."
  - "Always know what you're paying upfront."
  - Fee rows follow service, description, amount ("Fee varies by currency | From 0.23%").
- [P] https://www.creativereview.co.uk/wise-rebrand-ragged-edge/ and https://raggededge.com/work/wise/. The rebrand by Ragged Edge put "accessibility at the heart", deliberately left the fintech-blue convention, and created the bespoke Wise Sans typeface for global legibility.

**Analysis**

- Wise turns transparency into the interface. The fee is a line item, the rate has a guarantee window, the arrival time is stated, and the exact amounts are inputs rather than marketing.
- The calculator is both the hero and the product. This is the strongest precedent for a TokenIQ hero that is itself a working mini-model of the treasury.
- "Guaranteed for 37h" is a freshness and commitment signal that crypto UIs almost never provide.

**Take:** an interactive calculator as the hero; "You have exactly", "Protected", "Can deploy" phrasing; fees and assumptions as visible line items; validity windows on quotes; obsessive reduced-motion support.
**Avoid:** shouty uppercase black-weight headlines and lime saturation. That brand is consumer-energetic, the opposite of TokenIQ's calm.

---

### 3.7 Analytics platforms: Hex, PostHog and Datadog (data-density patterns)

**Evidence**

- [L] https://hex.tech:
  - Display type mixes a serif italic ("Make everyone") with `PP Formula SemiExtended` ("a data person").
  - Supporting copy uses `Cinetype`. Product UI imagery uses `IBM Plex Sans` and `IBM Plex Mono`.
  - The hero is a layered collage of real product surfaces (notebook, agent chat, chart) captioned with mono labels ("Agentic data notebooks", "Conversational self-serve").
  - The background is a warm off-white grain. Eight reduced-motion rules were detected.
- [P] https://posthog.com/handbook/brand/in-practice:
  - "Clarity > cleverness" in product UI.
  - "Limited palette. Don't print 8 colors when 3 work."
  - "Design should get out of the way."
  - Empty states, error messages and loading states must be clear.
  - "Lead with the specific. Don't open pages with a mission statement."
- [L] https://posthog.com. The site is a desktop-OS metaphor (windows and icons) set in `RoundHog`. Its pricing transparency appears inside the hero ("97% of users pay us $0").
- [P] https://www.datadoghq.com/blog/engineering/druids-the-design-system-that-powers-datadog/:
  - "Dependable and repeatable UX patterns are key."
  - Accessibility is a contribution requirement.
  - "The whole has to be greater than the sum of its parts." Users should "pivot seamlessly" across products.
- [S] https://www.webdesignhot.com/design.md/datadog/. Datadog uses a proprietary `NationalWeb` face with tabular figures in chart axes, buttons with 4–6px radii, and `#632ca6` as the first chart series.

**Analysis**

- Data-dense tools earn trust when their UI disappears and the numbers lead: a limited palette, one consistent pattern library, and tabular figures in axes.
- Hex shows that a single serif or extended display moment can make a data product feel editorial without hurting the product UI. Its product type stays IBM Plex.
- PostHog shows that radical honesty (about pricing, limitations and copy) is itself a brand.

**Take:** product UI as hero evidence; mono micro-labels; a limited palette (three colors or fewer per view); honest copy about limitations; consistent patterns across modules.
**Avoid:** whimsy and mascots, and OS metaphors. They are distinctive but undercut "financial confidence".

---

### 3.8 Financial-data UIs: Brex and Puzzle (with Ramp Treasury above)

**Evidence**

- [L] https://www.brex.com:
  - The H1 is `inter` at 72px, weight 500, with −0.02em tracking: "Finance built for speed and control."
  - The hero image is a corporate card plus a phone showing real product UI.
  - The CTA is orange.
  - The footer carries dense legal disclosures (the card issuer, "Brex Payments LLC, a licensed money transmitter (NMLS #2035354) and a Capital One company", and plan pricing "$0 per user… $12 per user, per month").
  - No reduced-motion rules were detected.
- [P] https://www.brex.com/journal/a-redesigned-brex-mobile-experience-for-the-everywhere-workforce:
  - The mobile app has three tabs (Wallet, Inbox, Trips) mapped to "the jobs customers need to accomplish while on the go".
  - The Inbox consolidates "alerts, tasks, and activity notifications".
  - The redesign "enhanced typography to increase contrast and readability".
- [P] https://fred.puzzle.io/blog/introducing-the-new-puzzle-dashboard:
  - Four metric cards lead the dashboard (Cash, Net Burn, Runway, Revenue), each with a trend chart.
  - Data refreshes daily.
  - Salaries are separated out because they are "55 to 75% of total monthly spend".
  - The design is a "minimalist design that simplifies" while balancing density against overload.

**Analysis**

- The finance-operations canon is to show the four or five numbers that answer "are we OK?", each with a trend, and to put everything actionable (approvals, tasks) in one inbox, especially on mobile.
- Brex's mobile information architecture (three job-based tabs, with the Inbox as the approval surface) suits TokenIQ's signers, who will often approve from a phone.

**Take:** a small "are we OK?" KPI set with trends; a single Inbox for approvals and alerts; mobile tabs organized by jobs rather than by product modules.
**Avoid:** card imagery as the hero (TokenIQ has no card), and a single bright brand orange for CTAs.

---

### 3.9 Crypto products for contrast: Safe{Wallet}, Morpho, Uniswap and Rainbow

**Evidence**

- **Safe**
  - [P] https://safe.global. Headline: "The standard for moving value onchain". Stats: "$1T+" volume, "$60B+" assets, "60M+" accounts, "18+ Independent smart account audits", "9+ Years in production".
  - [L] https://app.safe.global/welcome:
    - Body font is `DM Sans`. `--color-primary-main: #12FF80` is a neon green on `#121312`.
    - `--color-text-secondary: #636669` on `#121312` measures **3.22:1, which fails AA for body text** [T].
    - The loading screen shows a glowing green logo with a progress bar ("Almost there…").
    - The footer shows the app version ("v1.102.0"). The cookie banner offers granular categories (Necessary, Beamer, Analytics).
  - [P] https://safefoundation.org/blog/safe-research-the-future-of-self-custody-wallets. Before signing, raw transaction data "needs to be carefully examined". Security alerts check "transaction data before signing". Co-signers detect "mistakes before they reach the chain". m-of-n thresholds distribute authority.
  - [P] Safe help, via search summary. Queued transactions show a confirmation count ("1 of 2"). Execution happens only from the top of the queue, in nonce order.
- **Morpho**
  - [P] https://morpho.org. "$16B+ in deposits" and "30+ audits to date". The page is organized by segment (Institutions, Fintechs, Users).
  - [L] https://app.morpho.org/vaults:
    - Fonts are `Inter Variable` and `FK Grotesk`, and the table numbers use `font-variant-numeric: tabular-nums`.
    - Columns: Network, Vault, Deposits, Liquidity, Exposure, Curator, APY.
    - Every amount has **dual units**, for example "551.67M USDG" over "$551.58M". The USD line honestly shows the gap from the token amount.
    - A first-visit gate states the risks: users "may lose all the assets you supply or deposit", and "onchain transactions are irreversible". It requires a checkbox. We did not accept it.
  - [P] https://docs.morpho.org/get-started/resources/interface-listing-policy. The interface shows "severity-graded warnings". Warnings are "best-effort signals, not risk assessments", and the absence of a warning does not mean safety. Listing is "not an endorsement".
- **Uniswap**
  - [L] https://app.uniswap.org/explore (1280×800):
    - `Basel` at weights 485 and 535 on a dark `#131313` background, with a pink "Get started" CTA.
    - A KPI strip with abbreviated values ("1D volume $1.44B", "Total Uniswap TVL $2.79B").
    - The token table has Price, 1H, 1D, FDV, Volume and a 1D sparkline. Deltas show ▲ or ▼ glyphs plus color.
    - Loading uses skeleton rows that match the table's columns.
    - APY in pink in an "Earn" strip ("4.50% APY").
    - Motion runs at 0.1–0.25s with `ease`.
  - [L] Mobile web at 375×812: a hamburger menu and an app-install banner.
  - [S] https://www.webdesignhot.com/design.md/uniswap/. The brand pink is `#FF007A`. Our calculation gives 3.80:1 on white, below 4.5:1 for body text.
- **Rainbow**
  - [P] https://rainbow.me. Copy: "The easiest way to trade any market from your phone", "Crypto, minus the hard stuff". The tone is consumer and playful, with a rainbow-gradient identity.

**Analysis: what works**

- Safe's m-of-n queue with "x of n" progress, strict ordering and a stress on human-readable intent before signing are the right primitives for TokenIQ approvals.
- Morpho's dual-unit amounts, tabular figures, explicit curator, exposure and liquidity columns, and its honest "warnings are not risk assessments" stance are exactly the transparency TokenIQ needs.
- Uniswap's delta glyphs and table-shaped skeletons are good details.

**Analysis: what feels "crypto-generic"**

- Neon accents on near-black (Safe `#12FF80`) and glowing logo loaders.
- Low-contrast secondary text.
- Hot pink or rainbow brand gradients.
- APY highlighted in the brand accent as a lure.
- Abbreviated values everywhere with no exact figure available.
- "Connect wallet" as the universal primary CTA.
- Token-logo confetti used as decoration.
- Legal and risk content delivered as a blocking modal rather than woven into the UI.

**Take:** Safe's queue semantics and "verify what is signed"; Morpho's dual units, curator, exposure and liquidity columns and its severity-graded warnings; Uniswap's ▲▼ deltas and table-shaped skeletons.
**Avoid:** neon, glow, gradients and pink; APY as the hero; abbreviated-only amounts; risk disclosure only behind a modal.

---

## 4. Cross-cutting synthesis

### Typography

| | Evidence | Analysis |
|---|---|---|
| Families | Every leader runs one sans family across the product, plus at most one mono: Stripe Söhne, Linear Inter, Mercury Arcadia, Ramp Lausanne, Vercel Geist, Brex Inter, Morpho Inter, Uniswap Basel. Hex is the exception, with an editorial display face over Plex. | A single sans plus a mono is the norm for credibility. |
| Display tracking | Stripe −0.01em, Brex −0.02em, Linear −0.022em, Vercel −0.06em. | Tight tracking reads as precision. |
| Fine weights | Linear 510, Mercury 480, Vercel 450. | Fine-grained variable weights read as craft. |
| Tabular figures | Applied selectively: Stripe's ticker, Linear's UI, Morpho's tables. | TokenIQ must make tabular figures universal for numbers and verify the font actually supports them. Instrument Serif and Fraunces fail our test; see `visual-directions.md`. |

### Color

| | Evidence | Analysis |
|---|---|---|
| Accent and neutrals | One brand accent plus a neutral ramp plus semantic colors everywhere. | TokenIQ's accent must be distinct from the fintech defaults below. |
| Perceptual spaces | Stripe CIELAB, Linear LCH, Vercel OKLCH with P3, Ramp CSS `lab()`. | A perceptual space is now standard practice. |
| Accents already claimed | Indigo/periwinkle (Stripe, Mercury, Linear), lime (Ramp, Wise), orange (Brex), pink (Uniswap), neon green (Safe), violet (Hex, Datadog). | A deep petrol/teal, an ink blue on paper, or brass are all unclaimed. |
| Dark mode | Dark-first: Linear, Vercel, Uniswap, Safe, Mercury hero. Light-first: Stripe, Ramp, Brex, Wise, Hex. | Finance buyers skew toward light themes in daylight work. Ops users want dark. Both must be first-class. |

### Layout and density

- **Desktop shell.** A left sidebar plus a content grid (Linear, Stripe Dashboard per Apps docs, Datadog). Navigation is dimmed so content leads (Linear 2026).
- **Data cards.** Each card is a headline value, then a chart, at fixed heights (Stripe).
- **Mobile.** Bottom tabs organized by jobs (Brex: Wallet, Inbox, Trips). Mobile web marketing uses a hamburger menu (Uniswap, Wise).

### Money presentation

- **Rates and yields:**
  - Every rate carries an as-of date (Mercury "as of 10/02/2026", Ramp "as of September 3, 2026").
  - Rates are stated net of fees (Mercury, Ramp).
  - The instruments are named (Mercury tickers).
  - Liquidity terms are given in time units ("same-day by 3pm ET", "2 business days").
- **Units and fees:**
  - Dual units: token plus USD (Morpho).
  - Exact input wording ("You send exactly", Wise).
  - Fees as line items with a quote validity window (Wise "Guaranteed for 37h").
- **Deltas:** a glyph plus a sign plus color (Uniswap).
- **Live precise numbers as proof:** Stripe and Ramp tickers.

### Approvals

- Amount thresholds that mean "up to" (Ramp).
- Tiered sequential chains (Ramp).
- "Require all" versus any approver in a step (Ramp).
- A catch-all rule (Ramp).
- Separation of duties (Mercury).
- Dual admin approval for permission changes (Mercury).
- Per-user daily limits (Mercury).
- m-of-n with "x of n" progress (Safe).
- Strict execution ordering (Safe).
- Human-readable intent and pre-sign checks (Safe research).

### Empty, loading and error states

- Distinct empty, filtered-empty and error states; titles end with a period; the action matches the title (Stripe).
- Spinner delay of 200–300ms (Stripe) or 150–300ms with a 300–500ms minimum visible time (Vercel).
- Skeletons that mirror the final layout (Vercel, Uniswap).
- Navigation is never blocked by loading (Stripe).

### Motion

- Observed UI ranges:

  | Product | Duration | Easing |
  |---|---|---|
  | Linear | 100ms; 250ms regular | ease-out |
  | Vercel | 100–150ms | standard |
  | Uniswap | 80–250ms | ease |
  | Mercury | 150–300ms | ease-out |
  | Stripe marketing | 300ms | ease-out quart |
  | Wise | 350ms | custom in-out |

- No product we inspected uses spring overshoot on financial values.
- Detected reduced-motion rules: Wise 26, Ramp 9, Vercel 8, Hex 8, PostHog 9, Mercury 4. Stripe, Linear and Brex showed 0 detected, which may be a cross-origin limit.

### Landing-page narrative

The common skeleton:

1. An outcome headline (often two-tone), with a sub-line in plain words.
2. A primary CTA, plus a demo CTA.
3. Proof directly under the hero: a logo bar or a live metric.
4. Product capability sections, each showing real UI.
5. Segment sections (enterprise, startup, platform).
6. Security, compliance and custody.
7. Testimonials.
8. A repeat CTA.
9. A dense footer with legal disclosures.

Hero types seen: real product UI (Linear, Hex, Brex), photography (Mercury), gradient art (Stripe), and an interactive calculator (Wise, the most persuasive for money).

### Footer and trust signals

- Footers group links into four to seven columns.
- Mercury, Ramp and Brex put bank-partner disclosures in the footer, and Mercury also pins its disclosure inside the hero.
- Safe shows the app version, a status link and granular cookie preferences.
- Wise shows its regulator reference number.
- Trust signals in use: volume and customer stats, audits ("18+", "30+"), years in production, regulators, app ratings, uptime ("99.999%").

### Accessibility posture

- Leaders design contrast into their systems (Stripe's level rule, Linear's contrast parameter, Geist steps 9–10 for text), and Wise built accessibility into its rebrand brief.
- The crypto apps we sampled have measurable failures: Safe's secondary text at 3.22:1, and Uniswap's pink at 3.80:1 on white [S].

---

## 5. TokenIQ design benchmarks (24, each testable)

Each benchmark says how to test it and which source inspired it. "Fold" means the first viewport after app chrome, measured at **1280×800** (desktop) and **390×844** (mobile).

| # | Benchmark | How to test | Inspired by |
|---|---|---|---|
| 1 | **The answer comes first.** The dashboard shows "Safe to deploy now" as one exact amount, with its unit and an as-of time, above the fold at 1280×800 and 390×844 without scrolling. The derivation (Total − Protected reserve − Upcoming obligations = Deployable) is one interaction away. | Screenshot tests at both viewports. The element must be visible with `scrollY = 0`. | Stripe headline-above-chart; Wise calculator; Puzzle cards |
| 2 | **Every monetary value shows its unit.** Units are a token symbol or an ISO 4217 code ("15,200,000.00 USDC", "$15.2M ≈ USD"). Stablecoins also show the network when the same symbol exists on more than one chain. Fiat equivalents are marked "≈" and name their price source on hover or focus. | A lint rule on the `<Money>` component: no raw numbers in money slots. Visual QA sample of 50 screens. | Morpho dual units; Vercel nbsp between number and unit |
| 3 | **Tabular, aligned figures.** Every number in tables, KPIs, inputs, charts and axes uses `font-variant-numeric: tabular-nums`, with the font's `tnum` support verified. Numeric columns are right-aligned on a shared decimal scale. | A CSS audit of `[data-numeric]`. A digit-width test like ours; Geist, Inter and Plex all passed. | Vercel guidelines; Morpho and Linear live |
| 4 | **Precision rules.** Tables, confirmations and exports always show full precision: 2 decimals for fiat and stablecoins, and token-native decimals capped at 6 for volatile assets. K/M/B abbreviations appear only in KPI tiles and chart labels, and the exact value is then exposed on hover, on focus and in `aria-label`. | Unit tests on the formatter. An axe or manual screen-reader check that abbreviated values carry full-value labels. | Uniswap abbreviation (anti-pattern); Stripe Apps precise headline values |
| 5 | **Freshness is always visible.** Every balance, price, rate and APY shows an as-of stamp (relative, such as "Synced 40s ago", with absolute local time and UTC on hover). Past a staleness threshold, the value switches to a "Stale" state with an icon, text and a retry. | Mock stale feeds in Storybook. Assert the stale badge and copy. | Mercury and Ramp "as of" dates; Wise "Guaranteed for 37h" |
| 6 | **Yield honesty.** A yield never appears alone. It sits next to its basis (net or gross, and fee), its type (variable or fixed), its as-of date, its liquidity terms ("T+0 until 15:00 UTC", "T+2") and its risk tier with the curator or venue. APY is never styled in the brand accent as a lure. | A design-review checklist and a component contract: `<Yield>` requires `basis`, `asOf`, `liquidity` and `riskTier` props. | Mercury Treasury, Ramp Treasury, Morpho columns |
| 7 | **Color never stands alone.** Every status and semantic color is paired with a text label and an icon or shape. Deltas use ▲/▼, the sign and color together. Chart series carry direct labels or patterns. | A grayscale screenshot review must preserve all meaning. Automated check that `<StatusBadge>` always renders a label. | WCAG 1.4.1; Uniswap delta glyphs |
| 8 | **Contrast in both themes.** All text meets 4.5:1, and large text (≥24px, or ≥18.66px bold) meets 3:1. Meaningful non-text elements (input borders, focus rings, chart marks, bucket fills, toggle states) meet 3:1 against adjacent colors, in light and dark. | A token-pair contrast test in CI (script in `visual-directions.md`, Appendix A). Zero failures allowed. | WCAG 2.2 1.4.3 and 1.4.11; Stripe level rule |
| 9 | **The three bucket colors are protected.** The Protected reserve, Upcoming obligations and Deployable surplus colors are reserved for those meanings only and are never reused as status colors. They stay distinguishable under protan, deutan and tritan simulation (minimum ΔE76 of 15), and each carries a non-color cue (pattern or direct label). | A CVD simulation script (`visual-directions.md` §6.2). A token-usage lint. | Stripe level system; Linear perceptual color |
| 10 | **Approvals are transparent and safe.** Every approval request shows the same nine elements. A request cannot be approved from a list row in one click. | A component contract plus an e2e test that self-approval is blocked. | Safe queue and research; Mercury separation of duties; Ramp matrix |
| 11 | **Irreversible actions are confirmed in plain language.** Deploy, withdraw, policy edits and signer changes open a review step that restates the amount, destination and consequence in one sentence. The confirm button names the action ("Approve 250,000.00 USDC to Steakhouse USDC vault"), never "OK" or "Confirm". If an action is reversible, prefer Undo. | A copy lint on buttons in the confirmation context. A usability test: 5 of 5 participants correctly restate what they approved. | Vercel guideline; Safe "verify what is signed" |
| 12 | **Keyboard-first operation.** Every action is keyboard-operable, and ⌘K / Ctrl+K reaches every navigation destination and primary action. Every interactive element has a visible `:focus-visible` ring of at least 2px at 3:1 or better, and sticky headers or toasts never obscure focus (WCAG 2.4.11). Shortcuts appear in tooltips and menus. | An axe-core keyboard audit plus a manual tab-through of the core flows (approve, deploy, edit policy). | Linear command menu and display options; Vercel guidelines |
| 13 | **Touch and drag alternatives.** Touch targets are at least 44×44pt on mobile and at least 24×24 CSS px everywhere (WCAG 2.5.8). Every drag interaction (sliders, scrubbers, reordering) has a single-pointer or keyboard alternative such as steppers or arrow keys (WCAG 2.5.7). | Automated target-size audit. Manual test with the pointer only and the keyboard only. | WCAG 2.2 |
| 14 | **Loading without layout shift.** Skeletons mirror the final layout, with dashboard CLS below 0.02. Spinners appear only after a 200–300ms delay and stay visible for at least 300ms. Sections load independently, and the shell and navigation are never blocked. | Lighthouse or Web Vitals CLS in CI. A visual diff of skeleton against loaded state. | Stripe loading pattern; Vercel guidelines; Uniswap skeletons |
| 15 | **Every list has its states designed.** Each list and table has distinct designs for first-use empty, filtered-empty and error. The empty title states what is missing, and the action wording matches the title ("No policies yet." pairs with "Create policy"). | Storybook coverage: each table story has its three states. | Stripe empty-state pattern; Vercel "All states designed" |
| 16 | **Restrained motion.** UI transitions last 100–300ms with ease-out curves. Financial values never bounce, overshoot or "slot-machine roll". They crossfade or update in place. Under `prefers-reduced-motion: reduce`, all non-essential motion is removed, including chart draw-ins and number tweens. No `transition: all`. | CSS lint (no `transition: all`, durations from tokens only). Playwright with reduced-motion emulation. | Linear, Vercel and Mercury observed timings; Wise reduced-motion coverage |
| 17 | **Explainability.** Every computed figure (deployable surplus, runway, protected reserve, risk tier) has a "How this is calculated" disclosure with the formula, inputs and sources. Primary surfaces use plain words ("Protected reserve", not "liquidity buffer tranche"), and help text reads at grade 9 or below. | A content audit plus a readability score on help strings. A usability test: a finance lead can recompute the deployable figure. | Wise fee line items; PostHog "Clarity > cleverness"; Linear "aim for clarity" |
| 18 | **Shareable state.** Filters, time ranges, selected entities and open records persist in the URL. Approvals, policies and reports have stable deep links that are safe to paste into chat because permissions are re-checked. | An e2e test: copy the URL, open it in a new session and get the same view (after authentication). | Vercel guideline |
| 19 | **Chart discipline.** Every chart has a headline value above it, a fixed-height container shared across its loading, empty and error states, units on its axes, policy thresholds drawn as labeled reference lines, and an accessible data-table alternative. Charts use no gradients, glow or 3D. | Component contract and visual review. A screen reader can reach the table view. | Stripe chart layout; Datadog tabular axes |
| 20 | **Theme parity, no casino styling.** Light and dark themes are both complete, generated from one semantic token set, with `color-scheme` and `theme-color` set. Product UI uses no glassmorphism or backdrop blur, neon glow, gradient text, or animated gradient backgrounds. | Token coverage report. A CSS lint banning `backdrop-filter`, glow-style `box-shadow` on non-focus states, and `background-clip: text`. | Geist; Linear three-input theming; crypto anti-patterns |
| 21 | **Trust surface on the landing page.** Before the footer, the landing page explains in plain words who controls keys and funds (custody model), what TokenIQ can and cannot move, its security posture (audits, SOC 2 status, pen tests), and its data sources. The footer links to the status page, security page, changelog and version, and the legal disclosures. | Content checklist review. | Mercury, Ramp and Brex disclosures; Safe version and audits; Morpho "not an endorsement" |
| 22 | **Approvals travel well on mobile.** At 390×844, a signer can go from notification to the approval detail to passkey confirmation in at most 3 taps, with the amount, destination and policy visible without scrolling. Mobile navigation is a bottom tab bar with no more than 4 job-based items (Overview, Approvals, Activity, More). | A timed task on device. Screenshot test. | Brex Wallet/Inbox/Trips; Safe "x of n" |
| 23 | **Address hygiene.** On-chain addresses appear in mono as the first 6 and last 4 characters, with a copy button, an address-book label and a chain badge. Confirmation screens always show the full checksummed address and flag any first-time or unverified destination with a warning (icon and text). Labels and ENS names never replace the full address at signing time. | Component contract plus an e2e test for the first-time-destination warning. | Safe research ("carefully examined"); Morpho warnings |
| 24 | **Performance and density.** Dashboard INP stays below 200ms and LCP below 2.5s on a mid-range phone over 4G. Tables offer comfortable (44px rows) and compact (32px rows) density, defaulting to compact for operator roles, with a body size of 13–14px. | Web Vitals in CI and real-user monitoring. Density toggle QA. | Linear speed ethos; Stripe's 13–14px product text |

**The nine approval elements required by benchmark 10:**

1. The human-readable intent.
2. The amount with its unit.
3. The destination, by name and address.
4. The policy that triggered the request.
5. The initiator.
6. Signer progress as "2 of 3", with names and timestamps.
7. The expiry.
8. The pre-execution simulation result.
9. The audit trail.

The initiator cannot approve their own request. Approving requires re-authentication with a passkey (WebAuthn), which meets WCAG 3.3.8.
