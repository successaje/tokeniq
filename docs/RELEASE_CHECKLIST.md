# Release checklist

Work through this for every production release. Items marked **owner** are decisions or actions only the repository owner can take; nobody else, human or agent, should do them on the owner's behalf.

## 1. Code and checks

- [ ] The release branch is green in CI:
  - typecheck;
  - engine, chain and API tests;
  - web build;
  - browser e2e + axe;
  - contracts;
  - gitleaks;
  - `pnpm audit --prod` with no high or critical advisories.
- [ ] The fork execution test passed against the current Base state (CI `fork` job with `BASE_RPC_URL`, or run locally; see [Testing](TESTING.md)).
- [ ] `docs/api/openapi.json` is regenerated (`pnpm --filter @tokeniq/api exec tsx src/scripts/openapi.ts`) and committed.
- [ ] New migrations are reviewed: each is additive or has a written rollback, and none rewrites append-only tables.
- [ ] `CHANGELOG.md` has an entry for the release.
- [ ] Every finding in [`audits/REMEDIATION_LOG.md`](../audits/REMEDIATION_LOG.md) is fixed or explicitly accepted, and [`audits/RELEASE_RISKS.md`](../audits/RELEASE_RISKS.md) is current.

## 2. Configuration (production)

- [ ] `NODE_ENV=production`, with `APP_URL` and `API_PUBLIC_URL` on HTTPS.
- [ ] `BETTER_AUTH_SECRET` is at least 32 random bytes, unique to this environment, and stored only in the platform's secret store.
- [ ] `DATABASE_URL` points to a managed Postgres 16 with TLS, automated backups and point-in-time recovery enabled. A restore has been tested.
- [ ] `SMTP_URL` and `EMAIL_FROM` are set. Without them, production refuses to send sign-in codes.
- [ ] Dedicated RPC endpoints are set: `RPC_URL_1`, `RPC_URL_8453`, `RPC_URL_42161`, `RPC_URL_10`. Public endpoints are rate-limited.
- [ ] Contact addresses are set: `NEXT_PUBLIC_CONTACT_EMAIL` and `NEXT_PUBLIC_SECURITY_EMAIL`. **Owner** chooses them.
- [ ] `ANTHROPIC_API_KEY` is set if the copilot should be on (it is optional), plus the provider's data-handling terms reviewed by the **owner**.
- [ ] `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` is set only after the **owner** accepts the WalletConnect/Reown community licence (see [`audits/DEPENDENCY_REVIEW.md`](../audits/DEPENDENCY_REVIEW.md)).
- [ ] `MIGRATE_ON_BOOT=false`. Migrations run as the release step (`preDeployCommand`).
- [ ] `RUN_JOBS=true` on the worker only, with exactly one worker deployment.
- [ ] Docker base images are pinned by digest, and both images build and start locally or in CI.

## 3. Repository and disclosure (owner)

- [ ] Choose a licence and add `LICENSE`. Until then the repository grants no reuse rights.
- [ ] Enable GitHub private vulnerability reporting and publish a response-time commitment in [Security](SECURITY.md).
- [ ] Rotate or retire the legacy v1 hosted-database keys (details in the private contracts repository).
- [ ] Set the `BASE_RPC_URL` repository secret so fork tests run in CI.
- [ ] Decide whether and when `tokeniq-2` replaces `main`. Merging removes the legacy v1 lockfiles that carry 100 open Dependabot alerts. v1 stays at tag `v1-legacy-2025`.
- [ ] Review and approve the legal pages (`/legal/terms`, `/legal/privacy`, `/legal/risks`) with counsel. They are drafts written by the builders, not legal advice.

## 4. Smoke test after deploy

- [ ] `GET /api/health` returns 200. `GET /api/status` shows every provider `ok`, or degradation that is understood.
- [ ] Sign up with a real inbox: the code arrives and sign-in works. Then sign out.
- [ ] Open the sample workspace: the banner shows on every page, and nothing can be signed.
- [ ] Add a real Safe as watch-only: balances appear with freshness, and prices are not stale.
- [ ] Verify it with an owner wallet: the challenge is single-use.
- [ ] Prepare a small proposal on a test organization and stop before signing. Check that the simulation passes and the decoded calls match the intent.
- [ ] The worker is running: prices and venues refresh within 10 minutes (`/api/status`).
- [ ] Security headers are present on `/` and `/api/health`, and the browser console shows no CSP violations while you click through the app.

## 5. Never as part of a release

- Deploying `TreasuryReserveGuard`, or any contract, to a network that holds value.
- Changing a Safe's owners, threshold, modules or guard.
- Moving funds, including "test" amounts from production treasuries.
- Claiming an external audit, customers, TVL or performance that do not exist.

Each of these needs the owners' explicit, separate decision.
