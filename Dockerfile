# ---- Base: Node + pnpm ----
# Same Node major as local dev
FROM node:26-slim AS base
WORKDIR /app

# pnpm isn't bundled with Node anymore: install the version pinned in package.json
RUN npm install -g pnpm@12.21.0

# ---- Dev: interactive container for `docker compose`, source mounted from the host ----
FROM base AS dev
# git: the `prepare` script sets the hooks path; the mounted repo belongs to the host user
RUN apt-get update && apt-get install -y --no-install-recommends git \
  && rm -rf /var/lib/apt/lists/* \
  && git config --system --add safe.directory /app
CMD ["sleep", "infinity"]

# ---- Build ----
FROM base AS build

# Dependencies first: this layer stays cached until the lockfile changes
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# Source last (changes often)
COPY . .
RUN pnpm build

# ---- Runtime ----
FROM node:26-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Only the build output (it ships with its own node_modules,
# including the Claude Code native binary pulled in by ai-sdk-provider-claude-code)
COPY --from=build --chown=node:node /app/.mastra/output ./

USER node
EXPOSE 4111
CMD ["node", "index.mjs"]
