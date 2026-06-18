ARG NODE_VERSION=22-alpine

# ─── Base ────────────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION} AS base
WORKDIR /app
RUN npm install -g pnpm@11

# ─── Dependencies ────────────────────────────────────────────────────────────
FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml .npmrc ./
COPY apps/mastra/package.json ./apps/mastra/package.json
COPY apps/web/package.json ./apps/web/package.json
RUN mkdir -p packages && pnpm install --frozen-lockfile --filter mastra-app...

# ─── Builder ─────────────────────────────────────────────────────────────────
FROM deps AS builder
COPY apps/mastra/ ./apps/mastra/
RUN pnpm --filter mastra-app build

# ─── Runner ──────────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION} AS runner
WORKDIR /app
COPY --from=builder /app/apps/mastra/.mastra/output ./
ENV NODE_ENV=production
EXPOSE 4111
CMD ["node", "index.mjs"]
