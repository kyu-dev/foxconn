# ---- Stage 1: build ----
# Same Node major as local dev
FROM node:26-slim AS build
WORKDIR /app

# pnpm isn't bundled with Node anymore: install the version pinned in package.json
RUN npm install -g pnpm@12.21.0

# Dependencies first: this layer stays cached until the lockfile changes
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# Source last (changes often)
COPY . .
RUN pnpm build

# ---- Stage 2: runtime ----
FROM node:26-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Only the build output (it ships with its own node_modules,
# including the Claude Code native binary pulled in by ai-sdk-provider-claude-code)
COPY --from=build --chown=node:node /app/.mastra/output ./

USER node
EXPOSE 4111
CMD ["node", "index.mjs"]
