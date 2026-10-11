# TokenIQ API and worker image. Build from the repository root:
#   docker build -f apps/api/Dockerfile -t tokeniq-api .
# Workspace packages ship as TypeScript source and run with tsx.
# The same image runs the API (default CMD) or the worker (CMD override: worker).
FROM node:24-slim AS base
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/
COPY packages/core/package.json packages/core/
COPY packages/chain/package.json packages/chain/
COPY packages/db/package.json packages/db/
RUN pnpm install --frozen-lockfile --filter @tokeniq/api... --filter @tokeniq/db...

FROM base AS runtime
ENV NODE_ENV=production MIGRATE_ON_BOOT=false
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY tsconfig.base.json ./
COPY packages/core/src packages/core/src
COPY packages/chain/src packages/chain/src
COPY packages/db/src packages/db/src
COPY packages/db/migrations packages/db/migrations
COPY apps/api/src apps/api/src
COPY apps/api/package.json apps/api/tsconfig.json apps/api/
WORKDIR /app/apps/api
USER node
EXPOSE 4000
HEALTHCHECK --interval=15s --timeout=3s CMD node -e "fetch('http://localhost:'+(process.env.PORT||4000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
# Release step (before switching traffic): node --import tsx ../../packages/db/src/migrate.ts
CMD ["node", "--import", "tsx", "src/server.ts"]
