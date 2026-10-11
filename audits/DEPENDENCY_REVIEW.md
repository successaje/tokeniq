# Dependency review

Internal review, 2026-10-11, of the `tokeniq-2` branch. It is not an external audit.

## Summary

| Check | Result |
|---|---|
| Known vulnerabilities in production dependencies (`pnpm audit --prod`, npm registry advisories) | **None.** Earlier, 21 transitive advisories (6 high, all axios via WalletConnect / Reown / Coinbase SDK) were removed with version overrides. |
| Install scripts | Restricted: only `esbuild` and `sharp` may run build scripts (`pnpm-workspace.yaml` → `onlyBuiltDependencies`). |
| Lockfile | `pnpm-lock.yaml` committed. CI installs with `--frozen-lockfile`. |
| Secrets in history | `gitleaks` 8.24 runs in CI on every commit of the branch, using `.gitleaks.toml`. The allowlist covers only 20-byte hex addresses and vendored contract libraries. |
| Contract libraries | Vendored at exact tags and verified byte-for-byte against fresh clones (`packages/contracts/DEPENDENCIES.md`). |
| Licences needing a decision | **WalletConnect / Reown community licences** (see below). |
| Default-branch alerts | GitHub reports 100 open Dependabot alerts on `main` (6 critical, 59 high, 31 medium, 4 low). They all come from the legacy v1 `package.json`, `package-lock.json` and `yarn.lock`. Those files do not exist on `tokeniq-2`. Merging 2.0 into `main` removes them; v1 stays preserved at tag `v1-legacy-2025`. |

## How to reproduce

```bash
pnpm audit --prod --registry https://registry.npmjs.org
pnpm licenses list --prod
```

The audit must name the npm registry explicitly when a mirror is configured, because mirrors may not serve the advisory endpoint.

## Overrides

Declared in the root `package.json` under `pnpm.overrides`. pnpm 10.2 ignores overrides placed in `pnpm-workspace.yaml`.

| Override | Why | Remove when |
|---|---|---|
| `axios: >=1.20.0` | Several high-severity advisories in axios versions pulled transitively by wallet SDKs | The SDKs depend on a fixed axios themselves |
| `esbuild@<0.25.0: >=0.25.0` | Development-server advisory in old esbuild (pulled by tooling) | No dependency requests esbuild < 0.25 |

## Direct dependencies

Versions as resolved in the lockfile on 2026-10-11. Caret ranges resolve through the lockfile. Next.js and React are pinned exactly because the app relies on App Router and React 19.3 behaviour.

### Web (`apps/web`)

| Package | Purpose | Notes |
|---|---|---|
| next 16.4.0, react / react-dom 19.3.0 | Framework | Pinned. Upgrades go through the full e2e and axe suite. |
| wagmi 3.7, viem 2.57 | Wallet connection, typed-data signing, chain reads | viem is shared with the API, so encoding and hashing are the same on both sides. |
| @safe-global/safe-apps-sdk 9, safe-apps-provider 0.18 | Running inside Safe{Wallet} as a Safe App | Loaded only by the Safe connector. |
| @walletconnect/ethereum-provider 2.23 | WalletConnect connector | **Licence decision required** (below). Disabled unless `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` is set. |
| better-auth 1.7, @better-auth/passkey | Client for email code, passkey and wallet sign-in | Same major version as the server. |
| @tanstack/react-query 5 | Server state | Query keys always start with the organization id. |
| radix-ui 1.7 | Accessible primitives (dialog, menu, tooltip, radio, tabs) | |
| motion 14 | Animation | Respects reduced motion. |
| zod 4, clsx, tailwind-merge, lucide-react | Validation and UI utilities | |

### API (`apps/api`) and packages

| Package | Purpose | Notes |
|---|---|---|
| hono 4.13, @hono/zod-openapi 1.6, @hono/node-server 2 | HTTP, validation, OpenAPI 3.1 | Hono's `csrf()` does not check JSON requests, so TokenIQ adds its own Origin check (see `BACKEND_REVIEW.md`). |
| better-auth 1.7 | Sessions, email one-time codes, passkeys, Sign-In with Ethereum | Organizations and roles are TokenIQ's own code, not the plugin. |
| drizzle-orm 0.45, pg 8 | Postgres access | Numeric values are read as strings and never as floats. |
| pg-boss 12 | Background jobs in Postgres | No separate queue to operate. |
| @anthropic-ai/sdk 0.133 | Copilot | Optional. Without `ANTHROPIC_API_KEY` the copilot reports it is not configured. Uses the beta streaming API with server-side fallbacks. |
| nodemailer 10, pino 10 | Email, structured logs with redaction | |
| @scalar/hono-api-reference | API reference page | Development only. |
| viem 2.57 | All chain access (`packages/chain`) | |
| zod 4 | Policy schemas in `packages/core` | The engine's only dependency. |

### Contracts (`packages/contracts`)

| Library | Version | Licence | Use |
|---|---|---|---|
| Safe Smart Account | v1.5.0 (`dc437e8f`) | LGPL-3.0-only | Interfaces only: `IModuleGuard`, `IERC165`, `Enum` |
| forge-std | v1.17.0 (`f3dae6e6`) | MIT OR Apache-2.0 | Tests and scripts only |

`TreasuryReserveGuard.sol` is itself licensed `LGPL-3.0-only` to match the Safe code it builds against.

### Test tooling

Playwright 1.64, @axe-core/playwright 4.13, smtp-server 3.19 (local mail sink for e2e), Vitest, fast-check, Foundry 1.8.5 in CI. None of these ship to users.

## Licences

`pnpm licenses list --prod` resolves 473 production packages. Nearly all are permissive (MIT 395, Apache-2.0 23, ISC 15, BSD-3-Clause 13). The exceptions:

| Licence | Package | Assessment |
|---|---|---|
| **WalletConnect Community License / Reown Community License** (reported as "Unknown"; `SEE LICENSE IN LICENSE.md`) | `@walletconnect/*` 2.23, `@reown/appkit*` 1.8.19 | **Not open source.** The licence is royalty-free for development and for usage below thresholds that Reown sets and may change. Above them, the licensee must buy a commercial licence. Disputes go to binding individual arbitration. Using the SDK means accepting the licence. **The owner must decide** whether to accept it before enabling WalletConnect in production. Without WalletConnect, people still sign through injected wallets (EIP-6963: Rabby, MetaMask, Frame, hardware wallets through them) and inside Safe{Wallet} as a Safe App. Removing the connector is a small change in `apps/web/src/lib/wagmi.ts` and `apps/web/package.json`. |
| LGPL-3.0-or-later | `@img/sharp-libvips-*` (Next.js image optimisation) | Dynamically linked native library. Fine for a hosted service. |
| MPL-2.0 | `lightningcss` (build-time CSS) | File-level copyleft. Not modified. |
| CC-BY-4.0 | `caniuse-lite` (browser data) | Attribution data, build-time. |
| BlueOak-1.0.0 | `lru-cache` | Permissive. |

TokenIQ itself has **no LICENSE file yet**. The repository is public, but without a licence nobody else may reuse the code. Choosing a licence is the owner's decision, and the public site says "public source code", not "open source".

## Supply-chain posture and residual risks

- **Wallet SDK surface.** The wallet connector tree (WalletConnect, Reown, Coinbase SDK) is the largest and most volatile part of the dependency graph and was the source of every advisory found. It is loaded only in wallet flows, not on public pages. Keep it updated and re-run the audit on every upgrade.
- **Auth library velocity.** Better Auth releases often. Pin minor versions in production and run the API suite, which covers sign-in, sessions and SIWE, before upgrading.
- **Beta API features.** The copilot uses Anthropic beta features (server-side fallbacks). If a beta changes, the copilot fails closed with an error message, and the rest of the app is unaffected.
- **No SBOM or provenance yet.** CI does not yet produce an SBOM or check npm provenance. Listed in `RELEASE_RISKS.md`.
- **Docker base images** (`node:24-slim`) are not pinned by digest and were not built locally during this review because the Docker daemon was unavailable. Pin by digest before production.
