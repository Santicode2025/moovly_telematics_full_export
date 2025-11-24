<!-- Copilot / AI agent guidance for contributors working on Moovly Telematics -->
# Quick Orientation — Moovly Telematics

This file contains focused, repo-specific guidance to help an AI coding agent (or a new engineer) become productive quickly. It documents the big-picture architecture, important dev workflows, and project-specific conventions discovered in the codebase.

1) Big picture
- Frontend: React + TypeScript + Vite (client entry in `frontend/src` / `client/src` in some configs). UI pages live under `frontend/src/pages` and components under `frontend/src/components`.
- Backend: Express + TypeScript. Main HTTP/API router is `backend/routes.ts`. Server entry is `backend/index.ts` which starts an Express app and (in dev) integrates Vite. Note: some project tooling and `tsconfig.json` use legacy names (`server/`, `client/`) — double-check file names before starting.
- Shared: cross-cutting types and DB schemas in `shared/` (imports use `@shared/*` path alias).
- Mobile: Expo React Native app in `mobile/` (driver app).

2) How to run (developer-first, verified locations)
- Install (root): `npm install`
- Typical dev run (project has some legacy script names; prefer explicit commands):
  - Start backend (recommended): `npx tsx backend/index.ts`
  - Start frontend dev (if you want to run separately): `cd frontend && npx vite`
  - Mobile: `cd mobile && npx expo start`

Notes:
- The root `package.json` contains `dev` set to `tsx server/index.ts` and `build` that bundles `server/index.ts`. In this repository the server entry exists at `backend/index.ts`. If a CI or dev script fails, prefer running `backend/index.ts` directly or update scripts locally.
- Backend serves both API and client on port `5000` by default (see `backend/index.ts`). Vite integration is proxied from `backend/vite.ts` in middleware mode.

3) Key files to inspect when making changes
- `backend/index.ts` — server boot & session config.
- `backend/routes.ts` — main REST API surface. Mobile API endpoints live under `/api/mobile` and require `authenticateDriver` middleware.
- `backend/storage.ts` — `IStorage` interface and `MemStorage` dev implementation. Many routes call `storage.*` methods; replace or implement these when connecting to a real DB.
- `backend/vite.ts` — in-dev Vite middleware that renders the client. It expects a `client/index.html` in some configs; this repo also has `frontend/index.html` — watch for naming mismatches.
- `shared/schema.ts` — Drizzle ORM schema + Zod input schemas used across backend and frontend. Imports use `@shared/schema`.
- `frontend/src/main.tsx` and `frontend/src/App.tsx` — client entry + top-level app.

4) Project-specific conventions & gotchas
- Path aliases: `@shared/*` is mapped in `tsconfig.json` to `./shared/*`. But tsconfig also references `client/` and `server/` directories; the actual folders here are `frontend/` and `backend/`. Always verify `tsconfig.json` and adjust if you run a local typecheck.
- Storage abstraction: backend uses an `IStorage` contract (`backend/storage.ts`). `MemStorage` is seeded with test data and is the default dev store. Tests or production work should replace it with a Drizzle/Postgres-backed implementation.
- Validation: Zod schemas from `@shared/schema` are used to validate HTTP payloads in `routes.ts`. Prefer reusing those schemas for new endpoints.
- Real-time: Socket.io is used (see `backend/socketio.ts` and `global.io` usages in `routes.ts`). Emissions often use `global.io.emit(...)`.
- File uploads and imports: Multer is configured to use memory storage for uploads (`routes.ts`). Excel import flows rely on `xlsx` and a multi-step user mapping UI.
- Authentication: session-based for web (express-session) and a simplified driver token/PIN flow for mobile (`authenticateDriver` middleware). Driver test account `fleet.driver` with PIN `1234` is seeded in `MemStorage`.
- External APIs: HERE geocoding/autosuggest endpoints proxied at `/api/here/*` — must supply `HERE_API_KEY` env var.

5) DB & migrations
- Drizzle ORM is used; database config and migrations live in `drizzle.config.ts` and `shared/schema.ts`.
- Common commands:
  - `npm run db:push` — push schema (uses `drizzle-kit`)
  - `npm run db:studio` — open Drizzle Studio (if available)

6) Useful patterns to follow when changing code (examples)
- Input validation: use Zod schemas from `@shared/schema` similar to how `app.post('/api/jobs')` parses with `insertJobSchema` and `httpJobSchema`.
- Storage calls: always go through `storage.*` (e.g., `storage.getAllDrivers()`) rather than querying DB directly in route handlers.
- Emitting realtime events: after mutating state, mirror existing pattern `if (global.io) global.io.emit('job:created', { job })`.

7) Safety & testing hints for agents
- Run quick smoke tests: call a couple of endpoints locally (e.g., `GET /api/drivers`, `GET /api/dashboard/stats`) to verify `MemStorage` behavior before attempting DB changes.
- Be cautious editing top-level `package.json` scripts — there are naming inconsistencies (`server/` vs `backend/`, `client/` vs `frontend/`). When in doubt, run the entry file directly with `npx tsx`.

8) Where to look for more context
- Developer overview: `README.md` (root) — has a thorough overview but may describe legacy paths.
- API surface and examples: `backend/routes.ts` (very large; search for the endpoint you need).
- Dev-only data and helpers: `backend/storage.ts` (seed data), `backend/vite.ts` (dev middleware).

If any part of this guidance is unclear or you want more examples (for example: common HTTP payload shapes, Zod schema snippets, or exact dev commands to start both frontend and backend together), tell me which section to expand and I will iterate. 
