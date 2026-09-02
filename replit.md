# Agentic Commerce Platform

An opinionated storefront that serves both human buyers and autonomous shopping agents.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/agentic-commerce/` — user-facing storefront artifact
- `supabase/migrations/` — Supabase schema migrations
- `docs/nextjs-package.json` — planned Next.js dependency contract from the architecture brief

## Architecture decisions

- The catalog stores agent-readable specifications in JSONB and exposes a materialized UCP/Schema.org projection.
- Orders allow either an authenticated human user or a nullable machine `agent_id`.
- The current review slice stops before API routes, payment setup, and agent protocol handlers.

## Product

- Conversational product discovery for human shoppers
- Inventory and trend-aware catalog presentation
- Structured catalog and checkout surfaces for autonomous agents

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
