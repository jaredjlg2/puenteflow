FROM node:20-alpine AS base
WORKDIR /app
RUN corepack enable

COPY package.json pnpm-workspace.yaml .npmrc ./
COPY apps/api/package.json apps/api/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm --filter @puenteflow/db prisma generate
RUN pnpm --filter @puenteflow/api build

EXPOSE 4000
CMD ["node", "apps/api/dist/index.js"]
