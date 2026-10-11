# Upstream issues

Problems found in third-party software while building TokenIQ 2.0. Each has a draft report in [`upstream-issues/`](upstream-issues/).

**Nothing here has been filed.** Filing publishes text under the owner's name, so it waits for their go-ahead. Before filing any draft, search the project's open and closed issues for duplicates and re-check against the latest release. None of these is a security vulnerability; if one were, it would go through the project's private disclosure channel, not a public issue.

| # | Project | Summary | Our workaround | Verified how | Status |
|---|---|---|---|---|---|
| 1 | Better Auth 1.7.7 | With `usePlural: true`, model names get a plain `s` appended, so the SIWE plugin's `walletAddress` model must be registered as `walletAddresss` in the Drizzle schema map. | Map `walletAddresss: schema.walletAddresses` (`apps/api/src/auth.ts`). | Read `@better-auth/core/dist/db/adapter/get-model-name.mjs` (`usePlural ? \`${model}s\` : model`); reproduced as a runtime "model not found" error. | [Draft](upstream-issues/better-auth-plural-model-names.md) |
| 2 | Coinbase CDP SDK via `@base-org/account` via Reown AppKit | `@coinbase/cdp-sdk` 1.55.0 pins `axios` to exactly `1.16.0`, which has published high-severity advisories. It reaches us through `@reown/appkit-utils` 1.8.19 → `@base-org/account` 2.4.0. | `pnpm.overrides`: `axios >=1.20.0`. | `pnpm why axios`; the package's `package.json`. Newer releases (`@coinbase/cdp-sdk` 1.58.0 uses `^1.18.0`; `@base-org/account` 2.5.13 uses cdp-sdk `^1.56.0`) appear to fix it. | [Tracking only](upstream-issues/cdp-sdk-axios-pin.md): upgrade, then remove the override. |
| 3 | Hono 4.13 `csrf()` | The middleware checks Origin only for form-encoded content types, so a cross-site `fetch` with `Content-Type: application/json` passes it. This matches the middleware's purpose (browsers can send forms cross-site without CORS preflight), but an API that accepts JSON can wrongly assume it is covered. | An explicit Origin/Referer check on every state-changing `/api/v1` request (`apps/api/src/app.ts`), with a test. | Observed: a cross-site JSON POST returned 201 before our fix. | [Draft (documentation suggestion)](upstream-issues/hono-csrf-json-docs.md) |
| 4 | Next.js 16.4 Turbopack | A workspace TypeScript package written with NodeNext-style `.js` import specifiers (resolving to `.ts` files) and consumed through `transpilePackages` failed under Turbopack ("module has no exports"); TypeScript and tsx resolved it fine. | Extensionless imports in `packages/core`. | Observed in development; **not yet reduced to a minimal reproduction**. | [Draft, needs repro](upstream-issues/turbopack-js-extension-imports.md) |
| 5 | Foundry 1.8.5 | Transient storage (EIP-1153) written in one external call from a test did not survive into the next external call from the same test function, so a guard's `checkModuleTransaction` → `checkAfterModuleExecution` pair could not be tested as two calls. | A helper contract performs both calls inside one call frame (`HookSequenceSafe` in the guard tests). | Observed; **may be intended** (each top-level call treated as its own transaction). Check Foundry's `isolate` documentation before filing. | [Draft, confirm intent first](upstream-issues/foundry-transient-storage-between-calls.md) |

## Integration facts that are not bugs

These are recorded so nobody "fixes" them by accident:

- **Morpho Vault V2:** the ERC-4626 `max*` functions return 0 by design (documented by Morpho; see `docs/research/integration-facts.md`). TokenIQ reads withdrawable liquidity from the vault's own data rather than `maxWithdraw`.
- **Safe Transaction Service:** now requires an API key. TokenIQ collects owner signatures itself and does not depend on it (ADR in `docs/adr/`).
- **pnpm 10.2:** ignores `overrides` in `pnpm-workspace.yaml`. Use `package.json` → `pnpm.overrides`.
