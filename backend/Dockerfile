# --- build stage: install deps, generate Prisma client, compile TypeScript ---
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

# --- runtime stage: only what's needed to run the compiled server ---
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY package.json ./

RUN mkdir -p uploads/profile-photos

EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget -qO- http://localhost:4000/health || exit 1

# Applies any pending migrations, then starts the server.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
