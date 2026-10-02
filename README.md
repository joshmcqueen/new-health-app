# Health Tracker

A private, mobile-first health and meal tracker built for an iPhone on a local network. It uses React, Vite, Fastify, raw SQLite, and OpenAI for food-photo analysis and speech transcription.

## Run locally

Requirements: Node.js 22+ and pnpm.

```bash
cp .env.example .env
pnpm install
pnpm dev
```

Open `http://localhost:5173`. The SQLite database is created automatically at `data/health.db`.

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
- `pnpm build` — create the production web bundle.
- `pnpm start` — run the Fastify server, which serves `dist/` when present.

The app intentionally has no authentication. Anyone who can reach it on the network can view and modify its data.
