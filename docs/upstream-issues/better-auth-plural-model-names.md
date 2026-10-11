# Draft: `usePlural` appends a bare "s", so `walletAddress` becomes `walletAddresss`

**Project:** better-auth (`@better-auth/core`, `@better-auth/drizzle-adapter`), version 1.7.7
**Type:** bug or documentation, low severity
**Status:** draft, not filed

## Summary

With the Drizzle adapter's `usePlural: true`, Better Auth turns a model name into its plural by appending `s` (`get-model-name.mjs`: `` usePlural ? `${model}s` : model ``). For the SIWE plugin's `walletAddress` model, the adapter therefore looks for a schema key named `walletAddresss`. Registering the table under the natural plural `walletAddresses` fails at runtime with a "model not found" error.

## Reproduction

1. Configure `drizzleAdapter(db, { provider: "pg", usePlural: true, schema: { users, sessions, accounts, verifications, walletAddresses } })`.
2. Enable the `siwe()` plugin.
3. Call the SIWE verify endpoint with a valid message and signature.

**Expected:** the wallet address row is written to `walletAddresses`.
**Actual:** an error that the model is not found. It goes away once the map also contains `walletAddresss: walletAddresses`.

## Suggestions

- Document that `usePlural` appends a bare `s`, and list the exact keys expected for each plugin's models.
- Or let plugins declare their plural form, or apply simple English pluralisation rules (`-ss` → `-sses`).

## Our workaround

`apps/api/src/auth.ts` maps both keys.
