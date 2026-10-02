# Health Tracker v1

## Product

- Mobile-first Safari experience for one user on an internal network.
- Today dashboard, pounds-based weight history, reusable quick foods, daily meal log, current goals, and trend charts.
- Automatic OpenAI estimates from text, voice, direct-camera photos, camera-roll photos, and multiple nutrition labels.
- Apple Health-like visual language with an original layout: bright surfaces, compact cards, colorful metrics, and consistent `lucide-react` icons.

## Architecture

- Single pnpm TypeScript project with Vite/React and a Fastify server.
- Raw `better-sqlite3`, prepared statements, numbered SQL migrations, and focused repository functions; no ORM.
- Zod contracts shared by client and server, React Hook Form for forms, Recharts for charts, and native fetch/hooks for server state.
- Plain CSS, native HTML controls, browser image normalization, and Lucide icons keep the UI layer small.
- SQLite, environment files, uploaded photos, and recorded audio remain outside Git. Photos and audio are discarded after each AI request.
- Production uses a multi-stage Docker image with a non-root runtime, a persistent SQLite volume, and a health check suitable for Dokploy behind Cloudflare Access.

## OpenAI

- Responses API with strict Structured Outputs for nutrition estimates.
- Audio Transcriptions API for recorded descriptions.
- Server-only API key and environment-configurable models.
- Editable prompts in `prompts/`, prompt hashes and model usage stored with AI-created records, and expandable details in the UI.

## Delivery milestones

1. Foundation, raw SQLite persistence, and mobile visual system.
2. Weight, goals, quick-food, and meal tracking.
3. Reusable photo/text/voice AI capture.
4. Charts, iPhone HTTPS testing, accessibility, and production build verification.

Deferred: authentication, offline mode, export/backup UI, and external nutrition databases.
