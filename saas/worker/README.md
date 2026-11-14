# Sotto Reads TTS Worker

This is the production cloud voice proxy. The OpenRouter key lives only in the
Worker secret store, never in the Pages bundle or this repository.

## Local test

Create `worker/.dev.vars` with the development key:

```dotenv
OPENROUTER_API_KEY=sk-or-...
OPENROUTER_TTS_MODEL=fish-audio/s2.1-pro-free:free
```

Then run:

```bash
npx wrangler dev --local --port 8790
```

The Worker accepts these origins:

- `https://sottouidraft.pages.dev`
- `https://*.sottouidraft.pages.dev`
- `http://localhost:*`
- `http://127.0.0.1:*`

## Endpoints

- `GET /health`
- `GET /api/tts/status`
- `POST /api/tts` with `{ "text": "...", "speed": 0.92 }`
- `OPTIONS /api/tts` for CORS preflight

`POST` returns raw `audio/mpeg` (no base64), with
`X-Sotto-Provider`, `X-Sotto-Model`, `X-Sotto-Timing`, and
`X-Sotto-Cache` headers.

## Security and efficiency

- Key only in the Worker secret `OPENROUTER_API_KEY`.
- Origin allowlist and per-IP rate limit.
- 2,000-character input cap and 20 KB request cap.
- Edge cache keyed by SHA-256 of `model|speed|text`.
- Direct binary streaming to the browser.
- No request text in logs.

## Deploy

The Worker is uploaded through the Cloudflare MCP using
`workers_legacy_scripts_update`. The secret is then bound through
`workers_secrets_update`, and the `workers.dev` route is enabled through
`workers_legacy_scripts_subdomain_create`.
