# Health Tracker contributor guide

## Product intent

Health Tracker is a single-user, mobile-first web app for an iPhone on a private network. Keep workflows fast, the interface polished and Apple Health-like, and the implementation deliberately small. Do not add authentication, multi-user concepts, an ORM, an external nutrition database, Docker, or Dokku configuration unless a later request explicitly adds them.

## Architecture

- pnpm, TypeScript, Vite, React, and React Router on the client.
- Fastify on the server.
- Raw `better-sqlite3` with prepared statements and numbered SQL migrations. Keep SQL inside `server/db`; do not introduce Drizzle or another ORM.
- Zod schemas in `shared/schemas.ts` are the client/server contract.
- React Hook Form handles substantial forms; native fetch and React hooks handle server state.
- Recharts is isolated behind the lazy-loaded Charts route.
- Use `lucide-react` for icons and the existing plain-CSS design system in `src/styles.css`.

## Data behavior

- Weight is pounds-only, with at most one entry per date.
- A quick food represents one normal reusable portion, not a recipe or ingredient tree.
- Meal entries copied from a quick food inherit later quick-food edits until that specific meal is manually edited.
- The app has one current set of goals; current goals are shown over historical charts.
- SQLite lives at `data/health.db` and is intentionally ignored by Git.

## OpenAI behavior

- Keep `OPENAI_API_KEY` server-only. Never log it, expose it to Vite, or commit `.env`.
- Nutrition uses the Responses API with image inputs and strict Structured Outputs.
- Voice descriptions use the Audio Transcriptions API.
- Models are selected through `.env`; do not hard-code a new model without updating `.env.example` and documentation.
- User-editable prompts live in `prompts/`. Preserve prompt hashing and the expandable AI metadata UI.
- Photos and recordings must remain ephemeral and be discarded after each request.
- AI nutrition is always labeled as an estimate and remains editable.

## Working conventions

- Use `pnpm`, never npm.
- Preserve the empty first-run experience; do not commit seed data or databases.
- Favor existing components and CSS variables over new UI dependencies.
- Maintain phone safe areas, touch targets, loading/error/empty states, and responsive desktop behavior.
- Before committing, run `pnpm typecheck`, `pnpm test`, and `pnpm build`.
- Keep `README.md` and `PLAN.md` aligned with material architecture or scope changes.
