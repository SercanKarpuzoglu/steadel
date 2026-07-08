FROM node:22-alpine AS base
RUN corepack enable pnpm
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

# --- Runtime: Next.js app -------------------------------------------------
FROM node:22-alpine AS app
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S steadel && adduser -S steadel -G steadel
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
USER steadel
EXPOSE 3000
CMD ["node", "server.js"]

# --- Runtime: worker (BullMQ) + migrations ---------------------------------
FROM base AS worker
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
CMD ["pnpm", "worker"]
