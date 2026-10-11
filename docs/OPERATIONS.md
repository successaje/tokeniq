# Operations

## Observability

- **Logs:** structured JSON from pino (`service`, `requestId`, method, path, status, latency). Cookies, authorization headers, OTPs, tokens, signatures and API keys are redacted (`apps/api/src/lib/logger.ts`). Every response carries `x-request-id`, and error bodies include it so support can find the log line.
- **Provider health:** `provider_health` records TokenIQ's own measured calls per provider:
  - `rpc:<chainId>`, `chainlink:<chainId>`, `sequencer:<chainId>`, `morpho-api`, `aave-onchain`;
  - status rules: 3 or more consecutive failures = `down`, any failure = `degraded`;
  - surfaced at `/api/status` and the public `/status` page, and as risk alerts (`provider_degraded`, `sequencer_down`).
- **Data freshness:** `GET /api/v1/orgs/{id}/treasury/sync-status`. Balances older than the policy's `maxDataAgeMinutes` mark figures incomplete and pause recommendations.
- **Jobs:** pg-boss tables live in the `pgboss` schema. Watch for queue backlog (`select name, count(*) from pgboss.job where state in ('created','retry') group by 1`) and failed jobs (`state = 'failed'`).
- **Error reporting:** errors are logged with stack traces server-side; clients see only a message and the request id. Wiring a hosted error tracker (Sentry or similar) is a deployment choice; see KNOWN_LIMITATIONS.md.

### Suggested alerts (configure in your platform)

| Signal | Threshold |
|---|---|
| `/api/health` failing | 2 consecutive checks |
| 5xx rate | > 1% over 5 min |
| `provider_health.status = 'down'` | any |
| Failed jobs in `pgboss.job` | > 10 in 15 min |
| No `price_observations` insert | 30 min |
| No `opportunities.fetched_at` update | 60 min |
| Proposal `submitted` for > 30 min | any (execution tracking stuck or tx dropped) |

## Kill switches

Set `DISABLED_FEATURES` and restart the API and worker (no deploy needed):

| Switch | Effect |
|---|---|
| `copilot` | copilot returns 503 "disabled" |
| `proposals` | no new proposals |
| `signatures` | no preparation, signing or execution data (approvals still recordable) |
| `sync` | scheduled and manual account syncs stop (figures go stale, and the UI says so) |
| `opportunities` | venue refresh stops |

Separately, the on-chain `TreasuryReserveGuard` can be paused by any guardian with one signature. Only the Safe can unpause it.

## Backups and restore

- Use the provider's automated daily backups with point-in-time recovery (7+ days).
- Before each release, take a manual snapshot.
- **Restore drill (quarterly, and before production launch):**
  1. Restore the latest snapshot into a new database.
  2. Point a staging API at it and run `pnpm db:migrate` (it should be a no-op).
  3. Sign in, open an organization, export the activity CSV and compare the row count with production.
  4. Record the date, duration and result in the release notes.
- Organization data (obligations, policies, approvals, audit events) cannot be reconstructed from the chain, which is why the restore drill matters. Balances and venue data can be re-synced from chain and APIs.

## Scaling notes

- **Rate limit:** the API's limiter is in memory, per instance, keyed by signed-in user (or client IP before sign-in). One-time codes are also limited per email address (5 sends and 10 attempts per 15 minutes). With multiple API instances, either accept per-instance limits or move the limiters to a shared store. Better Auth's own limiter covers sign-in endpoints per instance as well and receives the client IP resolved with `TRUSTED_PROXY_COUNT`.
- **Worker:** one worker instance is recommended. pg-boss singleton keys de-duplicate work if two run during a deploy.
- **RPC:** each sync reads one pinned block per account. Configure dedicated RPC endpoints in production; the public fallbacks are rate-limited.

## Routine tasks

| Task | How |
|---|---|
| Rotate `BETTER_AUTH_SECRET` | set a new value and restart; all sessions end |
| Rotate `ANTHROPIC_API_KEY` | set a new value and restart the API |
| Update the venue listing | code change in `packages/chain/src/listing.ts` (review date and rationale), then deploy |
| Add a token or chain | `packages/chain/src/{tokens,chains}.ts` with verified addresses and feeds and sources in comments; add a live test; then deploy |
| Remove a member immediately | delete the membership (Team page); their sessions lose access to that organization at once because membership is checked on every request |
