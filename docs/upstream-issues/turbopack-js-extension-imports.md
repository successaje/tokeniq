# Draft: Turbopack and `.js` specifiers in transpiled workspace TypeScript packages

**Project:** Next.js 16.4 (Turbopack, development)
**Type:** possible bug
**Status:** draft, not filed. **Needs a minimal reproduction** and a search of existing issues first.

## What we saw

`packages/core` was written with NodeNext-style imports (`import { x } from "./money.js"` where the file is `money.ts`). The Next app consumes it through `transpilePackages: ["@tokeniq/core"]`. Under Turbopack in development, importing from the package failed with "module has no exports". The same code typechecked with `tsc` (Bundler resolution) and ran under `tsx` and Vitest.

## Workaround

Switch the package to extensionless relative imports. This works everywhere we run it.

## Before filing

- Build a minimal monorepo: one Next app and one TS package with a single `.js`-specifier import.
- Test with webpack (`next dev --webpack`) and with Turbopack.
- Check whether a `resolveExtensions` or `extensionAlias` equivalent is documented for Turbopack.
