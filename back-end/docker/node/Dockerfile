FROM node:24.14.0

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy dependencies for caching
COPY package.json pnpm-lock.yaml ./

# Install ALL deps (important for Drizzle + TypeScript)
RUN pnpm install --frozen-lockfile

# Copy all source
COPY . .

# Build TypeScript
RUN pnpm build

EXPOSE 5000

# Start server
CMD ["pnpm", "start"]