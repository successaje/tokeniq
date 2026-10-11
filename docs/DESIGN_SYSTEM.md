# TokenIQ design system ("Ledger Grid")

This document describes the visual and interaction system of the TokenIQ web app (`apps/web`) as it exists in code. The sources of truth are:

- `apps/web/src/app/globals.css`: every colour, radius, shadow, motion and utility token.
- `apps/web/src/components/ui/*`: the shared components.
- `apps/web/src/lib/format.ts`, `lib/buckets.ts`, `lib/theme.tsx` and `@tokeniq/core` `money.ts`: number, date and theme behaviour.

Research that led here is in `docs/research/design-benchmarks.md` (24 testable benchmarks) and `docs/research/design-directions.md` (three directions). Day-to-day rules for contributors are in `docs/contributing/frontend-conventions.md`.

Two labels are used throughout:

- **Enforced**: the code makes it happen (a token, a component that always renders something, a CSS rule, a type).
- **Convention**: a rule contributors follow. Nothing fails if it is broken.

If this document and the code disagree, the code wins. Section 13 lists the places where the code departs from what the research or the conventions file asks for.

---

## 1. Principles

TokenIQ shows treasury teams how much money they control, how much they owe, how much policy says must stay protected, and how much could be deployed. Every visual decision follows from four principles.

| Principle | What it means | How the code applies it |
|---|---|---|
| **Calm** | Nothing competes for attention it has not earned. No casino styling. | One accent colour. Hairline borders instead of boxes and shadows. Navigation text is dimmed to `text-2`. Motion is 120–280 ms with no bounce, and all of it turns off under reduced motion. No gradients, glow, glass or neon in product UI (one exception: section 13). |
| **Numerate** | Figures are the main content, and the arithmetic behind them is visible. | The Overview leads with one figure, "Safe to deploy now", followed by its derivation (`ReserveLedger`, "How this is calculated"). Numbers that must align use tabular figures. Tables right-align amounts. Charts carry direct labels and a table alternative. |
| **Trustworthy** | The interface never overstates certainty or progress. | Stale data looks stale (`Freshness`). Unknown is shown as unknown, never as zero. Watch-only accounts are labelled and excluded from reserve maths. Internal approval, Safe signatures and on-chain execution are separate steps with separate words. Sample data is labelled on every screen. |
| **Money is never ambiguous** | An amount always has an exact value, a unit and a context. | USD values travel as decimal strings and are formatted from integers (`bigint`), never floats. Compact figures (`$1.25M`) keep the exact value in the accessible name and tooltip. Converted values carry `≈`. Negative values use a true minus sign (U+2212). |

---

## 2. Selected direction: Ledger Grid

Three directions were explored in `docs/research/design-directions.md`:

| Direction | Idea | Score (of 40) |
|---|---|---|
| **A. Ledger Grid** | A precision instrument on a strict grid. Figures are the hero, hairlines replace boxes, and there is one accent (petrol). | **37** |
| B. Annual Report | A typeset, footnoted financial statement (serif plus sans, paper tones). | 30 |
| C. Reservoir | Liquidity as levels in a reservoir, on a dark instrument console. | 27 |

Ledger Grid was selected because:

1. It serves the core question ("how much can we safely deploy, and why?") with an exact figure and visible arithmetic on every surface.
2. It earns trust through alignment and restraint rather than art direction.
3. It had the best accessibility and feasibility scores: conventional components, no drag-only controls, and a token ladder that scales to new modules.
4. Its one weak score (distinctiveness) could be fixed. B's density problem and C's trust and feasibility problems were structural.

Two ideas were borrowed from the other directions and drawn in Ledger Grid's language:

- **From B, the position sentence.** It appears on the Overview, in the onboarding summary and as the first line of the printable snapshot: "Of $X tracked, $Y is protected by policy, $Z is owed in the next N days, and $W could be deployed."
- **From C, the projected level chart.** `ProjectionChart` draws a step line of the projected liquid balance, the policy floor as a labelled dashed line, and payments as ticks on the time axis.

The implementation departs from the research palette in a few places. The bucket colours were changed (section 3.4). The deployable colour is no longer equal to the accent. The dark `sunken` token is darker than the research value. The mobile tab bar differs from the research layout (section 9.9). `globals.css` holds the shipped values.

---

## 3. Colour

### 3.1 How tokens are defined

- Raw values are CSS custom properties on `:root` in `globals.css`.
- The dark palette is applied in two ways:
  - when `<html data-theme="dark">` is set;
  - when the operating system prefers dark and `data-theme` is not `light`.
- Tailwind v4 maps the raw values to utilities through `@theme inline`. For example, `--canvas` becomes `bg-canvas`, `--text-2` becomes `text-text-2`, `--bucket-reserve` becomes `bg-reserve`, and `--border-strong` becomes `border-border-strong`.
- A custom variant `dark:` matches `[data-theme="dark"]` and its descendants.

### 3.2 Surfaces, text and accent

| Token | Tailwind name | Light | Dark | Use |
|---|---|---|---|---|
| `--canvas` | `canvas` | `#fafaf9` | `#0c0f10` | Page background, sidebar, top bar, mobile tab bar. Also the `theme-color` meta value. |
| `--surface` | `surface` | `#ffffff` | `#14181a` | Cards, tables, inputs, secondary buttons. |
| `--sunken` | `sunken` | `#f2f3f2` | `#101315` | Wells (the calculation ledger, Safe transaction box), row hover, segmented-control track, neutral badges, skeleton base, the "held liquid" bucket. |
| `--raised` | `raised` | `#ffffff` | `#1b2023` | Floating layers: dialogs, sheets, menus, select popovers, toasts, command palette. |
| `--hairline` | `hairline` | `#e3e5e4` | `#262c30` | Card borders and dividers. Decorative: it is never the only boundary of an interactive control. |
| `--border-strong` | `border-strong` | `#8a9396` | `#5f6a70` | Meaningful outlines. Inputs use it at 50% opacity and at full strength on hover. Also the chart crosshair and the "held" swatch outline. |
| `--text` | `text` | `#0f1416` | `#ecefee` | Primary text and figures. Inverted as the tooltip background. |
| `--text-2` | `text-2` | `#4a5458` | `#a9b2b5` | Secondary text, labels, inactive navigation. |
| `--text-3` | `text-3` | `#636d71` | `#87929a` | Meta, timestamps, hints, axis labels, placeholders. |
| `--accent` | `accent` | `#0e6470` | `#5cbac6` | Petrol. Primary buttons, links, the active nav icon, selected states, the "current" step. |
| `--accent-hover` | `accent-hover` | `#0b5560` | `#74c6d0` | Primary button hover. |
| `--accent-subtle` | `accent-subtle` | `#e4f1f2` | `#123a40` | Active nav item, selected chips and radio cards, `::selection`, accent badges. |
| `--on-accent` | `on-accent` | `#ffffff` | `#062a2f` | Text and icons on `accent`. |
| `--focus` | (used as `var(--focus)`) | `#0e6470` | `#5cbac6` | Focus ring. Equal to the accent. |

The accent means "primary action" and, in product language, "deployable or actionable". It is never used for success, warning or danger meanings (convention). The `accent` badge tone marks states that are waiting for the reader: "Ready to execute", "Your review", "Owners to sign", and the selected role on an invitation. The hero "Could be deployed now" figure in the onboarding summary is set in `text-accent`.

### 3.3 Status colours

| Token | Light | Dark | Subtle (light / dark) | Use |
|---|---|---|---|---|
| `--success` | `#1e7a46` | `#4cc38a` | `#e7f4ec` / `#12301f` | Verified, covered, passed, executed, signed. |
| `--warning` | `#995700` | `#e2a23b` | `#fdf3e3` / `#332410` | Stale, thin, unverified, needs attention, the sample-workspace banner. |
| `--danger` | `#b42318` | `#f2786d` | `#fdeceb` / `#3a1714` | Shortfall, failed, rejected, destructive buttons, field errors. |
| `--info` | `#2f5fb3` | `#7ea9f2` | `#eaf0fb` / `#16233a` | In progress, informational callouts, "committed" or "invoiced" certainty. |

Status colours are never used for data series, and bucket colours are never used for status (convention, stated in `globals.css` and the conventions file). The `danger` button uses white text in light mode and a hard-coded `#1a0806` in dark mode.

### 3.4 Data-visualisation palette

The three bucket colours mean only "Protected reserve", "Upcoming obligations" and "Deployable surplus". Each one has a secondary, non-colour encoding that is always drawn with it.

| Token | Tailwind / utility | Light | Dark | Meaning | Secondary encoding |
|---|---|---|---|---|---|
| `--bucket-reserve` | `bg-reserve`, `.hatch-reserve` | `#475c6b` | `#7487a6` | Protected reserve | **Hatching**: 135° stripes of `rgb(255 255 255 / 0.22)`, 2 px on and 4 px off (`repeating-linear-gradient(135deg, … 0 2px, transparent 2px 6px)`). In charts, the policy floor is a 1.5 px dashed line (`5 4`) with a direct text label. |
| `--bucket-obligations` | `bg-obligations`, `.ticks-obligations` | `#b07018` | `#c08a30` | Upcoming obligations | **Tick segments**: a 1 px vertical line of `rgb(255 255 255 / 0.35)` every 10 px (`repeating-linear-gradient(90deg, transparent 0 9px, … 9px 10px)`). In charts, each payment is a 3×8 px tick on the time axis. |
| `--bucket-deployable` | `bg-deployable` | `#0e7c8a` | `#3fa2af` | Deployable surplus | **Solid fill**. In charts, the projected balance is a 2 px step line with a 10% area fill. |
| `--chart-grid` | `chart-grid` | `#eceeed` | `#1f2528` | Chart gridlines | 1 px horizontal lines only. |

Two more states appear in the allocation bar without a bucket colour:

- **Held liquid**: `bg-sunken` with a 1 px inset `--border-strong` ring. This is money that is not required but stays liquid because of the deployment cap or pending proposals.
- **Shortfall**: never drawn as a segment, because it is missing money, not held money. It is shown below the bar as a dashed `--danger` outline swatch and the text "Short by $X against the policy requirement".

Rules for the palette:

- **Adjacent segments are separated by a 2 px gap in the surface colour** (`gap-[2px] bg-surface` in `AllocationBar`). Segment-to-segment contrast is therefore never needed to tell them apart. Enforced.
- **Every segment has a text label.** The bar is a single `role="img"` whose accessible name lists every segment ("Allocation of $X reserve-eligible capital: Upcoming obligations $Y, 21.0%; …"). The legend repeats the label, compact value and share as visible text. Segments are not separate focus targets, because a thin segment could not meet the 24px target size. Pointer hover still highlights a segment. Enforced.
- **Under `forced-colors: active`**, the hatch and tick utilities set `forced-color-adjust: none`, so the patterns survive Windows High Contrast. Enforced.

### 3.5 Colour is never the only encoding

- Bucket identity is carried by pattern (hatch, ticks, solid), position and a text label. Hue comes last.
- Every status is icon plus text plus colour. `StatusBadge` always renders a label, and its icon comes from the tone unless explicitly removed. `Callout`, `PolicyCheckList`, `PaymentBadge`, `ProposalStatusBadge` and `VerificationStatus` all pair a word with an icon. Enforced by the components.
- Policy checks show a status word ("Pass", "Warning", "Fails") next to the icon.
- Freshness shows "· Stale" in text as well as turning the dot amber.
- Estimates use a dashed-border badge; committed and invoiced amounts use a solid one. Each has its own icon and word.

**Colour-vision-deficiency check.** The data-visualisation palette was checked with a colour-vision-deficiency validator. Its chroma and lightness-band exceptions are deliberate, because bucket identity rests on the secondary encodings above, not on hue.

The figures below were measured from the shipped token values for this document. The method is Machado et al. (2009) severity-1.0 simulation in linear RGB, then CIELAB D65 and ΔE76.

| Set | OKLCH L / C (reserve, obligations, deployable) | Min ΔE76: normal | Protan | Deutan | Tritan | Weakest pair under CVD |
|---|---|---|---|---|---|---|
| Light (`#475c6b` / `#b07018` / `#0e7c8a`) | 0.46/0.035, 0.60/0.124, 0.54/0.090 | 21.5 | 11.3 | 10.5 | 20.7 | reserve vs deployable |
| Dark (`#7487a6` / `#c08a30` / `#3fa2af`) | 0.62/0.052, 0.67/0.122, 0.66/0.092 | 25.9 | 10.0 | 4.8 | 24.6 | reserve vs deployable |

Reserve is deliberately a low-chroma slate. In dark mode the three colours sit in a narrow lightness band: obligations against deployable measures 1.01:1. Under red-green deficiencies, reserve and deployable come closer than the research target of ΔE76 ≥ 15 (benchmark 9). That is why reserve is always hatched and segments are always gapped and labelled. The values in the research document (`#2D3A40`, `#D9A441`, etc.) are earlier candidates, not the shipped palette.

### 3.6 Contrast (WCAG 2.x, measured from the token values)

| Pair | Light | Dark | Needed |
|---|---|---|---|
| `text` on `canvas` | 17.76:1 | 16.63:1 | 4.5:1 |
| `text` on `surface` | 18.55:1 | 15.44:1 | 4.5:1 |
| `text` on `raised` | 18.55:1 | 14.21:1 | 4.5:1 |
| `text-2` on `surface` | 7.78:1 | 8.27:1 | 4.5:1 |
| `text-3` on `canvas` | 5.08:1 | 6.05:1 | 4.5:1 |
| `text-3` on `sunken` | 4.77:1 | 5.87:1 | 4.5:1 |
| `text-3` on `raised` | 5.31:1 | 5.17:1 | 4.5:1 |
| `accent` on `surface` | 6.83:1 | 7.91:1 | 4.5:1 |
| `on-accent` on `accent` | 6.83:1 | 6.73:1 | 4.5:1 |
| `accent` on `accent-subtle` | 5.91:1 | 5.45:1 | 4.5:1 |
| `success` on `success-subtle` | 4.72:1 | 6.46:1 | 4.5:1 |
| `warning` on `warning-subtle` | 5.14:1 | 6.76:1 | 4.5:1 |
| `danger` on `danger-subtle` | 5.75:1 | 5.85:1 | 4.5:1 |
| `info` on `info-subtle` | 5.38:1 | 6.62:1 | 4.5:1 |
| Danger button label on `danger` | 6.57:1 (white) | 7.11:1 (`#1a0806`) | 4.5:1 |
| Tooltip (`canvas` on `text`) | 17.76:1 | 16.63:1 | 4.5:1 |
| `focus` on `canvas` | 6.54:1 | 8.52:1 | 3:1 |
| `border-strong` on `surface` | 3.14:1 | 3.22:1 | 3:1 |
| Input border (`border-strong` at 50% on `surface`) | 1.67:1 | 1.72:1 | 3:1 (see section 13) |
| Reserve fill on `surface` | 6.97:1 | 4.90:1 | 3:1 |
| Obligations fill on `surface` | 4.06:1 | 5.89:1 | 3:1 |
| Deployable fill on `surface` | 4.92:1 | 5.95:1 | 3:1 |

The obligations ochre measures 4.06:1 on white. That passes as a fill but is too low for small text, so obligation labels use `text` or `text-2`, never the bucket colour (convention).

### 3.7 Other colour tokens

| Token | Light | Dark | Use |
|---|---|---|---|
| `--overlay` | `rgb(15 20 22 / 0.4)` | `rgb(0 0 0 / 0.6)` | Backdrop behind dialogs, sheets and the command palette. |
| `color-scheme` | `light` | `dark` | Native form controls and scrollbars follow the theme. |

Raw hex values in components are not allowed (convention). The current exceptions are:

- the chain dots in `ChainLabel` (brand colours per network, decorative and `aria-hidden`; the network name is always printed);
- the dark danger-button text `#1a0806`;
- the print palette in `snapshot-view.tsx`;
- the PWA manifest and `theme-color` values, which copy the canvas tokens.

---

## 4. Typography

### 4.1 Families

- **Geist** for all UI and figures, and **Geist Mono** for machine identifiers. Both are loaded with `next/font/google` (latin subset, `display: swap`) in `app/layout.tsx` and exposed as `--font-geist` and `--font-geist-mono`.
- Fallback stacks:
  - sans: `ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif`;
  - mono: `ui-monospace, SFMono-Regular, Menlo, monospace`.
- The body sets `font-feature-settings: "ss01" 0`, `text-rendering: optimizeLegibility` and antialiasing.
- Weights in use are 400, 500 and 600 only. A search of the code finds no bold, light or thin weights.

### 4.2 Scale (as used in components)

There is no named type-scale token apart from `--text-2xs` (11px/16px), which is defined but unused. Sizes are Tailwind defaults or explicit pixel values. The ladder in use is:

| Role | Size / line height | Weight | Where |
|---|---|---|---|
| Hero figure ("Safe to deploy now") | 40px, 48px (`text-5xl`) from `sm`, leading 1.1, tracking −0.02em | 500 | Overview. Proportional figures (`tabular={false}`). |
| Proposal amount | 30px (`text-3xl`) | 500 | Approval detail. Proportional figures. |
| Page title (`h1`) | 22px/32px, 24px from `sm`, tracking −0.01em | 600 | `PageHeader`. |
| Auth and onboarding titles | 24px (`text-2xl`) | 600 | Sign-in, onboarding, invitation. |
| KPI value | 24px (`text-2xl`), tight tracking | 500 | `Stat`. |
| Sheet and dialog title | 16px | 600 | `Sheet`, `DialogContent`. |
| Card and section title (`h2`) | 15px/24px | 600 | `CardHeader`, `EmptyState` title. |
| Body | 14px (`text-sm`) | 400 | Paragraphs, callouts, menu items. |
| Navigation | 13.5px | 400; 500 when active | Sidebar `NavLink`. |
| Table cells, form labels, meta | 13px | 400; labels 500 | `Table`, `Field` label, descriptions. |
| Labels, badges, hints, errors | 12px (`text-xs`) | 500 for labels and badges | `StatusBadge`, `Field` hint and error, `Stat` label. |
| Micro labels | 11px | 500; group headings uppercase with +0.06em tracking | Nav group headings, select group labels, chart axes, tab counts. |
| Addresses and hashes | Geist Mono 12.5px (13px in inputs) | 400 | `AddressText`, `AddressInput`. |
| Marketing display | 32–64px, tracking −0.02 to −0.025em | 500 | Public site headings. |

### 4.3 Numeric conventions

**Tabular figures.** `font-variant-numeric: tabular-nums` applies to `.num`, `[data-numeric]`, `td.num` and `input[inputmode="decimal"]` (enforced in `globals.css`). These components apply it:

- `Money` (default `tabular`), `TokenAmount`, `Td numeric`, `AmountInput`, the `Stepper` output, tab counts, badges and chart axis text;
- large single figures opt out with `tabular={false}`, because proportional figures read better at display sizes.

**Right alignment.** Amount columns use `Th numeric` / `Td numeric`. `AmountInput` is right-aligned with the unit inside the field ("USD", "USD / mo", "EUR").

**Geist Mono** is for identifiers, not amounts:

- addresses and transaction hashes, the `safeTxHash` and Safe nonce;
- raw token base units and SHA-256 document fingerprints;
- error reference digests, the type-to-confirm phrase, `kbd` hints and the organization id.

**Money formatting** (`usd()` in `lib/format.ts` calls `formatUsd()` in `@tokeniq/core`):

| Case | Output | Rule |
|---|---|---|
| Full (default) | `$1,234,567.89` | Two decimals by default, thousands grouping. Used in tables, confirmations, ledgers and exports. |
| Compact | `$1.25M`, `$830K`, `$15.2M`, `$125M` | Only for values of $1,000 or more. K/M/B/T with 2, 1 or 0 fraction digits depending on magnitude, trailing zeros trimmed. Smaller values print in full. Used in KPI tiles, legends, chart labels and the position sentence. |
| Negative | `−$1,250.00` | U+2212 minus, and only when a non-zero digit is shown (no `−$0.00`). |
| Signed delta | `+$1,250.00` / `−$1,250.00` | `signed: true` adds `+` to positive values. |
| Missing | `—` | `null`, empty or unparseable input renders an em dash, never `$0.00`. |
| Approximate | `≈ $10,260.00` | `<Money approximate>` prefixes `≈` and says "approximately" in the accessible name. Used for converted values such as EUR obligations shown in USD. |

Other rules for amounts:

- `<Money>` always puts the full value in visually hidden text for screen readers. With `compact` or `source`, it also goes in the `title` tooltip, together with the source.
- **Non-USD amounts**: `TokenAmount` shows a raw integer amount with its decimals and symbol ("1,250.00 USDC"), with at most 2 fraction digits by default. The Balances page allows up to 6 for non-stablecoins. EUR obligation amounts use `amountLabel()` (`€9,500.00`).
  - These go through `formatDecimal`, which uses an ASCII hyphen for negatives. Only `formatUsd` uses U+2212.
- **Units**: hero USD figures are captioned "USD equivalent". Raw amounts are captioned "N base units". Percentages come from basis points through `pct()` (`512` → `5.12%`).
- **Never float** (convention, with helpers that make it easy):
  - Money arrives from the API as decimal strings. It is parsed into 18-decimal `bigint`s (`parseDecimal`) for arithmetic and comparison (`cmpUsd`, `isPositive`, `sharePct`).
  - `AmountInput` accepts only `^\d*(\.\d*)?$`, strips commas, and limits decimals (2 by default), so values reach the API exactly as typed.
  - Floats appear only in chart geometry (`ProjectionChart`) and layout percentages.

**Dates and times:**

- `dateLabel()` formats calendar dates in UTC ("Oct 11, 2026").
- `dateTimeLabel()` uses the viewer's time zone and prints the zone name.
- `relativeTime()` returns "just now" under 45 seconds, then minutes, hours, days (under 30) and months.
- `<Timestamp>` shows relative time, with the absolute time in its `title` and `dateTime`.

**Addresses and hashes**:

- `shortAddress()` gives `0x1234…abcd` (the first 6 characters including `0x`, and the last 4). It is always paired with a copy button and an optional explorer link.
- Screens where a value must be compared with a wallet or hardware device print it in full with `AddressText full`. This covers Safe owners, connected wallets, Safe transaction review and execution hashes. Full values are split into 4-character groups using margins, not spaces, so copying yields the exact value.
- `AddressInput` shows the checksummed form under the field.

---

## 5. Spacing, layout, radii and elevation

### 5.1 Spacing and layout

- Spacing uses Tailwind's 0.25rem scale. No custom spacing tokens.
- Cards pad 16px, or 20px from `sm`. Page gutters are 16px, or 24px from `sm`.
- **App shell:**
  - fixed 232px sidebar from `lg`;
  - 56px sticky top bar;
  - content up to 1440px wide, centred;
  - a 56px bottom tab bar under `lg`;
  - content bottom padding (`pb-28`) so the tab bar never covers it.
- **Overlays:**
  - `DialogContent` is a bottom sheet on phones (rounded top, up to 92dvh) and a centred dialog from `sm` (384px, 512px or 672px wide).
  - `Sheet` is full width on phones and a right-hand panel from `sm` (448px or 672px).
- Safe-area helpers (`.pt-safe`, `.pb-safe`) pad for notches in the installed PWA.
- Breakpoints are Tailwind defaults: `sm` 640, `md` 768, `lg` 1024 (sidebar appears), `xl` 1280.

### 5.2 Radii

| Token | Value | Use |
|---|---|---|
| `--radius-chip` | 4px | Badges, skeletons, small tags. |
| `--radius-control` | 6px | Buttons, inputs, selects, nav items, segmented track. |
| `--radius-card` | 8px | Cards, callouts, empty states, menus, toasts, popovers. |
| `--radius-sheet` | 12px | Dialogs, mobile bottom sheets, command palette. |

Inner elements use one pixel less than their container: 5px for menu items and segmented options, 3px for swatches and checkbox boxes. Pills, the switch and avatar initials are fully rounded.

### 5.3 Elevation

- Cards and tables are flat: a 1px `hairline` border and no shadow.
- Only floating layers get `--shadow-float`: dialogs, sheets, menus, select popovers, tooltips, toasts, the command palette, the skip link and chart tooltips.

| Token | Light | Dark |
|---|---|---|
| `--shadow-float` | `0 1px 2px rgb(15 20 22 / 0.06), 0 8px 24px rgb(15 20 22 / 0.08)` | `0 0 0 1px #262c30, 0 8px 24px rgb(0 0 0 / 0.5)` |

In dark mode the shadow carries a 1px hairline ring, because soft shadows disappear on dark canvases. The switch thumb uses Tailwind's `shadow-sm`. That is the only other shadow.

Stacking order: top bar 20, sidebar and tab bar 30, overlays 50, tooltips 60, toasts 100, skip link 200.

---

## 6. Motion

| Token | Value | Use |
|---|---|---|
| `--dur-fast` | 120ms | Hover and press colours, row hover, switch, chevrons, marketing figure crossfades. |
| `--dur-base` | 200ms | Allocation-bar re-flow (`flex-grow`), dialog and overlay entrance. |
| `--dur-slow` | 280ms | The highlight ring on a recommendation opened from a link. |
| `--ease-out` | `cubic-bezier(0.2, 0, 0, 1)` | Default curve. |
| `--ease-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` | Defined, currently unused. |

Keyframes in `globals.css`:

- `tq-fade-in` animates the backdrop (any `.fixed.inset-0[data-state="open"]`).
- `tq-rise-in` (8px rise plus fade) animates every `[role="dialog"][data-state="open"]`, including sheets and the command palette.
- `tq-slide-in` is defined but unused.
- There are no exit animations.

Other motion in use:

- **Skeleton shimmer**: 1.4s, infinite.
- **Spinners**: Tailwind `animate-spin`.
- **Marketing figures**: `mk-fade-in` and `mk-fade-out` crossfade figures over 120ms.

Rules:

- Animate only opacity, transform, colour and `flex-grow`. Never `transition: all`. The components follow this (convention).
- No springs, overshoot or bounce. Numbers never roll: a changed figure updates in place or crossfades (marketing `Crossfade`).
- Charts do not draw in. They appear when their data is ready.

**Reduced motion.** Under `prefers-reduced-motion: reduce` (enforced globally):

- the three duration tokens become `0ms`;
- every animation and transition is forced to `0.01ms` with one iteration;
- `scroll-behavior` becomes `auto`.

So skeletons stop shimmering, spinners stop spinning and dialogs appear instantly. Settings → Preferences says this in plain words.

---

## 7. Theming

- **Three preferences**: Light, Dark and System (follow the operating system).
- **Storage**: `localStorage` key `tokeniq-theme`, per browser. Nothing is stored on the server.
- **No flash**: `themeScript` is inlined in `<head>`, so it runs before paint. It reads the stored preference, resolves "system" with `matchMedia`, and sets `data-theme` on `<html>`. `global-error.tsx` inlines the same script, because it replaces the root layout.
- **Runtime**: `ThemeProvider` (`lib/theme.tsx`) exposes `{ pref, resolved, setPref }`. While the preference is "system", it re-applies the theme when the operating system setting changes.
- **Where people switch**:
  - the account menu in the app shell (Light, Dark, System);
  - Settings → Preferences ("Match system");
  - the `ThemeSwitch` segmented control on the public site.
- **CSS**: dark values apply when `data-theme="dark"`, or when the system prefers dark and `data-theme` is not `light`. Without JavaScript the page still follows the system.
- **Platform colours**: the `theme-color` meta is `#fafaf9` (light) and `#0c0f10` (dark). The PWA manifest uses `#fafaf9` for both `theme_color` and `background_color`.
- **Print**: the snapshot report forces a light print palette for surfaces, text, accent and status tokens. Bucket and chart tokens are not overridden (section 13).

---

## 8. Components catalogue

All shared components live in `apps/web/src/components/ui/`. They are built on Radix primitives (`radix-ui`) where interaction semantics matter. Icons are `lucide-react`, `aria-hidden` when decorative.

### 8.1 Actions

| Component | Purpose | Key props / variants | Accessibility |
|---|---|---|---|
| `Button` | Every clickable action. | `variant`: `primary`, `secondary`, `ghost`, `danger`, `link`. `size`: `sm` (32px), `md` (36px), `lg` (44px), `icon` (36px). `loading` and `loadingLabel`. `asChild` renders a link with button styling. | Defaults to `type="button"`. While loading it is disabled, sets `aria-busy` and shows a spinner named by `loadingLabel` (default "Working"). Visible 2px focus outline. |
| `Spinner` | Inline progress indicator inside buttons. | `label` | `role="img"` with an `aria-label`. Stops spinning under reduced motion. |

### 8.2 Forms

| Component | Purpose | Key props / variants | Accessibility |
|---|---|---|---|
| `Field` | Label, control, hint and error. | `label`, `hint`, `error`, `optional`. A render prop receives `{ id, aria-describedby, aria-invalid }`. | The label is tied to the control. The hint and error are referenced by `aria-describedby`. The error has `role="alert"`. "Optional" is marked; required is the default. |
| `Input` / `Textarea` | Text entry. | Shares `inputClass` (36px high, 6px radius). | Visible focus ring and `aria-invalid` red border. |
| `AmountInput` | Money entry that only holds a plain decimal string. | `value`, `onChange`, `unit` (default "USD"), `maxDecimals` (default 2). `normalizeAmountInput()` is exported. | `inputmode="decimal"`, tabular figures, right-aligned. Commas are accepted only as thousands separators ("1,234.50"). Input that would change meaning is rejected rather than reinterpreted: a decimal comma ("1,5"), letters, or too many decimals. |
| `AddressInput` | 0x address entry. | `value`, `onChange`. Exports `isValidAddress()`. | Mono font, spellcheck and autocapitalise off. After blur it explains why an address is invalid (wrong length, or a mixed-case checksum mismatch). Shows the checksummed form underneath. |
| `Select` | One choice from a list. | `options` with `hint`, `placeholder`. | Radix Select: keyboard typeahead, arrow keys, checkmark indicator. |
| `GroupedSelect` | `Select` with labelled groups (for example networks and testnets). | `groups` with `label` and `options`; options may be `disabled`. | Same as `Select`. Group labels are announced. |
| `Segmented` | Single choice among 2–5 short options. | `options`, `label`, `size` `sm` (28px) or `md` (32px). | Radix RadioGroup: one tab stop, arrow keys move. `label` is the group name. |
| `RadioCards` | Choice where each option needs a sentence (policy presets). | `options` with `description`, `icon`, `disabled`, `disabledReason`; `columns` 1–3. | Radio-group semantics. Disabled options are skipped, and their reason is printed, not hidden in a tooltip. |
| `CheckboxChips` | Multi-select from a short list (networks, assets). | `value[]`, `options`, `label`. | Native checkboxes (Space toggles, each in the tab order) inside `role="group"`. Focus ring is drawn on the chip. |
| `Switch` | On/off setting. | `checked`, `onCheckedChange`, `disabled`. | Radix Switch (`role="switch"`). Pass `aria-label` or `aria-describedby`. |
| `Stepper` | Increment and decrement a number (runway months). A drag-free slider alternative (WCAG 2.5.7). | `value`, `min`, `max`, `step`, `label`, `format`, `size`. | `role="group"`, "Decrease …" and "Increase …" buttons, and a live `<output>`. At a bound the button stays focusable (`aria-disabled`) so focus is never dropped. |

### 8.3 Overlays

| Component | Purpose | Key props / variants | Accessibility |
|---|---|---|---|
| `Dialog` / `DialogContent` | Short tasks and confirmations. Bottom sheet on phones, centred from `sm`. | `title`, `description`, `footer`, `size` `sm`/`md`/`lg`. | Radix Dialog: focus trap, Esc closes, focus returns to the trigger. Always has a title and a description (a visually hidden one if none is given). The close button is labelled "Close". |
| `ConfirmDialog` | Confirmation for irreversible or financial actions. | `title`, `description`, `consequences`, `confirmLabel`, `tone` `primary`/`danger`, `loading`, `confirmText` (type-to-confirm), `confirmDisabled` (for example, a rejection without a reason). | With `confirmText` set, the confirm button stays disabled until the exact phrase is typed. The confirm label names the action ("Remove member", "Revoke invitation"). Type-to-confirm is currently used only for "Stop tracking" an account. |
| `Sheet` | Long forms and detail views in a side panel. | `title`, `description`, `footer`, `width` `md`/`lg`. | Radix Dialog semantics. The close button is labelled "Close panel". Footer buttons stack on phones. |
| `Menu`, `MenuContent`, `MenuItem`, `MenuLabel`, `MenuSeparator` | Dropdown actions (organization switcher, account menu, row actions, notifications). | `MenuItem` takes `tone="danger"` and `disabled`. | Radix DropdownMenu: arrow keys, typeahead, Esc. |
| `Tooltip` | Supplementary text only. | `content`, `side`. Delay 250ms. | Radix Tooltip on hover and focus. Never holds the only copy of important information (convention, stated in the component). |
| `Toast` (`useToast`) | Outcome of an action. | `tone`: `info`, `success`, `warning`, `danger`, `pending`. `id` replaces a toast with the same id. `action` (link or button). `duration`. | Radix Toast region. `danger` toasts are foreground (announced assertively) and stay 12s. Others stay 6s. `pending` toasts stay until replaced. At most 4 are shown. Placed bottom-right, and above the tab bar on phones, so they never cover the navigation. |

### 8.4 Feedback and states

| Component | Purpose | Key props / variants | Accessibility |
|---|---|---|---|
| `StatusBadge` | Compact status word. | `tone`: `success`, `warning`, `danger`, `info`, `neutral`, `accent`. `icon` (or `null` to omit). | The icon is decorative. The text carries the meaning. |
| `Callout` | Inline message with optional title and action. | `tone`, `title`, `action`. | `role="alert"` for `danger`, otherwise `role="status"`. |
| `QueryError` | A failed read. | `error`, `onRetry`, `title`. | A 403 becomes a warning: "Your role doesn't include this … Ask an owner or admin". Anything else becomes a danger callout with "Try again" and "Your data is unchanged." |
| `EmptyState` | A list or page with nothing in it yet. | `icon`, `title`, `description`, `actions`. | `h3` title. Says what will appear and how to make it appear. |
| `Skeleton` / `LoadingRegion` | Placeholders shaped like the final layout. | `className` sets the size. | Skeletons are `aria-hidden`. `LoadingRegion` is `role="status"` with `aria-busy` and a visually hidden label ("Loading proposals…"). |
| `PolicyCheckList` (+ `checkSummary`, `checkCounts`) | Results of the deterministic policy engine. | `checks`, `order` (failures first), `collapsePassing`. | Each row has an icon, a status word, a label and detail. Passing checks can sit behind a disclosure ("Show 12 passing checks"). |

### 8.5 Data display

| Component | Purpose | Key props / variants | Accessibility |
|---|---|---|---|
| `Money` | The only way to show a USD amount. | `value` (decimal string), `compact`, `decimals`, `signed`, `approximate`, `source`, `tabular`. | The visible text (including `≈`) is `aria-hidden`. A visually hidden text node carries "approximately $1,234,567.89, <source>". `title` holds the full value when the figure is compact or sourced. |
| `TokenAmount` | A token amount with its symbol. | `raw`, `decimals`, `symbol`, `maxFractionDigits`. | Plain text, tabular figures. |
| `Table`, `Th`, `Td`, `Tr` | Data tables. | `numeric` on `Th`/`Td` right-aligns and makes figures tabular. | `Th` is `scope="col"`. The table scrolls horizontally inside a wrapper. Header rows are 36px and body rows 44px. There is no density toggle. |
| `Card`, `CardHeader`, `CardBody`, `CardFooter`, `Stat` | Content grouping and KPI stacks. | `CardHeader` takes `title`, `description`, `action`, `id`. `Stat` takes `label`, `value`, `meta`. | `CardHeader` renders an `h2`. Pass `id` for `aria-labelledby`. |
| `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` | Underlined section tabs (Settings). | `TabsTrigger` takes `count`. `TabsList` takes `label`. | Radix Tabs with roving focus. The list is named by `label`. Triggers are 40px tall. |
| `PageHeader` | Page title, description, meta line and actions. | `title`, `description`, `meta`, `actions`. | Renders the page's single `h1`. |
| `Timestamp` | Relative time with an absolute fallback. | `at`, `absolute`, `prefix`. | `<time dateTime>`, with the absolute time in `title`. |

### 8.6 Identity

| Component | Purpose | Key props / variants | Accessibility |
|---|---|---|---|
| `AddressText` | An on-chain address or hash in mono, with copy and explorer buttons. Shortened by default. `full` prints the whole value as wrapping, selectable text in 4-character groups. | `address`, `explorer`, `full`, `kind` (`address` or `hash`). | The copy button and explorer link are 24px targets. The copy button's label is "Copy address 0x…" (or "Copy hash …"), then "Copied". A blocked clipboard fails silently; the value stays selectable. The explorer link is labelled "Open in block explorer". |
| `ChainLabel` | Network name with a coloured dot. | `chainId`, `name`. | The dot is `aria-hidden`. The name is always printed. |
| `Freshness` | "Synced 4 minutes ago", with an explicit stale state. | `at`, `staleAfterMinutes` (default 60), `label`. | Focusable (`tabIndex=0`) so the UTC tooltip is reachable by keyboard. Stale adds the text "· Stale". Missing data says "Not synced yet". |

### 8.7 Charts (`components/charts/`)

| Component | Purpose | Key props | Accessibility |
|---|---|---|---|
| `AllocationBar` (+ `BucketSwatch`) | A 100% bar of reserve-eligible capital split into upcoming obligations, protected reserve, deployable surplus and held liquid, with any shortfall shown below. | `buckets`, `total`, `shortfall`, `size` `md` (28px) or `lg` (44px), `highlighted` / `onHighlight`, `showLegend`. | One `role="img"` whose name lists every segment with its value and share. Segments are not focusable. Pointer hover dims the other segments and shows an `aria-hidden` tooltip. The legend is a labelled list carrying the same values as text. |
| `ProjectionChart` | Liquidity runway: the projected liquid balance as a step line, the policy floor as a dashed labelled line, and payments as axis ticks. | `points`, `floor`, `events`, `height`, `title`. | An SVG with `role="img"` and a generated text summary (start, lowest point, floor, and whether it crosses). Focusable: arrow keys move between points and Esc clears. "View as table" toggles a captioned data table. Below 2 points it shows "Not enough data to project yet." |
| `BalanceHistoryChart` (`components/app/treasury/`) | Daily stablecoin balance history on the Balances page. Each balance is carried forward from its last observation, and is absent (not zero) before the first one. | — | `role="img"` with a text summary (start, now, lowest, highest). "View as table" shows a captioned table. |

### 8.8 App-level shared components

| Component | Purpose |
|---|---|
| `CoverageBadge`, `UncertaintyBadge` (`components/app/coverage-badge.tsx`) | Reserve status ("Reserve covered · 120%", "Coverage thin", "Reserve short", "No requirement set"). Input completeness ("Inputs complete", "Some estimates", "Key inputs missing"). |
| `ReserveLedger` | "How this is calculated": the deployable figure as visible arithmetic (reserve-eligible − requirement − pending = available after the reserve, then the deployment cap). |
| `VerificationStatus`, `IncludedLabel` (`accounts/account-badges.tsx`) | Verified (by whom and when), Unverified ("Excluded from reserve maths"), or Sample. Counted or not counted in the treasury. |
| `ProposalStatusBadge` (`approvals/status.tsx`) | One label, tone and description for each of the 11 proposal statuses. |
| `PaymentBadge`, `PaymentStatusBadge`, `CertaintyBadge`, `PriorityLabel`, `ObligationStatusBadge` | Payment states (verified, waiting for confirmations, marked paid, skipped), obligation certainty, priority and status. |
| `SafeTxReviewPanel` and `verifySafeTx` / `verifyExecutionData` (`approvals/safe-tx-review.tsx`, `approvals/safe-tx.ts`) | An independent, client-side check of a prepared Safe transaction. It shows everything an owner should compare with their wallet: network, Safe, version, nonce, operation, target, ETH value, gas-refund fields, `safeTxHash`, domain hash, message hash, and each decoded call. Any failed check blocks signing and submission with a danger callout. |

### 8.9 Shell, brand, marketing and onboarding

| Component | Purpose | Notes |
|---|---|---|
| `AppShell` (`shell/app-shell.tsx`) | The authenticated frame. It loads `/api/v1/me`, sends people with no organization to onboarding, and provides `OrgProvider`. | Desktop sidebar (`aria-label="Primary"`) with the organization switcher and grouped navigation (Plan, Treasury, Decide, Monitor, then Team, Settings, Help). The sticky top bar holds search (⌘K), `Freshness`, notifications and the account menu. The mobile tab bar holds Overview, Obligations, Approvals, Copilot and More (a sheet with every section). Badges count proposals needing attention and open (unacknowledged) alerts of warning or critical severity. Each badge has a visually hidden ", N need attention". Notification links are followed only when they are in-app `/app` paths. `main` is keyed by organization, so switching organizations remounts the page and no page-local state carries over. A sample-workspace banner sits under the top bar. `ShellSkeleton` shows while the session is restored. |
| `nav.ts` | Navigation data: label, icon, description and badge source for every section. | It feeds the sidebar, the More sheet and the command palette. |
| `CommandPalette` | ⌘K / Ctrl+K: jump to any section or start a common task (record an obligation, add an account, run a stress scenario, ask the copilot, export a report). | A Radix Dialog with a `combobox` input, a `listbox` of options and `aria-activedescendant`. Arrow keys and Enter work. |
| `Logo`, `LogoMark` (`brand/logo.tsx`) | Three ledger lines of decreasing length (protected, committed, and the accent line free to work). | `aria-hidden` unless given a `title`. Error screens draw the mark with the top line missing. |
| Marketing (`components/marketing/*`) | Public site building blocks. | `SiteHeader`, `SiteFooter`, `Container`, `Section` (numbered ledger sections), `PageIntro`, `ThemeSwitch`. `TreasuryModel` is the hero instrument: the real `@tokeniq/core` engine on illustrative inputs, driven by steppers and a segmented control, with no drag-only controls. Also `Crossfade`, `LevelChart` (a server-rendered projection chart), `ExecutionStages` and `ProposalTracks` (three separate tracks), `Walkthrough` (keyboard tabs over labelled schematic screens), `ExampleVenueCard` (invented figures, labelled as such), `StatusBoard` (honest component states, with unknown never shown as operational), `DocsNav` and `DocsContent`, `LegalPage` (marked draft), and `ErrorScreen` (404, 403, error and offline). |
| Onboarding (`components/onboarding/*`) | The four-step setup. | `OnboardingStep` (resolves the organization, "Step N of 4", progress), `StepProgress` (four segments, completed steps are links), `StepActions` (back or skip on the left, primary on the right, primary first on phones), `EditOrganizationButton` (step 1 edits the existing organization instead of creating a duplicate), `TreasuryStep`, `ObligationsStep`, `PolicyStep` and `CompleteStep`. |

---

## 9. Data-display patterns

### 9.1 Freshness and staleness

Every balance-derived figure says how old it is:

- **The top bar** shows `Freshness` for the latest balance observation and turns stale after 60 minutes.
- **Overview, Reserves, Balances and Allocations** show `Freshness` in the page meta. Except on the Overview, the stale threshold is the policy's `maxDataAgeMinutes` (default 60). The Overview uses the component default of 60 minutes.
- **Balances → Sync status** lists each account's last sync, the latest price observation, and the latest venue data fetch (stale after 180 minutes).
- **Prices**: each price shows its source ("Chainlink USDC / USD on Base") and "Updated N ago". When the feed is older than its heartbeat allows, a "Stale" badge with a clock icon appears.

When data is incomplete, the engine reports issues and the UI says so plainly. On the Overview: "Some figures are incomplete … Recommendations are paused until data is complete."

### 9.2 Unknown is not zero

| Situation | Display |
|---|---|
| Missing or unparseable amount | `—` (never `$0.00`). |
| A holding without a price | "No price: excluded from totals" (warning badge). |
| A position whose venue does not report withdrawable liquidity | "Unknown" with a help icon, and a "Withdrawability unknown" KPI. |
| No monthly burn estimate | Runway shows `—` with "Add a monthly burn estimate" or "Burn unknown". |
| Days before TokenIQ started observing an account | Absent from history charts, not drawn as zero. |
| Never synced | "Not synced yet" in warning colour. |
| A system component never checked | "Unknown" on `/status`, never "Operational". |
| Coverage when no requirement is set | "No requirement set" (neutral). |

### 9.3 Verified versus watch-only accounts

- Added accounts are **watch-only**. TokenIQ reads balances and never holds keys.
- Until a member proves control by signing a challenge, the account shows "Unverified · Excluded from reserve maths". The Accounts page totals unverified value in a warning callout ("Unverified accounts hold ≈ $X that doesn't count").
- Verified accounts show "Verified by 0x12…ab on <date>".
- If the verifying signer stops being a Safe owner, the next sync revokes verification and the account returns to unverified.

### 9.4 Sample workspace labelling

Sample data is labelled at every level:

| Where | Label |
|---|---|
| Shell | An amber banner under the top bar on every screen: "Sample workspace — every balance, obligation and venue figure here is simulated. Nothing can be signed or executed." |
| Organization switcher | "Sample workspace" instead of a role, and "Sample" in the organization list. |
| Organization name | "Sample: Northwind Protocol". |
| Accounts | Labels end in "(sample)". A neutral "Sample" badge with a flask icon reads "Simulated, cannot be verified". |
| Prices | Source "Sample workspace (simulated $1.00)". The EUR rate source is "Sample workspace (simulated rate)". |
| Recommendations and proposals | A warning callout: proposals can be created and approved to see the flow, but nothing can be prepared, signed or executed. |

### 9.5 States of knowledge and progress

Words are chosen so that different states never read the same:

- **Obligations**: "Estimate" (dashed badge) ≠ "Committed" ≠ "Invoiced".
- **Payments**: "Verified on-chain · N confirmations" ≠ "Marked paid — N of M confirmations" ≠ "Marked paid — not verified" ≠ "Skipped".
- **Proposals**: "Approved internally" ≠ "Collecting signatures" ≠ "Ready to execute" ≠ "Submitted on-chain" ≠ "Executed". The approval detail page draws four numbered gates (Policy check, Internal approval, Safe owner signatures, On-chain execution) with the note: "Internal approval is not a Safe signature, and a signature is not an executed transaction."
- **Toasts after submitting a transaction**: first a `pending` toast, "Transaction sent … This is not success yet", then "Submitted, not executed yet". If recording fails, the warning reads "Sent, but not recorded in TokenIQ … Do not submit it a second time."

### 9.6 Explainability

- Derived figures carry their basis inline. For example: "Set by the runway rule", "At $85K per month (declared)", "Thin below 110%".
- `ReserveLedger` shows the full arithmetic.
- Every recommendation shows its trigger, evidence, policy checks, upside, downside, what could go wrong, alternatives and basis.
- The help page and `/docs/calculation-reference` explain every formula.

---

## 10. States

| State | Pattern | Rules |
|---|---|---|
| **Loading** | Skeletons that match the final layout, inside `LoadingRegion` or `role="status"` with a visually hidden label. The shell shows `ShellSkeleton` ("Restoring your session…"). | No full-page spinners (convention). Spinners appear only inside buttons (`loading`). Page sections load independently; the shell and navigation never wait. |
| **Empty** | `EmptyState` with an icon, a title saying what is missing ("No accounts yet", "Nothing waiting for approval") and a description saying what will appear and how. | Filtered-empty states are separate, with their own action ("No venues match these filters" and "Clear filters"). |
| **Error (read)** | `QueryError` or an inline `Callout` with "Try again". | A 403 is explained as a role limit, not an error. Other failures end with "Your data is unchanged." or "Nothing was changed." Reads are retried twice automatically on network errors or 5xx, never on 4xx. |
| **Error (write)** | Field errors from `validation_error` mapped onto `Field` (`fieldErrors()`). A general error in a danger `Callout` or toast. | Input is preserved after a failure. Mutations are never retried automatically (enforced in the query client). |
| **Session expired** | Any 401 sends the browser to `/login?next=<path>&reason=session`, which shows "Your session expired. Sign in again to continue where you left off." | The invitation page handles 401 itself, so invitees see an invitation-specific message instead. |
| **Route error** | `app/error.tsx`: "This page couldn't load." It shows the error reference (digest) and the time in UTC, never the raw server message. Actions: Try again, Home, Check status. | `global-error.tsx` is the last-resort boundary, with its own document, fonts and theme script. |
| **Not found / no access** | `not-found.tsx`: "This page isn't on the ledger." `/forbidden`: "You don't have access to this." | Both state that nothing about the treasury changed. |
| **Offline** | The service worker serves the precached `/offline` page when navigation fails: "You're offline … It doesn't show cached figures." In the app, `PwaClient` shows a banner: "You're offline. Figures shown may be out of date. Nothing can be approved, signed or saved until you reconnect." | The service worker never caches `/api/*` or navigations, so balances are always live. `PwaClient` sets `data-offline` on `<html>`, but no screen reads it yet. Actions stay enabled and fail with a network error, and nothing is queued. |
| **Unavailable feature** | A specific message per kill switch or missing configuration (for example, "The copilot isn't configured on this deployment", with links to where each figure lives). | — |

---

## 11. Content style

### 11.1 Voice

- Plain, direct and specific. Sentence case everywhere, including buttons and titles.
- No exclamation marks and no marketing adjectives in the product.
- Name the thing and the number: "Short by $12,400.00 against the policy requirement", not "Insufficient funds".
- Second person for the reader ("Your role can't add accounts"). TokenIQ refers to itself by name ("TokenIQ reads the address on-chain").
- Buttons name the action: "Record payment", "Prepare Safe transaction", "Sign as Safe owner", "Remove member", "Stop tracking". Avoid "OK" and "Submit" (convention).
- Say what TokenIQ cannot do where it matters for trust:
  - "TokenIQ never asks for private keys or seed phrases."
  - "Signing in with a wallet does not give TokenIQ access to it."
  - "Signing does not submit anything on-chain."
- Never call yields guaranteed or assets risk-free. APYs are "measured now; not a promise".

### 11.2 Errors

API errors carry a stable `code` and a `message` written for people. The UI shows the message, and adds what was not changed when the API did not say. Messages follow three parts: **what happened**, **what didn't happen**, **what to do**.

| Example (from code) | What happened | What didn't happen | What to do |
|---|---|---|---|
| "Couldn't read the address from Base right now (…). Nothing was added; try again shortly." | ✓ | ✓ | ✓ |
| "Another transaction used this Safe nonce first. Prepare the transaction again; earlier signatures no longer apply." | ✓ | ✓ | ✓ |
| "Simulation failed: <reason>. Nothing was signed or sent." | ✓ | ✓ | — |
| "You declined the signature request. Nothing was signed." | ✓ | ✓ | — |
| "The transaction reverted. No funds moved; gas was spent." | ✓ | ✓ | — |
| "Can't reach TokenIQ. Check your connection and try again." | ✓ | — | ✓ |
| Fallback for any 5xx: "TokenIQ had a problem completing this request. Nothing was changed unless stated otherwise." | ✓ | ✓ | — |
| 403 in a read: "Your role doesn't include this. Ask an owner or admin if you need access." | ✓ | — | ✓ |

Validation messages say what to enter, not what was wrong:

- "Enter a 0x address with 40 hexadecimal characters."
- "Enter the 6-digit code from the email."
- "Say why you are changing it (at least 3 characters). It is kept in the policy history."

### 11.3 Terms

| Term | Meaning (use exactly these words) |
|---|---|
| Protected reserve | The part of the policy requirement that is not upcoming obligations (runway or a fixed floor). |
| Upcoming obligations | Payments due within the policy horizon, plus the safety buffer. |
| Deployable surplus | What may be allocated to vetted venues, with approval. |
| Held liquid | Not required, but kept liquid by the deployment cap or pending proposals. |
| Reserve-eligible | Liquid stablecoins in verified, included accounts, after haircuts and valued at no more than $1. |
| Watch-only / Unverified | Tracked, but control is not proven, so it is excluded from reserve maths. |
| Internal approval | A decision recorded in TokenIQ. It is not a signature. |
| Safe signatures | Owners' cryptographic signatures, made in their own wallets. |
| On-chain execution | A submitted transaction that has been confirmed. "Submitted" is not "executed". |
| Sample workspace | A separate organization with simulated data that can never sign or execute. |

---

## 12. Accessibility commitments

The target is **WCAG 2.2 AA**. This is what the code does.

**Focus**

- A global `:focus-visible` style draws a 2px solid `--focus` outline with a 2px offset. Inputs use a 0 offset with a border-colour change. Overview KPI rows draw the ring on the whole row when their stretched link has focus.
- The focus colour measures 6.54:1 (light) and 8.52:1 (dark) on the canvas.
- Radix returns focus to the trigger when a dialog, sheet or menu closes.

**Not obscured (2.4.11)**

- Toasts sit bottom-right, and above the tab bar on phones.
- On the public site, `scroll-padding-top: 5rem` keeps the sticky header off focused elements.
- The app top bar is 56px and sticky. It has no `scroll-padding` (section 13).

**Keyboard**

- Every action is a native button, link or Radix control.
- ⌘K / Ctrl+K opens the command palette.
- Segmented controls, radio cards and tabs use arrow keys (roving focus).
- The projection chart is focusable and navigable with arrow keys.
- `Stepper` replaces drag interactions (2.5.7). There are no drag-only controls.

**Structure**

- A "Skip to content" link targets `#main` on every layout. `lang="en"`.
- One `h1` per page (`PageHeader`). Cards use `h2`.
- Landmarks: `aside`/`nav` labelled "Primary", `header`, `main`.
- Step progress uses `aria-current="step"`. Navigation uses `aria-current="page"`.

**Forms**

- Every input has a label.
- Hints and errors are linked through `aria-describedby`, and errors use `role="alert"`.
- "Optional" fields are marked.
- Input is preserved after errors.

**Status and colour**

- Status is icon plus text plus colour. Buckets carry patterns.
- Under `forced-colors`, the patterns are kept.

**Charts**

- Each chart has a text summary in its accessible name.
- The projection chart has a data-table alternative.

**Live regions**

- Loading regions are `role="status"`. Danger callouts are `role="alert"`.
- The stepper output, theme description and chart tooltip are polite live regions.

**Motion**

- All motion is removed under reduced motion (section 6).

**Target size (2.5.8)**

- Buttons are at least 32px tall and 28px for small segmented options. Onboarding primary actions and mobile row actions use 44px (`h-11`) or 40px on phones.
- Tab-bar items are 56px tall.
- Copy and explorer buttons in `AddressText` are 24px.
- The toast and offline-banner dismiss buttons are smaller (section 13).

**Authentication (3.3.8)**

- No passwords.
- Email codes autofill (`autocomplete="one-time-code"`). Passkeys and wallet signatures need no transcription.

**Help (3.2.6)**

- Help is in the same place on every app page (sidebar footer and the More sheet).
- Each figure's "How this is calculated" sits next to it.

---

## 13. Known deviations

These are places where the code does not yet match the rules above or the research targets. Uncommitted web changes were in progress at the time of writing. This list reflects the working tree, in which `Money` naming, `AddressText` target sizes, the allocation-bar semantics and the offline banner wording had already been fixed.

1. **Input borders are below 3:1.** Inputs, selects and the type-to-confirm field draw `border-strong` at 50% opacity (1.67:1 light, 1.72:1 dark against `surface`). The full-strength token passes (3.14:1 and 3.22:1) but is used only on hover. WCAG 1.4.11 asks for 3:1 for the boundary of an input.
2. **Bucket colours under red-green CVD.** Reserve against deployable measures ΔE76 11.3 (protan) and 10.5 (deutan) in light mode, and 10.0 and 4.8 in dark mode. This is below benchmark 9's target of 15. Meaning is carried by the hatching, gaps and labels, as section 3.5 describes. The shipped values also differ from the research palette, and `--bucket-deployable` is no longer equal to `--accent`.
3. **Small dismiss buttons.** The toast dismiss button and the offline-banner dismiss button are about 18px square (`p-0.5` around a 14px icon). Both sit alone in their row, so they likely rely on WCAG 2.5.8's spacing exception.
4. **App top bar uses `backdrop-blur-[2px]`.** The research and benchmark 20 ban backdrop blur in product UI.
5. **No global scroll padding under the sticky app top bar.** Some anchor targets (`#scenarios`, `#issues`, recommendations, help sections) use `scroll-mt-*`. The global `scroll-padding-top` exists only on the public site. Keyboard focus moving down a long app page can sit under the 56px header (2.4.11).
6. **Unused tokens.** `--text-2xs`, `--ease-in-out` and `tq-slide-in` are defined but not used. Most type sizes are raw pixel values rather than tokens.
7. **Density.** Tables have one row height (44px). The research's compact and comfortable toggle is not implemented.
8. **Mobile tab bar.** It has five items (Overview, Obligations, Approvals, Copilot, More). The research specified four (Overview, Approvals, Activity, More).
9. **Approval confirmation wording.** Confirm buttons say "Approve" and "Reject". They do not restate the amount and destination as benchmark 11 asks. The amount and title are shown in the dialog body.
10. **Type-to-confirm** is used only for "Stop tracking" an account. The conventions file asks for it on destructive and financial confirmations generally.
11. **Print palette.** The snapshot's print CSS resets surfaces, text, accent and status tokens to light values, but not the bucket or chart tokens. Printing from dark mode uses the dark bucket colours on white paper.
12. **`data-offline` is unused.** `PwaClient` sets it, but no screen reads it. Actions stay enabled while offline and fail with a network error. The banner wording says so accurately.
13. **Minus signs.** U+2212 is used for USD (`formatUsd`). Token and EUR amounts formatted with `formatDecimal` would use an ASCII hyphen if negative.
