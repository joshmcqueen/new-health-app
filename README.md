# Health Tracker

A private, mobile-first health and meal tracker built for an iPhone on a local network. It uses React, Vite, Fastify, raw SQLite, and OpenAI for food-photo analysis and speech transcription.

## Run locally

Requirements: Node.js 22+ and pnpm 11.

```bash
cp .env.example .env
pnpm install
pnpm dev
```

Open `http://localhost:5173`. The SQLite database is created automatically at `data/health.db`.

The Settings screen contains weight and nutrition goals plus development-only data controls. A new database starts with goals of 160 lb, 2,000 calories, 160g protein, 200g carbs, and 65g fat, but no tracked entries. Use **Seed one week of data** to explicitly add a sample week ending today, or **Clear all data** to return the local database to a clean state and restore those goal defaults.

To enable AI features, add an OpenAI API key to `.env`. The nutrition and transcription models can be changed independently:

```dotenv
OPENAI_API_KEY=your-key
OPENAI_NUTRITION_MODEL=gpt-6.1-sol
OPENAI_TRANSCRIPTION_MODEL=gpt-transcribe
```

Prompts are plain text in [`prompts/`](./prompts) and are reloaded for every request during development.

## Use from an iPhone

Safari requires a trusted HTTPS connection for microphone capture. Install `mkcert`, trust its local certificate authority on the phone, and create the files Vite looks for:

```bash
mkdir -p certs
mkcert -key-file certs/local-key.pem -cert-file certs/local-cert.pem localhost 127.0.0.1 "$(hostname).local"
pnpm dev
```

Then visit the displayed `https://<mac-hostname>.local:5173` address from the same network. When certificates are absent, Vite falls back to HTTP for normal desktop development.

## Commands

- `pnpm dev` — run the API and Vite development server.
- `pnpm typecheck` — check client and server TypeScript.
- `pnpm test` — run repository and API tests.
- `pnpm build` — type-check and create the production web and server bundles.
- `pnpm start` — run the compiled Fastify server, which serves `dist/`.

## Docker

Build and run the production container locally:

```bash
docker build -t health-tracker .
docker run --rm \
  -p 3000:3000 \
  -v health-tracker-data:/app/data \
  -e OPENAI_API_KEY=your-key \
  health-tracker
```

Open `http://localhost:3000`. The image serves the React app and API from the same Fastify process, runs as a non-root user, and reports container health through `/api/health`.

The `/app/data` volume is required for durable SQLite data. Photos and recordings are still held only for the duration of each request and are not written to that volume.

## Dokploy and Cloudflare Access

Create a Dokploy application from this repository and select the included `Dockerfile` as the build type. Configure:

```text
Container port: 3000
Health check path: /api/health
Persistent volume mount: /app/data

Environment:
  PORT=3000
  HOST=0.0.0.0
  DATABASE_PATH=/app/data/health.db
  OPENAI_API_KEY=<your key>
  OPENAI_NUTRITION_MODEL=gpt-6.1-sol
  OPENAI_TRANSCRIPTION_MODEL=gpt-transcribe
  OPENAI_IMAGE_DETAIL=high
```

Attach the app's hostname in Dokploy, keep that DNS record proxied through Cloudflare, and put the hostname behind the existing Cloudflare Zero Trust Access application. Cloudflare supplies the public HTTPS connection needed for iPhone microphone access; the container itself should remain HTTP on port 3000 behind Dokploy's reverse proxy. No Cloudflare credentials belong in this container.

Because the app has no built-in authentication, do not expose its origin or port 3000 directly to the public internet. Confirm that requests which bypass Cloudflare are blocked by your tunnel, firewall, or origin rules before entering personal data.

The app intentionally has no authentication. Anyone who can reach it on the network can view and modify its data.
