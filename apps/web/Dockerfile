# TokenIQ web image (Next.js standalone server). Build from the repository root:
#   docker build -f apps/web/Dockerfile -t tokeniq-web --build-arg API_INTERNAL_URL=http://api.internal:4000 .
# The /api proxy target and NEXT_PUBLIC_* values are compiled in, so they are build args.
FROM node:24-slim AS base
RUN corepack enable
WORKDIR /app

FROM base AS build
ARG API_INTERNAL_URL=http://localhost:4000
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000
ARG NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=
ARG NEXT_PUBLIC_CONTACT_EMAIL=
ARG NEXT_PUBLIC_SECURITY_EMAIL=
ARG NEXT_PUBLIC_SOURCE_URL=
ENV API_INTERNAL_URL=$API_INTERNAL_URL \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=$NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID \
    NEXT_PUBLIC_CONTACT_EMAIL=$NEXT_PUBLIC_CONTACT_EMAIL \
    NEXT_PUBLIC_SECURITY_EMAIL=$NEXT_PUBLIC_SECURITY_EMAIL \
    NEXT_PUBLIC_SOURCE_URL=$NEXT_PUBLIC_SOURCE_URL \
    NEXT_STANDALONE=1 \
    NEXT_TELEMETRY_DISABLED=1
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY apps/web/package.json apps/web/
COPY packages/core/package.json packages/core/
RUN pnpm install --frozen-lockfile --filter @tokeniq/web...
COPY packages/core packages/core
COPY apps/web apps/web
RUN pnpm --filter @tokeniq/web build

FROM node:24-slim AS runtime
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 HOSTNAME=0.0.0.0 PORT=3000
WORKDIR /app
COPY --from=build --chown=node:node /app/apps/web/.next/standalone ./
COPY --from=build --chown=node:node /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=node:node /app/apps/web/public ./apps/web/public
USER node
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
