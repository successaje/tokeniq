# 0007 — Stack

**Decision.**
- **API:** Hono with `@hono/zod-openapi`, which produces an OpenAPI 3.1 document from validated routes.
- **Identity:** Better Auth with email one-time codes, passkeys and SIWE. These are mature, maintained implementations; hand-rolling them was rejected.
- **Database:** Drizzle ORM on Postgres. Migrations are SQL files.
- **Jobs:** pg-boss, a Postgres-backed queue, so there is no Redis.
- **Chain access:** viem and wagmi v3.
- **Web:** Next.js 16 with React 19, Tailwind v4 and Radix primitives.
- **Tests:** Vitest with fast-check, Playwright with axe-core, and Foundry.

**Alternatives.**
- NestJS and Prisma were suggested in the brief. Prisma's 7 to 8 transition was in progress at review time (`npm i prisma` installs an 8.0 release candidate).
- Hono with Drizzle gives explicit SQL and a lighter runtime, and matches the team's existing projects.

**Consequences.**
- Workspace packages ship as TypeScript source (tsx at runtime, transpilePackages in Next).
- Postgres is the only stateful dependency.
