# Debian-based "slim" images, not alpine — Prisma's query engine binaries need
# glibc + OpenSSL, which alpine (musl libc) doesn't have by default and requires
# extra binaryTargets config to work around. Slim avoids that whole problem class.
#
# slim still doesn't ship the `openssl` package though, and Prisma needs it at
# both generate-time and runtime to detect which engine to load — hence the
# apt-get install in each stage.

# --- build stage: install deps, generate Prisma client, compile TypeScript ---
FROM node:22-slim AS build
WORKDIR /app

RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

# --- runtime stage: only what's needed to run the compiled server ---
FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY package.json ./

RUN mkdir -p uploads/profile-photos

EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD node -e "fetch('http://localhost:4000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Applies any pending migrations, then starts the server.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
