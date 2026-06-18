ARG NODE_VERSION=22-alpine

# ─── Base ────────────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION} AS base
WORKDIR /app
RUN npm install -g pnpm@11

# ─── Dependencies ────────────────────────────────────────────────────────────
FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml .npmrc ./
COPY apps/web/package.json ./apps/web/package.json
COPY apps/mastra/package.json ./apps/mastra/package.json
RUN mkdir -p packages && pnpm install --frozen-lockfile --filter web...

# ─── Builder ─────────────────────────────────────────────────────────────────
FROM deps AS builder
COPY apps/web/ ./apps/web/
RUN pnpm --filter web exec prisma generate
RUN pnpm --filter web build

# ─── Runner ──────────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION} AS runner
WORKDIR /app
RUN npm install -g prisma@6
COPY --from=builder /app/apps/web/.output ./.output
COPY --from=builder /app/apps/web/prisma ./prisma
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
