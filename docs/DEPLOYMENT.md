# Deployment

TokenIQ runs as three processes plus Postgres:

| Service | Image / command | Scales | Health |
|---|---|---|---|
| `web` | `apps/web/Dockerfile` (Next.js standalone) | horizontally | `GET /` |
| `api` | `apps/api/Dockerfile`, default command `src/server.ts` | horizontally, but see the rate-limit note in OPERATIONS.md | `GET /api/health` |
| `worker` | same image as `api`, command `node --import tsx src/worker.ts` | **one instance** (pg-boss coordinates jobs, but a single worker keeps RPC load predictable) | `GET :4001/healthz` |
| Postgres 16 | managed (Railway, Neon, RDS, Cloud SQL…) | — | provider |

Production deployment and any live financial authority require explicit owner authorization. Nothing in this repository deploys contracts or sends transactions automatically.

## Environments

| Environment | Database | Chains | Copilot | Email | Notes |
|---|---|---|---|---|---|
| Local | `postgres://localhost:5432/tokeniq_dev` | Mainnet reads via public RPCs; Base Sepolia and Sepolia for execution tests | optional | logged to the API console | `pnpm dev` |
| Test (CI) | ephemeral Postgres service | no network for API tests; Foundry fork tests use `BASE_RPC_URL` | fake client | in-memory outbox | `.github/workflows/ci.yml` |
| Staging | separate database and secrets | dedicated RPC keys; **testnets only** for execution | separate key, low limits | real SMTP to a test domain | `NODE_ENV=production`, sample data allowed |
| Production | backed-up managed Postgres with PITR | dedicated RPC keys with failover | production key | production SMTP | requires owner sign-off (RELEASE_CHECKLIST.md) |

## Configuration

API and worker (validated at boot by `apps/api/src/env.ts`; an invalid configuration refuses to start):

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | yes | |
| `BETTER_AUTH_SECRET` | yes | at least 32 random bytes (`openssl rand -hex 32`); rotating it signs everyone out |
| `APP_URL` | yes | public web origin. Used for the origin check, cookies, the SIWE domain and the passkey relying party |
| `API_PUBLIC_URL` | yes | origin the browser uses for `/api` (normally the same as `APP_URL`) |
| `NODE_ENV=production` | yes | secure cookies; disables `/api/docs` and `DEV_EXTRA_ORIGINS` |
| `MIGRATE_ON_BOOT=false` | yes (prod) | migrations run as a release step |
| `RUN_JOBS=false` | yes (api) | jobs run in the worker only |
| `SMTP_URL`, `EMAIL_FROM` | yes (prod) | without SMTP, production refuses to send email (sign-in codes fail loudly) |
| `RPC_URL_1`, `RPC_URL_8453`, `RPC_URL_42161`, `RPC_URL_10` | strongly recommended | dedicated endpoints, tried before the public fallbacks |
| `ANTHROPIC_API_KEY`, `COPILOT_MODEL` | optional | copilot; default model `claude-opus-5-5` |
| `DISABLED_FEATURES` | optional | kill switches: `copilot,proposals,signatures,sync,opportunities,email` |
| `LOG_LEVEL` | optional | `info` by default; structured JSON (pino) with secrets redacted |

Web build arguments: `API_INTERNAL_URL` (the API's private URL for the `/api` rewrite), `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` (optional), `NEXT_PUBLIC_CONTACT_EMAIL`, `NEXT_PUBLIC_SECURITY_EMAIL`.

## Railway

The repository includes `apps/api/railway.json` (API, with migrations as `preDeployCommand`), `apps/api/railway.worker.json` (worker) and `apps/web/railway.json`.

1. Create a project with a Postgres database.
2. Create three services from the repository: **api** (config `apps/api/railway.json`), **worker** (config `apps/api/railway.worker.json`) and **web** (config `apps/web/railway.json`).
3. Set the API and worker variables above. Reference the database URL from the Postgres plugin.
4. Set the web build argument `API_INTERNAL_URL` to the API's private network URL (for example `http://api.railway.internal:4000`), and `NEXT_PUBLIC_SITE_URL` to the public domain.
5. Attach the public domain to **web** only. The API does not need a public domain, because browsers reach it through `web` at `/api`.
6. Deploy api first. Its `preDeployCommand` applies migrations. Then deploy worker, then web.

## Release procedure

1. CI is green on the release commit: typecheck, unit, integration, contract, web build, secret scan, dependency audit and e2e.
2. Work through [`RELEASE_CHECKLIST.md`](RELEASE_CHECKLIST.md).
3. Take a database snapshot.
4. Deploy api; migrations run before traffic switches. Then worker, then web.
5. Smoke test:
   - `GET /api/health`;
   - `GET /api/status` shows providers as ok;
   - sign in;
   - the overview loads;
   - prices and venue data refresh within 15 minutes.
6. To roll back, redeploy the previous images. Migrations are backward-compatible, so the previous release runs against the new schema. If a migration itself is faulty, restore the snapshot (see OPERATIONS.md).

## Contracts

No contract is deployed by this repository's CI or scripts. `packages/contracts/script/DeployTreasuryReserveGuard.s.sol`:
- deploys the guard only when run explicitly with a deployer key;
- prints the Safe transactions the owners must sign;
- refuses Safes below v1.5.0.

Record every deployment in `packages/contracts/deployments/<chainId>.json` (see that folder's README). A production deployment that holds any authority over real funds requires the owners' explicit authorization **and** an independent audit (KNOWN_LIMITATIONS.md).
