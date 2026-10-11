# Tracking: exact `axios@1.16.0` pin reached the wallet connector tree

**Projects:** `@coinbase/cdp-sdk` 1.55.0, pulled by `@base-org/account` 2.4.0, pulled by `@reown/appkit-utils` 1.8.19 (via `@walletconnect/ethereum-provider` and wagmi connectors)
**Status:** no issue to file. Newer upstream releases appear to fix it; this page records how to remove our override.

## What we saw

`pnpm audit` reported high-severity axios advisories. `pnpm why axios` traced them to `@coinbase/cdp-sdk@1.55.0`, which declares `"axios": "1.16.0"` (exact).

## Upstream state (npm registry, 2026-10-11)

- `@coinbase/cdp-sdk` 1.58.0 declares `axios: ^1.18.0`.
- `@base-org/account` 2.5.13 declares `@coinbase/cdp-sdk: ^1.56.0`.

## To remove the override

1. Upgrade wagmi, WalletConnect and Reown packages.
2. Check that `pnpm why @coinbase/cdp-sdk` resolves to 1.56 or later and that `pnpm why axios` shows no version below the patched release.
3. Delete `axios` from `pnpm.overrides`, reinstall, and run `pnpm audit --prod --registry https://registry.npmjs.org`.
