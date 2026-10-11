# TokenIQ: three candidate visual directions

- **Date:** 2026-10-11
- **Inputs:** `design-benchmarks.md`, which holds the evidence, the cross-product synthesis and the 24 benchmarks.
- **Brief:** The brand should feel intelligent, precise, financially confident, calm, in control and transparent. It must not look like a crypto casino (neon, glassmorphism, glow) or a generic AI dashboard template.

**The story every direction must tell:** a treasury's money splits into three buckets.

| Bucket | Meaning | Rule |
|---|---|---|
| Protected reserve | Runway the policy says must never be touched | Fixed by policy |
| Upcoming obligations | Payroll, vendors, grants, debt service and other payments due within the horizon | Committed |
| Deployable surplus | What is left over | May go into vetted yield under policy and multi-person approval |

**Sample data used in every concept:**

- Treasury total: **42,800,000.00 USDC-equivalent**
- Protected reserve: **18,000,000.00** (6 months at a 3.0M monthly burn)
- Obligations in the next 90 days: **9,600,000.00**
- Deployable: **15,200,000.00**

All three directions share the same information architecture and the same 24 benchmarks. They differ in composition, visual language, typography and motion. They are not color swaps of one layout.

---

## 0. Shared, non-negotiable foundations (any direction)

- **Bucket semantics.** The three bucket colors mean only Reserve, Obligations or Deployable. They are never reused for success, warning or danger. Each one also carries a non-color cue:
  - Reserve: hatched fill and a lock glyph.
  - Obligations: tick-segmented fill and a calendar glyph.
  - Deployable: solid fill and an arrow-out glyph.
- **Money component.** One `<Money>` component carries the amount, unit, precision, `asOf`, source and an "approximate" flag. All numeric text uses `tabular-nums`, and K/M/B abbreviations come only from that component with the full value in `aria-label`.
- **Status component.** `<Status>` always renders an icon and a text label. Color is the third cue, never the only one.
- **Approvals.** Approvals use the nine-element contract from benchmark 10, with passkey re-authentication and separation of duties.
- **Freshness.** The app header always shows a freshness indicator (for example "Synced 40s ago · 6 sources"), and stale data is shown with a "Stale" status.
- **Themes.** Light and dark are both first-class. Neither uses glass, blur, glow, gradient text or animated gradients.

---

## 1. Direction A: "Ledger Grid" (the precision instrument)

### Concept

The treasury is a precision instrument laid out on a strict Swiss grid. Figures are the typographic hero, hairlines replace boxes, and there is exactly one accent, petrol. In the product that accent semantically means *deployable or actionable*.

The calm comes from alignment and restraint, not from decoration. Benchmarks 1 and 3 are visible on every screen: the answer comes first, and it is set in tabular figures.

Lineage:

- Vercel/Geist token discipline.
- Linear's dimmed navigation and density.
- Stripe's headline-above-chart rule.
- Wise's arithmetic shown as line items.

### Typography (both families verified: SIL OFL 1.1, tabular figures measured)

| Role | Face | Spec |
|---|---|---|
| Display: marketing hero figure | **Geist** | 64/64, weight 500, tracking −0.02em (figures −0.01em), `tabular-nums` |
| Display: marketing headline | Geist | 48/52, weight 500, −0.025em |
| App page title | Geist | 24/32, weight 600, −0.01em |
| Section heading | Geist | 16/24, weight 600 |
| Body | Geist | 14/20, weight 400 |
| Table cell (compact or comfortable) | Geist | 13/20, weight 400, `tabular-nums`, right-aligned numbers |
| Label | Geist | 12/16, weight 500, secondary color, sentence case |
| KPI value | Geist | 32/36, weight 500, `tabular-nums` |
| Addresses, tx hashes, IDs, policy expressions, log timestamps | **Geist Mono** | 12/16 and 13/20, weight 400 |

- **License.** OFL 1.1, confirmed in https://github.com/google/fonts/blob/main/ofl/geist/OFL.txt and `…/geistmono/OFL.txt`. The variable weight axis is 100–900 on Google Fonts. `tnum` was verified by measurement: digit-width difference of 0px with `tabular-nums` against 103.7px without.
- **Weights.** Use only 400, 500 and 600.

### Palette

| Token | Light | Dark | Use |
|---|---|---|---|
| `canvas` | `#FAFAF9` | `#0C0F10` | App background |
| `surface` | `#FFFFFF` | `#14181A` | Cards, tables |
| `surface-sunken` / `raised` | `#F2F3F2` | `#1B2023` | Wells, hovered rows |
| `hairline` | `#E3E5E4` | `#262C30` | Decorative dividers (not meaningful) |
| `border-strong` | `#8A9396` | `#5F6A70` | Input borders, meaningful outlines (≥3:1) |
| `text-primary` | `#0F1416` | `#ECEFEE` | |
| `text-secondary` | `#4A5458` | `#A9B2B5` | |
| `text-tertiary` | `#636D71` | `#87929A` | Meta, timestamps |
| **`accent` (Petrol)** | **`#0E6470`** | **`#5CBAC6`** | Primary actions, focus ring, the Deployable bucket |
| `accent-subtle` | `#E4F1F2` | `#123A40` | Selected rows, active nav |
| `on-accent` | `#FFFFFF` | `#062A2F` | Text on the accent |
| `success` | `#1E7A46` | `#4CC38A` | |
| `warning` | `#995700` | `#E2A23B` | |
| `danger` | `#B42318` | `#F2786D` | |
| `info` | `#2F5FB3` | `#7EA9F2` | |
| Bucket: Reserve (hatched) | `#2D3A40` | `#6E7A80` | Fill only |
| Bucket: Obligations (tick-segmented) | `#B07018` | `#D9A441` | Fill only. Its label text uses `text-primary` because ochre measures 4.06:1 as text. |
| Bucket: Deployable (solid) | `#0E6470` | `#5CBAC6` | Equal to the accent, on purpose |

Petrol is unclaimed in the competitive set, which uses indigo, lime, orange, pink, neon green and violet. Teal reads as "money and precision" without any casino connotation.

### Landing hero: "The allocation bar"

```
 TokenIQ                                   Product  Security  Docs  Pricing      [Book a walkthrough]
 ─────────────────────────────────────────────────────────────────────────────────────────────────
 Treasury intelligence for onchain organizations.  Know what's protected, what's owed,
 and what can safely work.                                     (two-tone headline, dark + muted)

  Safe to deploy now                                                       as of 14:02 UTC · 6 sources
  15,200,000.00 USDC                                                     ▲ 1.4M vs last week
 ┌───────────────────────────────┬─────────────┬───────────────────────────┐
 │////// Protected reserve ///////│▮▮▮▮▮▮ Owed ▮▮│      Deployable surplus    │  ← 100% bar, 42.8M
 │//////  18,000,000.00   ////////│ 9,600,000.00 │       15,200,000.00        │
 └───────────────────────────────┴─────────────┴───────────────────────────┘
  Runway to protect  [−] 6 months [+]        Obligation horizon  [ 30 | 60 | 90 days ]
 ─────────────────────────────────────────────────────────────────────────────────────────────
  Total treasury                       42,800,000.00
  − Protected reserve (6 mo × 3.0M)    18,000,000.00   ¹
  − Obligations due ≤ 90 days           9,600,000.00   ²   (14 payments · next: Payroll, Oct 15)
  = Deployable surplus                 15,200,000.00
 [Model your treasury →]   [See a live demo workspace]                ¹ ² How we calculate this
```

- **Interaction.**
  - Steppers and a segmented control (not a drag-only slider, per WCAG 2.5.7) change the inputs.
  - Segment widths re-flow over 200ms ease-out, and the figures crossfade over 120ms. There is no number rolling.
  - Hovering or focusing a segment highlights its line in the arithmetic ledger.
  - The obligations segment is subdivided by tick marks, one per due item, and hovering a tick shows that payee, amount and due date.
  - With reduced motion, everything updates instantly.
- **Why it works.** It is Wise's calculator applied to a treasury, so the hero is a working model, not an illustration.

### Dashboard composition

**At 1280×800:**

```
┌────────┬──────────────────────────────────────────────────────────────────────────┐
│TokenIQ │ Acme DAO ▾   Base · Ethereum   ⌘K Search or jump…      Synced 40s ago ●  SA│
│        ├──────────────────────────────────────────────────────────────────────────┤
│Overview│ Safe to deploy now                           │ Total treasury  42.80M  ▁▂▃▅ │
│Liquidity│ 15,200,000.00 USDC        ▲ 1.40M (7d)       │ Runway protected  6.0 mo  ✓  │
│Obligat.│ [////reserve////|▮▮owed▮▮|  deployable  ]     │ Due ≤ 30 days    3.20M   ▲  │
│Deploym.│ How this is calculated ›                     │ Deployed (yield) 6.00M 4.1% net│
│Approvals 2│──────────────────────────────────────────────┴───────────────────────────│
│Policies│ Liquidity runway · next 90 days (step chart)      │ Needs your approval (2)  │
│Activity│  ─── balance  - - - reserve floor 18.0M (labeled)  │ ▸ Deploy 2.5M USDC → Morpho│
│Reports │  ▼ obligations as event ticks on the x-axis        │   2 of 3 signed · exp 22h │
│        │                                                    │ ▸ Pay vendor 180k USDC    │
│ ─────  │                                                    │   1 of 2 signed · exp 3d  │
│Settings│───────────────────────────────────────────────────┴──────────────────────────│
└────────┴ Positions  (venue · asset · amount · ≈USD · net APY · liquidity · risk tier · policy) ┘
```

- **Grid.** 12 columns with 24px gutters. The sidebar is 232px and collapses to a 56px rail. Maximum content width is 1440px.
- **Above the fold.** The answer card, the KPI stack, the start of the runway chart and the approvals queue.
- **Navigation.** The sidebar text is dimmed to `text-secondary` and the active item uses `accent-subtle`, following Linear's "Don't compete for attention you haven't earned".

**At 390×844** (mobile web and PWA), in order from top to bottom:

1. A compact header (org and freshness).
2. The "Safe to deploy now" amount and the allocation bar, full width.
3. A 3-row KPI list.
4. "Needs your approval (2)".
5. A bottom tab bar: Overview · Approvals (badge) · Activity · More.

Tables become stacked statement rows, with the label left, the amount right, and meta on a second line.

### Cards and data treatment

- **Cards.** No shadows. A 1px `hairline` border, 8px radius on cards, 6px on controls and 4px on chips. Padding is 16px in compact mode and 24px in comfortable mode.
- **Card anatomy.** A label (12px secondary), then the value (tabular), then a meta row (delta with ▲/▼, as-of time and source).
- **Tables.**
  - Row height is 32px compact or 44px comfortable. A zebra background is optional, never colored.
  - Numeric columns are right-aligned and the unit sits in the column header ("Amount (USDC)") to cut repetition. Mixed-unit columns show the unit inline instead.
- **Negative values** use a true minus sign (U+2212), a text label and the `danger` color only when the value is bad. A negative delta is not automatically red.
- **Elevation.** Only floating layers (menus, modals) get a shadow: `0 1px 2px rgb(15 20 22 / .06), 0 8px 24px rgb(15 20 22 / .08)` in light. In dark, raised layers use a lighter surface plus a border, not a shadow.

### Chart style

- **Balances are step charts,** because money moves in discrete events. Lines are 1.5px, and area fills sit at 12% opacity or less.
- **Allocation is a 100% stacked bar.** A meter-style bar replaces donuts entirely.
- **Policy thresholds** (reserve floor, concentration caps) are 1px dashed reference lines with direct labels such as "Reserve floor 18.0M".
- **Upcoming obligations** appear as event ticks on the x-axis, and focusing a tick shows its details.
- **Labels and axes.** Labels sit directly on the series, and a legend appears only when there are four or more series. Axis numbers use `tabular-nums` in tertiary text, with gridlines in `hairline`.
- **Not allowed:** gradients, glow, 3D, or pie charts with more than three slices.

### Motion concept: "Measured"

| Token | Value | Use |
|---|---|---|
| `--dur-fast` | 120ms | Hover, press, figure crossfades |
| `--dur-base` | 200ms | Bar re-flow, panels |
| `--dur-slow` | 280ms | Drawers and sheets |
| `--ease-out` | `cubic-bezier(0.2, 0, 0, 1)` | Default curve |
| `--ease-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` | Moves between two resting states |

- These timings sit inside the observed range for leading products: Linear 100–250ms, Vercel 100–150ms, Mercury 150–300ms.
- There are no springs and no overshoot. Charts do not draw in on load; they appear once their data is ready.
- **Reduced motion:** every duration becomes 0ms, except opacity fades of 100ms or less.

### Mobile adaptation

- **Bottom tabs.** Four of them (Overview · Approvals · Activity · More), with targets of 44pt or larger.
- **Approval flow.** A push notification opens the approval detail sheet, which shows the intent sentence, the amount, the destination (label plus full address on expand), the triggering policy, "2 of 3 signed" with names, and the simulation result. The signer confirms with a passkey prompt in 3 taps or fewer.
- **Inputs.** The allocation bar becomes vertical-friendly: it stays horizontal at full width, and its labels move under the bar. Steppers replace any drag interaction.

### Risks

- It could read as "another Vercel/Linear clone", because Geist and hairline grids are common in 2025–26. *Mitigations:* the petrol accent, the hatched reserve texture, the ledger arithmetic motif, and finance-grade copy.
- Density can intimidate non-technical finance leads. *Mitigation:* comfortable density by role and the "How this is calculated" disclosures.
- Making the accent mean Deployable could confuse users when it also styles the primary buttons. *Mitigation:* buttons pair the accent with a verb ("Deploy", "Approve"), and the content rules are documented.

---

## 2. Direction B: "Annual Report" (the living financial statement)

### Concept

The treasury reads like a beautifully typeset, footnoted financial statement that updates itself. Every screen reads top to bottom:

1. A **position sentence** written from live data.
2. The statement table, with leaders and subtotals.
3. Notes covering assumptions, sources and methodology.

The canvas is warm paper with ink rules, few boxes and a lot of whitespace. Authority comes from the conventions of the annual report and the financial press.

Lineage:

- Wise's plain-language transparency.
- The way Mercury and Ramp disclose yield, with dates, fees and instruments.
- Hex's serif-plus-sans mix.
- Stripe's two-tone claim.

### Typography (all three verified: OFL 1.1, tabular figures measured)

| Role | Face | Spec |
|---|---|---|
| Display / position sentence | **Source Serif 4** (opsz axis 8–60) | Sentence 36/44 at weight 400, opsz auto. Display 56/60 at weight 600. Figures `lnum tabular-nums`. |
| Section headings | Source Serif 4 | 24/32, weight 600 |
| UI, body, tables | **IBM Plex Sans** | Body 15/24 at weight 400, tables 14/20, labels 12/16 at weight 500. Digits are tabular by default. |
| Statement caps (sparingly) | IBM Plex Sans | 11/16, weight 600, uppercase, +0.06em |
| Footnotes and notes | IBM Plex Sans | 12/18, tertiary color |
| Addresses, hashes, policy IDs | **IBM Plex Mono** | 12/16 |

- **Licenses.** All three are OFL 1.1: https://github.com/google/fonts/blob/main/ofl/sourceserif4/OFL.txt and `…/ibmplexsans/OFL.txt` and `…/ibmplexmono/OFL.txt`.
- **Reserved font names.** Source Serif reserves "Source" and IBM Plex reserves "Plex". A modified build, such as a custom subset, must be renamed. Serving the unmodified Google Fonts files is fine.
- **Measured figure support.** Source Serif 4 `tnum` works (0px difference when on). Plex Sans digits are tabular by default (0px either way).
- **Rejected.** We rejected Instrument Serif and Fraunces as numeral faces because neither supports `tnum` (67.5px and 64.2px width differences with `tabular-nums` on).

### Palette

| Token | Light ("Morning edition") | Dark ("Evening edition") |
|---|---|---|
| `paper` (bg) | `#F6F3EC` | `#141310` |
| `sheet` (surface) | `#FFFDF8` | `#1C1A16` |
| `rule` (decorative) | `#D9D3C7` | `#34302A` |
| `rule-strong` (inputs) | `#8C857A` | `#6B655B` |
| `ink` (text-primary) | `#1B1A17` | `#EEE9DF` |
| `text-secondary` | `#57524A` | `#B5AEA2` |
| `text-tertiary` (notes) | `#6A645A` | `#958E83` |
| **`accent` (Prussian ink)** | **`#1F3F6B`** | **`#9DB8E3`** |
| `on-accent` | `#FFFFFF` | `#0F1E33` |
| `success` / `warning` / `danger` / `info` | `#2C6B3F` / `#8F5300` / `#A3261B` / `#2F5F8F` | `#7CC49A` / `#E0A85A` / `#F08A7E` / `#8FC1E8` |
| Bucket: Reserve (solid ink) | `#1F3F6B` | `#7E9ED6` |
| Bucket: Obligations (sienna, ruled) | `#A0522D` | `#D98E63` |
| Bucket: Deployable (verdigris, outlined then filled) | `#3D6B5A` | `#9CCB9E` |

### Landing hero: "The position sentence"

```
                         TokenIQ  ·  The treasury, accounted for.

      Of your  $42.8 million  treasury,  $18.0 million  is protected,
      $9.6 million  is already spoken for, and  $15.2 million  can safely go to work.
                                                       — Acme DAO, 11 October 2026, 14:02 UTC ¹

      ┌ Statement of liquidity ───────────────────────────────────────────────┐
      │ Total treasury ............................................ 42,800,000.00 │
      │ Less: protected reserve (6 months of operating costs) ² .. (18,000,000.00) │
      │ Less: obligations due within 90 days ³ ................... (9,600,000.00) │
      │ Deployable surplus ........................................ 15,200,000.00 │
      └────────────────────────────────────────────────────────────────────────┘
      Bridge chart:  ▇▇▇▇▇▇▇▇▇ 42.8  →  ▆▆▆ −18.0  →  ▄▄ −9.6  →  ▇▇▇▇ 15.2
      [See your own position]      Notes: ¹ data sources ² reserve policy ³ obligation schedule
```

- **Interaction.**
  - Each underlined figure in the sentence is a focusable control. Activating "is protected" opens an inline segmented choice (3 | 6 | 9 | 12 months), and the sentence, statement and bridge chart re-flow together over a 240ms crossfade.
  - Footnote markers open margin notes. On mobile they open as a bottom sheet.
- **Why it works.** It speaks to the CFO and the board in their own genre, and the honesty is built into the typography: the footnotes *are* the trust signals.

### Dashboard composition

- **Structure.** No heavy sidebar. Report sections run across the top (Position · Obligations · Deployments · Approvals · Policies · Notes) with a sticky "contents" rail on wide screens.
- **Columns.** A reading column of 960–1120px with a 280px **margin-notes** column on the right for as-of stamps, sources, assumptions and policy references.

**At 1280×800, above the fold:**

- The position sentence, in two lines.
- The statement-of-liquidity table.
- A "Requires your signature (2)" note in the margin.

**Below the fold:**

- A "Schedule of obligations", styled like a bond schedule: date, payee, amount, status.
- "Deployments", where each venue gets a *fact box*: custody, liquidity terms, net yield as of a date, curator, audits, last reviewed, and risk tier.

**At 390×844:** the sentence (it wraps naturally), then the statement as a definition list, then the signature requests. The bottom bar has 3 items (Position · Approvals · Activity), and the full contents open from a "Contents" sheet.

### Cards and data treatment

- **Mostly card-less.** Sections are separated by 1px rules and whitespace. Fact boxes have a 2px ink top rule and a 2px radius.
- **Statement conventions.**
  - Dot leaders, subtotal rules (a single line above a subtotal, a double line under the total), and parentheses for deductions alongside a minus sign in accessible text.
  - Numbers are right-aligned in Plex Sans with tabular figures.
- **Notes everywhere.** Superscript note markers link to methodology, giving every derived number a citation.

### Chart style

- Bridge (waterfall) charts for derivations.
- Small multiples for comparing venues.
- Dot plots for yields, with an interval for the variable-rate range.
- Thin ink lines with sparse gridlines, annotations set in serif italic, and footnote markers on the charts themselves.
- No fills over 20%, and colors limited to the bucket palette.

### Motion concept: "Print-like"

- Nearly static.
- 160ms opacity fades for state changes.
- A 240ms crossfade when the sentence or statement re-flows.
- No page transitions, no hover lifts.
- Reduced motion removes the crossfades entirely.

### Mobile adaptation

Mobile is the strongest of the three, because the reading column maps directly to phones. Tables become definition lists, and margin notes become expandable "Note" rows. Approvals use the same 3-tap passkey flow as Direction A, presented as a "memo" sheet.

### Risks

- **Density.** Operators will want a denser "ledger mode" for activity logs and positions, so B would have to grow a second, A-like visual mode.
- **Positioning.** The serif and paper may read as "private bank / wealth management" rather than crypto-native intelligence, and may feel slow to a technical treasury operator.
- **Generated sentences.** They must be provably correct, localized and not read as AI filler. That needs templated natural-language generation with tests, not free-form text.
- **Typesetting cost.** Statement typesetting (leaders, double rules, footnotes) is costly to build responsively and to keep accessible.

---

## 3. Direction C: "Reservoir" (levels, floors and time)

### Concept

Liquidity is shown as *levels* in a reservoir governed by policy lines:

- **The floor** is the protected reserve, the bedrock.
- **The committed band** is obligations, which drain over time as payments come due.
- **The surface layer**, lit in brass, is the deployable surplus.

The composition is vertical and spatial, and time runs horizontally. The signature view is a projected *level chart*: the treasury level over the next 90 days, with policy lines the level must not cross.

The visual language is a matte night console, drawn from aviation and marine instruments: low chroma, mono readouts, no glow, no neon.

### Typography (both verified: OFL 1.1, tabular figures measured)

| Role | Face | Spec |
|---|---|---|
| Display / headings | **Instrument Sans** (variable: wdth 75–100, wght 400–700) | Display 56/60 at weight 600, wdth 90, −0.02em. App titles 22/28 at weight 600. |
| UI body and labels | Instrument Sans | Body 14/20 at weight 400. Panel headers 11/16 at weight 600, wdth 80, +0.08em uppercase. |
| Readouts: all KPIs, table numbers, axis labels | **JetBrains Mono** | KPI 28/32 at weight 500. Table numbers 13/20 at weight 400. |
| Addresses and hashes | JetBrains Mono | 12/16 |

- **Licenses.** Both OFL 1.1: https://github.com/google/fonts/blob/main/ofl/instrumentsans/OFL.txt and `…/jetbrainsmono/OFL.txt`.
- **Measured figure support.** Instrument Sans `tnum` works (0px difference when on). JetBrains Mono is monospaced.

### Palette

| Token | Dark ("Night", default) | Light ("Day") |
|---|---|---|
| `bg` | `#0E1012` | `#F4F5F6` |
| `surface` | `#15181B` | `#FFFFFF` |
| `raised` | `#1C2024` | `#EEF0F2` |
| `line` (decorative) | `#2A2F34` | `#DADDE1` |
| `border-strong` | `#656E77` | `#858E97` |
| `text-primary` | `#E8EAEC` | `#121518` |
| `text-secondary` | `#A3AAB1` | `#4B535B` |
| `text-tertiary` | `#868E96` | `#646D76` |
| **`accent` (Brass)** | **`#D2A857`** | **`#85611A`** (brass ink, for text and buttons) |
| `on-accent` | `#1A1408` | `#FFFFFF` |
| `success` / `warning` / `danger` / `info` | `#5FBF8F` / `#F08C4A` / `#F0716A` / `#78A9E0` | `#1F7A4D` / `#A3470C` / `#B3261E` / `#2B5E9E` |
| Bucket: Reserve (bedrock, deep steel) | `#4E6B8A` | `#2F4A63` |
| Bucket: Obligations (committed band, mid steel) | `#7E9AB6` | `#6A879F` |
| Bucket: Deployable (surface layer, brass) | `#D2A857` | `#B07F22` (fill; text uses `#85611A`) |

### Landing hero: "Set the floor, watch the level"

```
 ┌──────────────────────────────────────────────────────────────────────────────────────┐
 │  TOKENIQ                                                    Product  Security  Docs  [Demo] │
 │                                                                                      │
 │  Know your floor.                 ┃▓▓▓▓▓▓▓▓▓▓▓▓▓▓┃  ← surface: DEPLOYABLE 15,200,000.00   │
 │  Deploy only what's above it.     ┃░░░░░░░░░░░░░░┃  ← committed: OBLIGATIONS 9,600,000.00 │
 │                                   ┃▒▒▒▒▒▒▒▒▒▒▒▒▒▒┃                                        │
 │  [Model your treasury]            ┃▒▒▒▒▒▒▒▒▒▒▒▒▒▒┃  ── FLOOR · 6 MO RUNWAY · 18,000,000 ──│
 │                                   ┃██████████████┃     (draggable policy line + stepper)  │
 │  Projected level, next 90 days:                                                        │
 │  42.8 ┤▔▔▔▔▔▔╲___▔▔▔▔▔▔╲_____▔▔▔▔▔▔╲____  ← steps down at each obligation               │
 │  18.0 ┤- - - - - - - - - - - - - - - - - -  FLOOR                                       │
 │        Oct 11        Nov 10        Dec 10      Jan 9    ◀ day 45 ▶ (scrubber + arrows)  │
 └──────────────────────────────────────────────────────────────────────────────────────┘
```

- **Interaction.**
  - A day scrubber, which also takes arrow keys or ◀ ▶ buttons, moves through time. As obligations come due, the column's committed band drains and the projected deployable figure updates.
  - The floor line can be raised by dragging or with a stepper, and the surface layer shrinks.
  - The readouts in mono update instantly. Layer heights animate over 320ms with critically damped easing (no overshoot).
- **Why it works.** It makes the *time* dimension of obligations visible. Neither A nor B shows that in the hero.

### Dashboard composition

**At 1280×800:**

- A 64px icon rail with labeled flyouts.
- A top readout strip in mono: TOTAL · DEPLOYABLE · FLOOR HEADROOM · PENDING APPROVALS.
- A large central level chart, 8 columns wide.
- A right "event rail" (4 columns): upcoming obligations and policy events in time order, plus approvals.
- A positions table below.
- Dense, dark by default.

**At 390×844:** a readout strip of two KPIs, then the level chart (horizontal, 220px tall, with day-step buttons), then the event rail as a list, then the bottom tab bar (4 items).

### Cards and data treatment

- **Panels.** 1px `line` borders with a 4px radius. Panel headers use uppercase semi-condensed 11px labels.
- **Readouts.** Mono, right-aligned, with units in a smaller tertiary label after the figure ("15,200,000.00 USDC").
- **Status lamps** are small solid squares (not glowing dots), always next to text.

### Chart style

- Step-area level charts with matte fills.
- Horizontal policy lines (floor, caps) labeled in uppercase mono.
- Obligation event markers.
- Horizon bands for many-venue comparisons.
- No gradients, glow or blur. The surface layer is the only brass element.

### Motion concept: "Damped"

- Direct manipulation has zero added latency.
- Level changes take 320ms, critically damped with `cubic-bezier(0.22, 1, 0.36, 1)` and no overshoot.
- Readouts snap with no tween.
- Reduced motion turns level animation into instant updates.

### Mobile adaptation

- The column turns into a horizontal gauge card.
- The scrubber is backed by explicit ◀ ▶ day-step buttons and a date picker, as WCAG 2.5.7 requires.
- The event rail becomes the main mobile list.
- Approvals use the same 3-tap passkey flow.

### Risks

- **The metaphor over-simplifies.** Money is not fungible across chains, venues and lockups. Water levels hide fragmentation (for example funds stuck on another chain or behind a withdrawal queue) unless layers are subdivided, which adds complexity.
- **Positioning.** Dark-first with a brass accent and mono readouts can drift toward a "trading terminal / crypto luxury" look, the opposite of calm.
- **Readability.** Mono numerals widen tables and are less readable for long figures.
- **Effort and accessibility.** Custom charts and direct manipulation are the highest implementation and accessibility effort of the three.
- **Color conflicts.** Brass sits next to the tangerine warning color. The icon and text rule on statuses mitigates this, but it must be watched.

---

## 4. Scoring matrix (1 = poor, 5 = excellent)

| Criterion | A: Ledger Grid | B: Annual Report | C: Reservoir |
|---|---|---|---|
| **Clarity** | **5.** The answer figure plus the visible arithmetic answers "how much can we deploy" at a glance on every surface. | **4.** The position sentence is the clearest possible headline, but dense operational screens become long documents. | **4.** Levels and floors are intuitive and show time well, but the metaphor needs a moment to learn and can hide fragmentation. |
| **Distinctiveness** | **3.** The petrol accent and ledger motif help, but a Geist hairline grid sits close to Vercel and Linear. | **4.** Nobody in crypto treasury looks like a typeset annual report. | **5.** The level chart and spatial column are memorable and ownable. |
| **Trustworthiness** | **5.** Restraint, visible math and full precision are exactly what finance buyers associate with Stripe-grade tools. | **5.** Footnotes, as-of stamps and statement conventions borrow centuries of financial trust. | **3.** A dark console with brass and mono can read as a trading tool, and trust depends on execution. |
| **Mobile usability** | **4.** The answer card, approvals and bottom tabs work well, though wide tables need stacked-row patterns. | **5.** A reading column is native to phones, and the sentence wraps gracefully. | **3.** The time scrubber and level chart are cramped at 390px and need button alternatives. |
| **Information density** | **5.** Compact 32px rows, a 13px table size and a 12-column grid support operator workloads. | **2.** Whitespace and statement formatting cost density, and an ops "ledger mode" would be needed. | **4.** The console layout is dense, but large charts consume space. |
| **Accessibility** | **5.** Light-first with dark parity, 0 contrast failures, CVD separation of 17 or more, and no drag-only controls. | **4.** Contrast passes, but serif footnote text at 12px and generated sentences need careful screen-reader testing. | **3.** Contrast passes, but dark-first, drag-centric interactions and mono-heavy reading raise the bar. |
| **Implementation feasibility** | **5.** Standard components, Geist from npm or Google Fonts, and conventional charts. A team can ship it in weeks. | **3.** Responsive statement typesetting and tested natural-language generation for sentences are non-trivial. | **2.** Custom level and scrubber charts, damped animation and accessible direct manipulation are costly. |
| **Long-term scalability** | **5.** A token ladder like Geist's scales to new modules (policies, reports, integrations) without new visual ideas. | **3.** It is beautiful for position and report views but strains for logs, settings and admin, and needs a second mode. | **3.** The reservoir metaphor does not extend naturally to policies, users or integrations, so those screens fall back to generic UI. |
| **Total (of 40)** | **37** | **30** | **27** |

---

## 5. Recommendation: Direction A "Ledger Grid", with two borrowed signatures

**Recommend A,** set in **Geist + Geist Mono** with the palette below.

| Light | Hex | Dark | Hex |
|---|---|---|---|
| canvas | `#FAFAF9` | canvas | `#0C0F10` |
| surface | `#FFFFFF` | surface | `#14181A` |
| text | `#0F1416` | text | `#ECEFEE` |
| text-secondary | `#4A5458` | text-secondary | `#A9B2B5` |
| text-tertiary | `#636D71` | text-tertiary | `#87929A` |
| accent (Petrol) | `#0E6470` | accent | `#5CBAC6` |
| success | `#1E7A46` | success | `#4CC38A` |
| warning | `#995700` | warning | `#E2A23B` |
| danger | `#B42318` | danger | `#F2786D` |
| info | `#2F5FB3` | info | `#7EA9F2` |
| reserve | `#2D3A40` | reserve | `#6E7A80` |
| obligations | `#B07018` | obligations | `#D9A441` |
| deployable | `#0E6470` | deployable | `#5CBAC6` |

### Rationale

1. **It best serves the core job.** Answering "how much can we safely deploy, and why?" needs exact figures, visible arithmetic and density. A puts the number and its derivation first on every surface (benchmarks 1, 3, 4 and 17).
2. **It carries the most trust per unit of effort.** It is calm because of alignment and restraint rather than art direction, which is how Stripe, Linear and Vercel earn credibility. That credibility transfers directly to finance buyers and to crypto-native operators.
3. **It is the most accessible and the most feasible.** It has zero contrast failures, the strongest color-vision separation, no drag-only controls, and conventional components. It ships quickly and scales through tokens.
4. **Its weakness can be fixed; B's and C's cannot.** A's only weak score is distinctiveness, and the borrowed signatures below address it. B's density gap and C's trust and feasibility gaps are structural.

### Borrow into A, rendered in A's visual language

- **From B: the position sentence.** Use it as the hero sub-line on the landing page and as the first line of every exported board report or PDF ("Of $42.8M, $18.0M is protected, $9.6M is owed, $15.2M can safely work."). Keep it in Geist; do not add a serif. Also take B's numbered "How we calculate this" notes on derived figures.
- **From C: the projected level chart.** Make it the signature *Liquidity runway* chart: a step chart of the projected balance over 90 days, with the reserve-floor reference line and obligation event ticks. Draw it with A's hairlines and petrol color, matte, with no brass and no console framing. This gives TokenIQ an ownable chart without C's risks.

### Starter tokens for A (CSS)

```css
:root {
  --font-sans: "Geist", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
  --canvas:#FAFAF9; --surface:#FFFFFF; --sunken:#F2F3F2; --hairline:#E3E5E4; --border-strong:#8A9396;
  --text:#0F1416; --text-2:#4A5458; --text-3:#636D71;
  --accent:#0E6470; --accent-subtle:#E4F1F2; --on-accent:#FFFFFF;
  --success:#1E7A46; --warning:#995700; --danger:#B42318; --info:#2F5FB3;
  --bucket-reserve:#2D3A40; --bucket-obligations:#B07018; --bucket-deployable:#0E6470;
  --radius-chip:4px; --radius-control:6px; --radius-card:8px; --radius-sheet:12px;
  --dur-fast:120ms; --dur-base:200ms; --dur-slow:280ms;
  --ease-out:cubic-bezier(0.2,0,0,1); --ease-in-out:cubic-bezier(0.4,0,0.2,1);
  color-scheme: light;
}
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {
  --canvas:#0C0F10; --surface:#14181A; --sunken:#1B2023; --hairline:#262C30; --border-strong:#5F6A70;
  --text:#ECEFEE; --text-2:#A9B2B5; --text-3:#87929A;
  --accent:#5CBAC6; --accent-subtle:#123A40; --on-accent:#062A2F;
  --success:#4CC38A; --warning:#E2A23B; --danger:#F2786D; --info:#7EA9F2;
  --bucket-reserve:#6E7A80; --bucket-obligations:#D9A441; --bucket-deployable:#5CBAC6;
  color-scheme: dark;
}}
:root[data-theme="dark"] { /* same values as the dark block above */ }
@media (prefers-reduced-motion: reduce) { :root { --dur-fast:0ms; --dur-base:0ms; --dur-slow:0ms; } }
[data-numeric], .num, td.num, input[inputmode="decimal"] { font-variant-numeric: tabular-nums; }
```

---

## 6. Accessibility verification

### 6.1 WCAG 2.2 AA contrast for the proposed text and background pairs

- **Method.** WCAG 2.x relative luminance, contrast = (L1 + 0.05) / (L2 + 0.05).
- **Thresholds.**
  - 1.4.3: 4.5:1 for normal text and 3:1 for large text (≥24px, or ≥18.66px bold).
  - 1.4.11: 3:1 for meaningful non-text elements (input borders, focus rings, chart and bucket fills).
- **Result:** **92 of 92 listed pairs pass.**
- **Spot checks outside the tables:** A dark accent on `accent-subtle` (`#5CBAC6` on `#123A40`) is 5.45:1, and text-primary on it is 10.64:1. C light tertiary on `raised` (`#646D76` on `#EEF0F2`) is 4.61:1.
- **Two usage restrictions** follow from failures we found while tuning:
  - A's ochre obligations fill (`#B07018`) measures 4.06:1 on white, and C's light surplus fill (`#B07F22`) measures 3.56:1. Both are **fill-only**: their labels use `text-primary` or the darker ink tokens.
  - Adjacent bucket segments may fall below 3:1 against each other (for example A light obligations against deployable is 1.68:1). They are therefore always separated by a 2px gap in the surface color, and they differ in pattern (hatched, ticked, solid) and in direct labels. WCAG 1.4.11 is satisfied against the background, and meaning never depends on segment-to-segment contrast.

**A Ledger Grid: light**

| Pair | Foreground | Background | Ratio | Needs | Result |
|---|---|---|---|---|---|
| Text primary on canvas | `#0F1416` | `#FAFAF9` | 17.76:1 | 4.5:1 (text) | Pass |
| Text primary on surface | `#0F1416` | `#FFFFFF` | 18.55:1 | 4.5:1 (text) | Pass |
| Text secondary on canvas | `#4A5458` | `#FAFAF9` | 7.45:1 | 4.5:1 (text) | Pass |
| Text tertiary on canvas | `#636D71` | `#FAFAF9` | 5.08:1 | 4.5:1 (text) | Pass |
| Text tertiary on sunken | `#636D71` | `#F2F3F2` | 4.77:1 | 4.5:1 (text) | Pass |
| Accent (link/label) on canvas | `#0E6470` | `#FAFAF9` | 6.54:1 | 4.5:1 (text) | Pass |
| On-accent (button label) on accent | `#FFFFFF` | `#0E6470` | 6.83:1 | 4.5:1 (text) | Pass |
| Accent on accent-subtle (selected row) | `#0E6470` | `#E4F1F2` | 5.91:1 | 4.5:1 (text) | Pass |
| Success text on surface | `#1E7A46` | `#FFFFFF` | 5.35:1 | 4.5:1 (text) | Pass |
| Warning text on surface | `#995700` | `#FFFFFF` | 5.65:1 | 4.5:1 (text) | Pass |
| Warning text on warning-subtle | `#995700` | `#FDF3E3` | 5.14:1 | 4.5:1 (text) | Pass |
| Danger text on surface | `#B42318` | `#FFFFFF` | 6.57:1 | 4.5:1 (text) | Pass |
| Danger text on danger-subtle | `#B42318` | `#FDECEA` | 5.75:1 | 4.5:1 (text) | Pass |
| Info text on surface | `#2F5FB3` | `#FFFFFF` | 6.16:1 | 4.5:1 (text) | Pass |
| Input border on surface | `#8A9396` | `#FFFFFF` | 3.14:1 | 3.0:1 (non-text) | Pass |
| Focus ring on canvas | `#0E6470` | `#FAFAF9` | 6.54:1 | 3.0:1 (non-text) | Pass |
| Bucket: reserve fill on surface | `#2D3A40` | `#FFFFFF` | 11.73:1 | 3.0:1 (non-text) | Pass |
| Bucket: obligations fill on surface | `#B07018` | `#FFFFFF` | 4.06:1 | 3.0:1 (non-text) | Pass |
| Bucket: surplus fill on surface | `#0E6470` | `#FFFFFF` | 6.83:1 | 3.0:1 (non-text) | Pass |

**A Ledger Grid: dark**

| Pair | Foreground | Background | Ratio | Needs | Result |
|---|---|---|---|---|---|
| Text primary on canvas | `#ECEFEE` | `#0C0F10` | 16.63:1 | 4.5:1 (text) | Pass |
| Text primary on surface | `#ECEFEE` | `#14181A` | 15.44:1 | 4.5:1 (text) | Pass |
| Text secondary on surface | `#A9B2B5` | `#14181A` | 8.27:1 | 4.5:1 (text) | Pass |
| Text tertiary on surface | `#87929A` | `#14181A` | 5.62:1 | 4.5:1 (text) | Pass |
| Text tertiary on raised | `#87929A` | `#1B2023` | 5.17:1 | 4.5:1 (text) | Pass |
| Accent on surface | `#5CBAC6` | `#14181A` | 7.91:1 | 4.5:1 (text) | Pass |
| On-accent on accent | `#062A2F` | `#5CBAC6` | 6.73:1 | 4.5:1 (text) | Pass |
| Success on surface | `#4CC38A` | `#14181A` | 8.07:1 | 4.5:1 (text) | Pass |
| Warning on surface | `#E2A23B` | `#14181A` | 8.05:1 | 4.5:1 (text) | Pass |
| Danger on surface | `#F2786D` | `#14181A` | 6.54:1 | 4.5:1 (text) | Pass |
| Info on surface | `#7EA9F2` | `#14181A` | 7.53:1 | 4.5:1 (text) | Pass |
| Input border on surface | `#5F6A70` | `#14181A` | 3.22:1 | 3.0:1 (non-text) | Pass |
| Focus ring on canvas | `#5CBAC6` | `#0C0F10` | 8.52:1 | 3.0:1 (non-text) | Pass |
| Bucket: reserve fill on surface | `#6E7A80` | `#14181A` | 4.05:1 | 3.0:1 (non-text) | Pass |
| Bucket: obligations fill on surface | `#D9A441` | `#14181A` | 7.94:1 | 3.0:1 (non-text) | Pass |
| Bucket: surplus fill on surface | `#5CBAC6` | `#14181A` | 7.91:1 | 3.0:1 (non-text) | Pass |

**B Annual Report: light**

| Pair | Foreground | Background | Ratio | Needs | Result |
|---|---|---|---|---|---|
| Ink on paper | `#1B1A17` | `#F6F3EC` | 15.70:1 | 4.5:1 (text) | Pass |
| Ink on sheet | `#1B1A17` | `#FFFDF8` | 17.12:1 | 4.5:1 (text) | Pass |
| Secondary on paper | `#57524A` | `#F6F3EC` | 6.99:1 | 4.5:1 (text) | Pass |
| Tertiary (footnotes) on paper | `#6A645A` | `#F6F3EC` | 5.29:1 | 4.5:1 (text) | Pass |
| Accent (Prussian) on paper | `#1F3F6B` | `#F6F3EC` | 9.56:1 | 4.5:1 (text) | Pass |
| On-accent on accent | `#FFFFFF` | `#1F3F6B` | 10.60:1 | 4.5:1 (text) | Pass |
| Success on sheet | `#2C6B3F` | `#FFFDF8` | 6.29:1 | 4.5:1 (text) | Pass |
| Warning on sheet | `#8F5300` | `#FFFDF8` | 6.07:1 | 4.5:1 (text) | Pass |
| Danger on sheet | `#A3261B` | `#FFFDF8` | 7.25:1 | 4.5:1 (text) | Pass |
| Info on sheet | `#2F5F8F` | `#FFFDF8` | 6.55:1 | 4.5:1 (text) | Pass |
| Input rule on sheet | `#8C857A` | `#FFFDF8` | 3.59:1 | 3.0:1 (non-text) | Pass |
| Bucket: reserve on sheet | `#1F3F6B` | `#FFFDF8` | 10.42:1 | 3.0:1 (non-text) | Pass |
| Bucket: obligations on sheet | `#A0522D` | `#FFFDF8` | 5.52:1 | 3.0:1 (non-text) | Pass |
| Bucket: surplus on sheet | `#3D6B5A` | `#FFFDF8` | 5.99:1 | 3.0:1 (non-text) | Pass |

**B Annual Report: dark**

| Pair | Foreground | Background | Ratio | Needs | Result |
|---|---|---|---|---|---|
| Ink on bg | `#EEE9DF` | `#141310` | 15.35:1 | 4.5:1 (text) | Pass |
| Ink on sheet | `#EEE9DF` | `#1C1A16` | 14.36:1 | 4.5:1 (text) | Pass |
| Secondary on sheet | `#B5AEA2` | `#1C1A16` | 7.89:1 | 4.5:1 (text) | Pass |
| Tertiary on sheet | `#958E83` | `#1C1A16` | 5.36:1 | 4.5:1 (text) | Pass |
| Accent on sheet | `#9DB8E3` | `#1C1A16` | 8.60:1 | 4.5:1 (text) | Pass |
| On-accent on accent | `#0F1E33` | `#9DB8E3` | 8.29:1 | 4.5:1 (text) | Pass |
| Success on sheet | `#7CC49A` | `#1C1A16` | 8.45:1 | 4.5:1 (text) | Pass |
| Warning on sheet | `#E0A85A` | `#1C1A16` | 8.21:1 | 4.5:1 (text) | Pass |
| Danger on sheet | `#F08A7E` | `#1C1A16` | 7.15:1 | 4.5:1 (text) | Pass |
| Info on sheet | `#8FC1E8` | `#1C1A16` | 9.07:1 | 4.5:1 (text) | Pass |
| Input rule on sheet | `#6B655B` | `#1C1A16` | 3.01:1 | 3.0:1 (non-text) | Pass |
| Bucket: reserve on sheet | `#7E9ED6` | `#1C1A16` | 6.41:1 | 3.0:1 (non-text) | Pass |
| Bucket: obligations on sheet | `#D98E63` | `#1C1A16` | 6.62:1 | 3.0:1 (non-text) | Pass |
| Bucket: surplus on sheet | `#9CCB9E` | `#1C1A16` | 9.47:1 | 3.0:1 (non-text) | Pass |

**C Reservoir: dark (default)**

| Pair | Foreground | Background | Ratio | Needs | Result |
|---|---|---|---|---|---|
| Text primary on bg | `#E8EAEC` | `#0E1012` | 15.81:1 | 4.5:1 (text) | Pass |
| Text primary on surface | `#E8EAEC` | `#15181B` | 14.78:1 | 4.5:1 (text) | Pass |
| Secondary on surface | `#A3AAB1` | `#15181B` | 7.59:1 | 4.5:1 (text) | Pass |
| Tertiary on surface | `#868E96` | `#15181B` | 5.37:1 | 4.5:1 (text) | Pass |
| Tertiary on raised | `#868E96` | `#1C2024` | 4.93:1 | 4.5:1 (text) | Pass |
| Accent (brass) on surface | `#D2A857` | `#15181B` | 8.04:1 | 4.5:1 (text) | Pass |
| On-accent on brass | `#1A1408` | `#D2A857` | 8.26:1 | 4.5:1 (text) | Pass |
| Success on surface | `#5FBF8F` | `#15181B` | 7.92:1 | 4.5:1 (text) | Pass |
| Warning (tangerine) on surface | `#F08C4A` | `#15181B` | 7.26:1 | 4.5:1 (text) | Pass |
| Danger on surface | `#F0716A` | `#15181B` | 6.17:1 | 4.5:1 (text) | Pass |
| Info on surface | `#78A9E0` | `#15181B` | 7.26:1 | 4.5:1 (text) | Pass |
| Input border on surface | `#656E77` | `#15181B` | 3.44:1 | 3.0:1 (non-text) | Pass |
| Bucket: reserve on surface | `#4E6B8A` | `#15181B` | 3.22:1 | 3.0:1 (non-text) | Pass |
| Bucket: obligations on surface | `#7E9AB6` | `#15181B` | 6.10:1 | 3.0:1 (non-text) | Pass |
| Bucket: surplus on surface | `#D2A857` | `#15181B` | 8.04:1 | 3.0:1 (non-text) | Pass |

**C Reservoir: light**

| Pair | Foreground | Background | Ratio | Needs | Result |
|---|---|---|---|---|---|
| Text primary on bg | `#121518` | `#F4F5F6` | 16.78:1 | 4.5:1 (text) | Pass |
| Secondary on bg | `#4B535B` | `#F4F5F6` | 7.16:1 | 4.5:1 (text) | Pass |
| Tertiary on bg | `#646D76` | `#F4F5F6` | 4.82:1 | 4.5:1 (text) | Pass |
| Tertiary on surface | `#646D76` | `#FFFFFF` | 5.26:1 | 4.5:1 (text) | Pass |
| Accent (brass ink) on surface | `#85611A` | `#FFFFFF` | 5.64:1 | 4.5:1 (text) | Pass |
| On-accent on brass ink | `#FFFFFF` | `#85611A` | 5.64:1 | 4.5:1 (text) | Pass |
| Success on surface | `#1F7A4D` | `#FFFFFF` | 5.32:1 | 4.5:1 (text) | Pass |
| Warning on surface | `#A3470C` | `#FFFFFF` | 6.06:1 | 4.5:1 (text) | Pass |
| Danger on surface | `#B3261E` | `#FFFFFF` | 6.54:1 | 4.5:1 (text) | Pass |
| Info on surface | `#2B5E9E` | `#FFFFFF` | 6.57:1 | 4.5:1 (text) | Pass |
| Input border on surface | `#858E97` | `#FFFFFF` | 3.33:1 | 3.0:1 (non-text) | Pass |
| Bucket: reserve on surface | `#2F4A63` | `#FFFFFF` | 9.21:1 | 3.0:1 (non-text) | Pass |
| Bucket: obligations on surface | `#6A879F` | `#FFFFFF` | 3.76:1 | 3.0:1 (non-text) | Pass |
| Bucket: surplus on surface | `#B07F22` | `#FFFFFF` | 3.56:1 | 3.0:1 (non-text) | Pass |

**Reference: competitor pairs we measured.** These pairs tell us what to avoid; they are not TokenIQ colors.

| Pair | Ratio | Result |
|---|---|---|
| Safe secondary text `#636669` on `#121312` | 3.22:1 | Fails text AA |
| Uniswap pink `#FF007A` on white [S] | 3.80:1 | Fails text AA |
| Stripe muted copy `#64748D` on white | 4.75:1 | Pass |
| Linear tertiary `#8a8f98` on `#08090a` | 6.13:1 | Pass |
| Mercury CTA white on `#5266EB` | 4.71:1 | Pass |
| Wise `#163300` on `#9FE870` | 9.45:1 | Pass |

### 6.2 Color-vision-deficiency separation of the three bucket colors (benchmark 9)

- **Method.** We applied the Machado et al. (2009) severity-1.0 simulation matrices for protanopia, deuteranopia and tritanopia in linear RGB, then converted to CIELAB.
- **Measure.** The table reports the **minimum pairwise ΔE76** among Reserve, Obligations and Deployable. The target is 15 or more. Every direction meets it.

| Set | Normal | Protan | Deutan | Tritan |
|---|---|---|---|---|
| A light (`#2D3A40` / `#B07018` / `#0E6470`) | 22.9 | 17.5 | 17.0 | 24.3 |
| A dark (`#6E7A80` / `#D9A441` / `#5CBAC6`) | 30.9 | 23.2 | 22.2 | 39.6 |
| B light (`#1F3F6B` / `#A0522D` / `#3D6B5A`) | 44.3 | 23.8 | 35.5 | 15.7 |
| B dark (`#7E9ED6` / `#D98E63` / `#9CCB9E`) | 52.4 | 19.1 | 22.8 | 16.4 |
| C dark (`#4E6B8A` / `#7E9AB6` / `#D2A857`) | 18.5 | 18.3 | 18.6 | 18.3 |
| C light (`#2F4A63` / `#6A879F` / `#B07F22`) | 24.7 | 24.6 | 24.6 | 24.5 |

Earlier candidates that we **rejected** in this pass:

- A dark reserve `#8C9AA1`: protan ΔE was only 11.6.
- B dark surplus `#86BFA9`: tritan ΔE was only 8.9.
- C dark reserve `#4A6684`: 2.99:1 against the surface, failing 1.4.11.

### 6.3 Other WCAG 2.2 AA items each direction must meet (from benchmarks 12, 13 and 22)

- **2.4.11 Focus Not Obscured (Minimum).** Sticky headers and toasts never cover focused controls.
- **2.4.7 Focus Visible.** A 2px or thicker ring in the accent, which is at least 3:1 in every palette above.
- **2.5.7 Dragging Movements.** Every slider, scrubber or floor line has stepper or keyboard alternatives. This matters most for C.
- **2.5.8 Target Size (Minimum).** At least 24×24 CSS px everywhere. We target 44×44pt on touch.
- **3.3.8 Accessible Authentication (Minimum).** Approvals use passkeys or WebAuthn, with no cognitive tests and no transcription of codes.
- **3.2.6 Consistent Help.** A help or "How this is calculated" entry point appears in the same place on every page.
- **1.4.1 Use of Color.** Covered by benchmark 7 and by the bucket patterns.

---

## Appendix A: Contrast checker used (Python, for the CI token test)

```python
def lum(h):
    h = h.lstrip('#'); r, g, b = [int(h[i:i+2], 16) / 255 for i in (0, 2, 4)]
    f = lambda c: c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)

def contrast(a, b):
    la, lb = lum(a), lum(b); hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)   # text >= 4.5, large text / non-text >= 3.0
```

The scripts are in `scratchpad/research/`: `contrast.py`, `cvd.py`, and `final_pairs.txt` with the exact pair list.

## Appendix B: Font verification log ([T], 2026-10-11)

| Family | License (file) | `tnum` works? | Role eligibility |
|---|---|---|---|
| Geist | OFL 1.1 (google/fonts `ofl/geist/OFL.txt`; vercel.com/font "Licensed under OFL") | Yes | UI, display and numbers |
| Geist Mono | OFL 1.1 | Monospaced | Code, addresses |
| Inter | OFL 1.1 (rsms/inter LICENSE.txt) | Yes | UI and numbers (fallback option) |
| IBM Plex Sans | OFL 1.1, reserved name "Plex" | Tabular by default | UI and numbers |
| IBM Plex Mono | OFL 1.1, reserved name "Plex" | Monospaced | Code, addresses |
| Source Serif 4 | OFL 1.1, reserved name "Source" | Yes | Display, narrative, numbers |
| Instrument Sans | OFL 1.1 | Yes | UI, display and numbers |
| Instrument Serif | OFL 1.1 | **No** (67.5px drift) | Display words only, never figures |
| JetBrains Mono | OFL 1.1 | Monospaced | Readouts, code |
| Newsreader, Manrope, Public Sans | OFL 1.1 | Yes | Alternates |
| Fraunces | OFL | **No** (64.2px drift) | Not for figures |

"Drift" is the width difference between ten "0" and ten "1" digits at 32px with `tabular-nums` applied; 0px means true tabular figures.
