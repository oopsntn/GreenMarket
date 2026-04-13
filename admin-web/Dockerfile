# ── BUILD ──
FROM node:24-alpine AS build
RUN corepack enable && corepack prepare pnpm@10.30.3 --activate
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

# Build-time env: API base URL injected from docker-compose build args
ARG VITE_API_BASE_URL=http://ntncarameoo.ddns.net:5000/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN pnpm build

# ── SERVE ──
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
