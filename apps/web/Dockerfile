FROM node:20-alpine AS base
WORKDIR /app
RUN corepack enable

COPY package.json pnpm-workspace.yaml .npmrc ./
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm --filter @puenteflow/web build

EXPOSE 3000
CMD ["pnpm", "--filter", "@puenteflow/web", "start"]
