# Built from the repo root so the `shared` workspace is in context:
#   docker build -f backend/Dockerfile .
FROM node:22-slim AS base
WORKDIR /app
# Prisma needs OpenSSL at runtime.
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# ---- deps + build ----
FROM base AS build
COPY package.json package-lock.json* ./
COPY shared/package.json ./shared/
COPY backend/package.json ./backend/
RUN npm install --workspace shared --workspace backend --include-workspace-root

COPY shared ./shared
COPY backend ./backend
RUN npm run build --workspace shared \
  && npm run prisma:generate --workspace backend \
  && npm run build --workspace backend

# ---- runtime ----
FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/shared/dist ./shared/dist
COPY --from=build /app/shared/package.json ./shared/package.json
COPY --from=build /app/backend/dist ./backend/dist
COPY --from=build /app/backend/package.json ./backend/package.json
COPY --from=build /app/backend/prisma ./backend/prisma
WORKDIR /app/backend
EXPOSE 4000
CMD ["node", "dist/server.js"]
