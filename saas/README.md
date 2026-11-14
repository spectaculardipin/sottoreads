# Sotto Reads — SaaS product build

This is the working product build that follows the approved mockup in
`../design/REDESIGN-REFERENCE.md` (`https://sottouidraft.pages.dev`).

Two routes:

| Route | What it is |
|---|---|
| `/` | The landing page, with the **free room directly below the hero** |
| `/app` | The **Pro studio**, opened directly from the Pro pricing button (no login or payment yet) |

## What works

**Free room (`/` → Free practice)**

- Paste text, or upload PDF, DOCX, TXT, or Markdown.
- Sentence, phrase, or word batches.
- Browser speech synthesis only. No cloud request, no account, no upload.
- Word-by-word highlight from the browser's speech boundary events.
- Manual or Smart advance. Smart learns your writing pace from completed batches.
- Everything runs in the browser.

**Pro studio (`/app`)**

- Fish Audio S2.1 cloud voice through the secure Worker.
- Four upcoming batches are generated in the background and shown in the cloud queue.
- Word-by-word highlight:
  - **Fish Audio direct** returns real alignment segments → exact highlighting
    (available in the local dev proxy).
  - **OpenRouter's Fish S2.1 free model** returns audio only → timing is estimated
    from the decoded audio length and the words. The production player labels it
    "Estimated word timing".
- Automatic audio warmup:
  - The audio graph is resumed and a silent buffer is pushed through it on the
    first gesture.
  - Cloud audio is decoded, padded with 120 ms of lead-in and 80 ms of tail,
    and scheduled on the Web Audio clock with a short lookahead.
  - This removes the clipped first word caused by starting an `<audio>` element
    while the device output is still waking up.
- Manual or Smart advance, pace model stored locally.
- Keyboard: Space play/pause, N next, P previous, R replay.
- Browser voice fallback if no cloud key is configured, with a clear setup card.

## Run it

```bash
cd saas
npm install
npm run dev
```

Open `http://localhost:5173/`. The Pro studio is at `/app`.

## Cloud voice architecture

The browser never sees a key.

- **Production:** a standalone Cloudflare Worker at
  `https://sotto-tts.spectaculardipin.workers.dev`
  - `GET /api/tts/status`
  - `POST /api/tts`
  - `OPTIONS /api/tts`
  - The OpenRouter key lives only in the Worker secret `OPENROUTER_API_KEY`.
  - Origin allowlist, 60 requests/minute/IP, 2,000-character input cap,
    SHA-256 edge cache, and direct binary audio streaming.
- **Local development:** the Vite proxy in `vite.config.ts` for offline/mock
  work. Point `VITE_TTS_API_BASE` at the Worker to develop against the real
  cloud voice without a local key.

The production build automatically uses the Worker. For local development
against the live Worker:

```dotenv
# .env.local
VITE_TTS_API_BASE=https://sotto-tts.spectaculardipin.workers.dev
```

For local proxy work without the Worker, add one key to `.env.local`:

```dotenv
OPENROUTER_API_KEY=sk-or-...
# or
FISH_API_KEY=...
```

Local proxy defaults:

- OpenRouter model: `fish-audio/s2.1-pro-free:free`
- Fish Audio model: `s2.1-pro-free`
- If both keys exist, Fish Audio direct is preferred. Override with
  `TTS_DEFAULT_PROVIDER=openrouter`.

The `*-free` routes are development/evaluation routes under Fish Audio's fair
use terms. Before charging for Pro, point `FISH_MODEL` or
`OPENROUTER_TTS_MODEL` at a paid production model and review the provider
terms.

### Test the full pipeline without a key

```dotenv
TTS_MOCK=1
```

This generates a short tone-based WAV with exact timings, so the queue,
warmup, playback, and word highlighting can be verified offline. The UI shows a
"Mock cloud voice" notice. Remove the line for real speech.

### Test the real provider adapters without a key

A local fake upstream exercises the actual Fish SSE timestamp parser or the
OpenRouter binary response:

```bash
# terminal 1
npx tsx scripts/fake-upstream.ts

# terminal 2 — Fish Audio adapter
FISH_API_KEY=fake FISH_API_BASE=http://127.0.0.1:5199 npm run dev

# or — OpenRouter adapter
OPENROUTER_API_KEY=fake OPENROUTER_API_BASE=http://127.0.0.1:5199 npm run dev
```

This was verified end to end: the Fish adapter returned four exact segments
from two SSE audio chunks, and the Pro player showed "Exact word timing" while
the highlight moved through the words. The OpenRouter adapter returned audio
with no segments and the player showed "Estimated word timing".

## Checks

```bash
npm run check:core   # batching, alignment mapping, pace model
npm run build        # type-check + production build
```

The build was also exercised in a real browser through the `browse` tool:

- Free room: paste, start, browser speech, boundary highlighting, Next.
- Pro studio with `TTS_MOCK=1`: start, 4/4 queue ready, exact highlight,
  manual Next, queue top-up, Smart countdown, auto-advance, completion.
- Pro studio without a key: browser fallback, cloud setup notice, start works.
- Mobile at 390 px: source first, then the player, no horizontal overflow.
- Pro pricing button → `/app`.

## Deploy

**Worker**

- Name: `sotto-tts`
- URL: `https://sotto-tts.spectaculardipin.workers.dev`
- Config: `worker/wrangler.jsonc`
- Secret: `OPENROUTER_API_KEY` (Worker secret store, never in the bundle)
- `worker/README.md` has the endpoint and security notes.

**Pages**

- Project: `sottouidraft`
- Build command: `npm run build`
- Output directory: `dist`
- Root directory: `saas`
- `public/_redirects` rewrites `/app` to `index.html`.
- The production frontend calls the Worker directly; no Pages Function is
  needed.

## Known limits (v1)

- No accounts, billing, or subscription enforcement. `/app` is open on purpose
  for this development phase.
- The Worker has an origin allowlist, simple per-isolate rate limit, input cap,
  and edge cache. It is not a substitute for user authentication. **Do not put
  a paid provider key behind a public Pro button without adding real auth and
  a durable rate limit.**
- OpenRouter does not expose word alignment. Highlighting there is estimated.
  Direct Fish Audio uses exact segments.
- The mock voice is a development aid only.
- The marketing Pace/Pro panels are visual samples; the real settings live in
  the free room and the Pro studio.
- Browser speech depends on the device voice. Some engines do not emit
  boundary events; a timed fallback is used.
- The free room is browser-voice only by design.

## File map

```
saas/
  worker/src/index.js        production TTS Worker (secret, CORS, cache, limits)
  worker/wrangler.jsonc      Worker config
  server/tts-core.ts         local Vite proxy providers (dev/mock only)
  src/hooks/useDictation.ts  session engine, prefetch, warm start, pace
  src/lib/audio.ts           AudioContext, silent warmup, padding, decode
  src/lib/browserSpeech.ts   browser voice + boundary highlight + fallback
  src/lib/cloud.ts           Worker/local TTS client, binary + JSON responses
  src/lib/timings.ts         alignment mapping + estimated timings
  src/lib/text.ts            batching, samples, formatting
  src/lib/pace.ts            learned ms/character model
  src/components/FreePractice.tsx
  src/components/app/        Pro studio shell and panels
  src/components/session/    shared black player, waveform, word phrase
  src/styles/product.css     free room + Pro studio styles
```

The original design mockup remains in `../mockup/` and the previous static app
remains in `../dictation-tool/`.
