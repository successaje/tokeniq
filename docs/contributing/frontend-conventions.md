# Frontend conventions (apps/web)

These rules keep every TokenIQ screen consistent. Read the reference implementation first:
`src/app/app/page.tsx` (Overview), `src/components/shell/app-shell.tsx`, `src/components/ui/*`,
`src/components/charts/*`, `src/lib/{api,format,org,types,buckets}.ts`, `src/app/globals.css`.

## Product rules that override visual preferences
- **Never show invented data as real.** No hardcoded balances, APYs, customers, audits or TVL. Empty states explain what will appear and how to make it appear. Sample workspaces are labelled by the shell; do not add fake data to real organizations.
- **Money is exact.** USD values arrive as decimal strings. Display with `<Money value=… />` or `usd()` from `lib/format`. Never `parseFloat` money for arithmetic or display text; use `parseDecimal`/`wadToString` from `@tokeniq/core` for sums and comparisons. Floats are allowed only for chart geometry and layout percentages.
- **Every figure has context.** Show units, the as-of time or freshness (`<Freshness>`), and the source where it matters (APY measurement, oracle). Stale data must look stale.
- **Status = icon + text** (`<StatusBadge>`, `<Callout>`). Colour is never the only cue.
- **Distinguish states honestly:** planned ≠ invoiced ≠ paid; internal approval ≠ Safe signature ≠ on-chain execution; "request sent" ≠ "succeeded".
- **Authorization:** hide controls the role can't use (`useCan(...)` from `lib/org`), but always handle 403 from the API gracefully. The API is the boundary.

## Data access
- Organization-scoped GET: `useOrgQuery<T>("/path")` (key `["org", orgId, path]`). Mutations: `useMutation` + `api(orgPath(orgId, "/path"), { method, body })`; invalidate the affected `["org", orgId, ...]` keys on success.
- Errors: `ApiError` has `status`, `code`, `message` (written for people), `details`. Use `fieldErrors(err)` to map `validation_error` details onto `<Field error>`. Preserve user input after failures.
- Never retry mutations automatically. Financial writes send `idempotencyKey` (use `crypto.randomUUID()` created once per form submission attempt and reused on retry of the same submission).
- Wire types live in `src/lib/types.ts`. You may **append** new interfaces; do not change existing ones without coordinating.

## Layout and components
- Page = `<PageHeader title description meta actions />` then content. Max width is set by the shell.
- Cards: `<Card><CardHeader/><CardBody/></Card>`; hairline borders, no shadows except floating layers.
- Tables: `Table/Th/Td/Tr` with `numeric` for amount columns. On small screens prefer stacked rows (label left, amount right, meta below) rather than horizontal scroll for primary lists.
- Forms: `<Field label hint error>{(p) => <Input {...p} />}</Field>`, `AmountInput` (decimal strings only), `AddressInput` (checksum-aware), `Select`, `Segmented`, `Switch`. Long forms open in a `<Sheet>`; confirmations use `<ConfirmDialog>` (type-to-confirm for destructive/financial).
- Loading: skeletons that match the final layout (`<Skeleton>`), wrapped in `role="status"` with a text label. No spinners for page loads; button spinners via `loading`.
- Empty states: `<EmptyState icon title description actions />` — say what will appear and the next step.
- Toasts: `useToast().toast({ id, tone, title, description })`; reuse ids to avoid duplicates; `pending` tone for in-flight operations, then replace with the real outcome.
- Icons: lucide-react, `aria-hidden` when decorative, `size-4` in text.
- New shared components go in `src/components/ui/` (new files). Feature components go in `src/components/app/<feature>/` or `src/components/marketing/`.

## Visual language (Ledger Grid)
- Tokens only (`bg-surface`, `text-text-2`, `border-hairline`, `bg-accent`, `text-success`…). No raw hex in components. No gradients, glow, glass or neon.
- Accent (petrol) means "deployable / primary action". Bucket colours (`reserve`, `obligations`, `deployable`) only mean those buckets.
- Type: 14px body, 13px tables/meta, 12px labels; tabular figures in columns (`num` class). Large hero figures use proportional figures.
- Motion: 120–280ms, `ease-[var(--ease-out)]`, opacity/transform only, no bounce; everything honours reduced motion.

## Accessibility (WCAG 2.2 AA)
- Keyboard: every action reachable; visible focus (global); logical heading order (one `h1` per page).
- Inputs have labels; errors are announced (`Field` does this).
- Touch targets ≥ 24px (44px on mobile primary actions). Don't hide critical info in tooltips.
- Charts provide a text summary and a table alternative.

## Verifying your work
- Dev servers are already running: web http://localhost:3000, API http://localhost:4000 (do not start or restart them). API log: `/private/tmp/claude-501/-Users-finisher-Documents-github-arena-platform/48693d17-521a-4cb4-9137-b0df5c8a86c2/scratchpad/api.log` — development sign-in codes are printed there (`grep -o "Use [0-9]\{6\} to sign in" … | tail -1`).
- Sign in at /login with any test email (e.g. `yourname@example.test`), complete the name step, then create an organization or open a sample workspace from onboarding.
- Use the built-in browser in **your own tab** (`tabs_create`), check: populated, empty, loading and error states; light and dark (`resize_window` colorScheme); 390px mobile and 768px tablet widths (reset to desktop afterwards); keyboard navigation.
- `pnpm --filter @tokeniq/web typecheck` must pass. Do not commit; the orchestrator commits.
