# Puenteflow

GoHighLevel-style CRM + messaging + automations MVP.

## Repo structure

```
apps/
  api/        Express API + webhooks
  worker/     BullMQ workflow worker
  web/        Next.js App Router UI
packages/
  db/         Prisma schema + client + seed
  shared/     Shared Zod schemas/types
```

## Full file tree

```
apps/api/Dockerfile
apps/api/package.json
apps/api/src/config.ts
apps/api/src/index.ts
apps/api/src/middleware/auth.ts
apps/api/src/middleware/error.ts
apps/api/src/middleware/rateLimit.ts
apps/api/src/openapi.ts
apps/api/src/queue.ts
apps/api/src/routes/auth.ts
apps/api/src/routes/automations.ts
apps/api/src/routes/contacts.ts
apps/api/src/routes/dashboard.ts
apps/api/src/routes/forms.ts
apps/api/src/routes/health.ts
apps/api/src/routes/inbox.ts
apps/api/src/routes/pipeline.ts
apps/api/src/routes/public.ts
apps/api/src/routes/templates.ts
apps/api/src/routes/webhooks.ts
apps/api/src/routes/workspaces.ts
apps/api/src/services/email.ts
apps/api/src/services/sms.ts
apps/api/src/services/workflows.ts
apps/api/tsconfig.json
apps/web/Dockerfile
apps/web/next-env.d.ts
apps/web/next.config.mjs
apps/web/package.json
apps/web/postcss.config.js
apps/web/src/app/automations/page.tsx
apps/web/src/app/contacts/page.tsx
apps/web/src/app/dashboard/page.tsx
apps/web/src/app/forms/page.tsx
apps/web/src/app/globals.css
apps/web/src/app/inbox/page.tsx
apps/web/src/app/layout.tsx
apps/web/src/app/login/page.tsx
apps/web/src/app/page.tsx
apps/web/src/app/pipeline/page.tsx
apps/web/src/app/signup/page.tsx
apps/web/src/components/AppShell.tsx
apps/web/src/lib/api.ts
apps/web/tailwind.config.ts
apps/web/tsconfig.json
apps/worker/Dockerfile
apps/worker/package.json
apps/worker/src/index.ts
apps/worker/tsconfig.json
packages/db/package.json
packages/db/prisma/schema.prisma
packages/db/prisma/seed.ts
packages/db/src/index.ts
packages/db/tsconfig.json
packages/shared/package.json
packages/shared/src/index.ts
packages/shared/tsconfig.json
.gitignore
.npmrc
README.md
docker-compose.yml
package.json
pnpm-workspace.yaml
render.yaml
```

## Local development

### Local-only setup (no Render billing)

If you want to avoid hosted costs while validating the product, run everything locally
and ignore `render.yaml`. The stack runs with Docker (Postgres + Redis) and local
Node services.

1. Install dependencies:

```bash
pnpm i
```

2. Start Postgres + Redis:

```bash
pnpm db:up
```

3. Run migrations + seed:

```bash
pnpm db:migrate
pnpm db:seed
```

4. Start dev servers:

```bash
pnpm dev
```

- API: http://localhost:4000
- Web: http://localhost:3000
- OpenAPI JSON: http://localhost:4000/docs

To stop the local databases when you are done:

```bash
pnpm db:down
```

## Environment variables

Create `.env` files in `apps/api` and `apps/worker`:

```
DATABASE_URL=postgresql://puenteflow:puenteflow@localhost:5432/puenteflow
REDIS_URL=redis://localhost:6379
JWT_SECRET=dev_secret
JWT_REFRESH_SECRET=dev_refresh
APP_URL=http://localhost:3000
API_URL=http://localhost:4000
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=
```

For the web app (`apps/web/.env.local`):

```
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## Webhooks

### Twilio inbound SMS

Configure your Twilio webhook to:

```
POST {API_URL}/webhooks/twilio/sms?workspaceId=<WORKSPACE_ID>
```

If you configure `TWILIO_AUTH_TOKEN`, signatures are validated.

### SendGrid event webhooks

Configure SendGrid Event Webhook to:

```
POST {API_URL}/webhooks/sendgrid/events
```

If you configure SendGrid Event Webhook signing keys, the signature is verified.

## Seed data

The seed script creates:
- Demo workspace
- Owner user (email: owner@demo.local / password: demo1234)
- Pipeline + stages
- Sample contact, opportunity, and activities
- Sample form + template

Run:

```bash
pnpm db:seed
```

## Notes

- All tenant-scoped models require `workspaceId` in Prisma middleware.
- Automations run via BullMQ jobs in the worker service.
