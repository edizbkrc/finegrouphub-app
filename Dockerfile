# syntax=docker/dockerfile:1
FROM node:22-alpine AS base

# ":test" | ":production" — hangi `.env.*` dosyasının build'e gireceğini belirler
# (bkz. next.config.ts, docs/API_ADAPTER.md §8.4: env değişkenleri BUILD-TIME gömülür).
ARG BUILD_ENV=":test"

# ── deps: yalnızca bağımlılıklar (katman cache'i için ayrı) ─────────────
FROM base AS deps
# https://github.com/nodejs/docker-node/tree/main/docs/BestPractices.md#nodealpine
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* .npmrc* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi

# ── builder: kaynak + build ──────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

RUN \
  if [ -f yarn.lock ]; then yarn run "build${BUILD_ENV}"; \
  elif [ -f package-lock.json ]; then npm run "build${BUILD_ENV}"; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm run "build${BUILD_ENV}"; \
  else echo "Lockfile not found." && exit 1; \
  fi

# ── runner: minimal çalışma imajı ────────────────────────────────────────
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# `output: "standalone"` (next.config.ts) çıktısı `public/` ve `.next/static`'i
# İÇERMEZ — ayrıca kopyalanmazsa CSS/görseller 404 verir.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
