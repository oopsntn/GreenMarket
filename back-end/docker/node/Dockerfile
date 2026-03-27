# ---- BASE ----
FROM node:24-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.30.3 --activate
WORKDIR /app

# ---- DEPENDENCIES ----
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ---- BUILD ----
FROM deps AS build
COPY . .
RUN pnpm build

# ---- PRODUCTION ----
FROM node:24-alpine AS prod
RUN corepack enable && corepack prepare pnpm@10.30.3 --activate
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN sed -i 's/"type": "module"/"type": "commonjs"/' package.json
RUN pnpm install --frozen-lockfile --prod

COPY --from=build /app/dist ./dist

EXPOSE 5000
CMD ["pnpm", "start"]