# Read & Write — implementation map

Static, browser-only dictation app. No backend, no microphone, no paid APIs. React 19 + TypeScript + Vite. Deployed to Cloudflare Pages from `dist/`.

> **Current product rules**
> - Two advance modes: **Manual** and **Smart**.
> - **Smart is locked until a training session completes.** Training is mandatory once; it is not a per-session toggle.
> - Training is a fixed, built-in dictation passage split into eleven short phrase batches.
> - A three-slide guide explains training before a session starts; the same guide is reachable from the brain menu.
> - Training stores only `{ charCount, durationMs }` per batch; the model is one number: **ms per character**.
> - The clock starts when dictation starts (before playback), and **Next works during playback** so writing completion is captured accurately.
> - No microphone anywhere. `public/_headers` denies it.
> - Normal sessions do **not** update training data. Only the optional end-of-session pacing feedback nudges the model.
> - Batch modes: words / sentence / phrase.

## Stack / commands

```bash
npm install
npm run dev        # Vite dev server
npm run build      # tsc -b && vite build -> dist/
npm run preview
```

Cloudflare Pages: build `npm run build`, output `dist`. `public/_headers` sets COOP/COEP for the threaded ONNX runtime; `public/_redirects` is the SPA fallback.

## File map — where to touch what

| File | Owns |
|---|---|
| `src/App.tsx` | All session state, runtime, timing, training mode, feedback, import/export, view routing, inline `CompletePanel`. **Most changes start here.** |
| `src/components/SetupPanel.tsx` | Setup UI: text tabs, batch mode, engine/voice/speed, Manual/Smart selector, training status, export/import/reset, start buttons. |
| `src/components/SessionPanel.tsx` | Normal dictation UI: preparing/ready/error/active, word highlighting, Smart countdown, Previous/Replay/More time/Next. |
| `src/components/TrainingPanel.tsx` | Training dictation UI: same states, manual-only, progress “Training n of 11”. |
| `src/components/TrainingGuide.tsx` | Three-slide pre-training guide modal: learned pace, write-then-Next discipline, export/import/reset. Opened before training and from the brain menu. |
| `src/components/BrainMenu.tsx` | Header brain button + overlay menu: how training works, export, import, reset. |
| `src/components/FileDrop.tsx` | Drag/drop + file picker, parsing progress. |
| `src/lib/types.ts` | `AppSettings`, `Batch`, `TextStats`, `TrainingRecord`, `TrainingModel`, `SessionStatus`, `AdvanceMode`, `BatchMode`, `FeedbackRating`, TTS interfaces. |
| `src/lib/storage.ts` | localStorage keys, defaults, load/save, `AppSettings` re-export, JSON download/read. |
| `src/lib/model.ts` | Training fit (`trainModel`), prediction (`predictMs`), feedback nudge (`adjustMsPerChar`). |
| `src/lib/text.ts` | `TRAINING_TEXT`, `makeTrainingBatches`, `makeBatches` (words/sentence/phrase), `splitWords`, `getTextStats`, formatting. |
| `src/lib/tts.ts` | `createEngine`, `KittenEngine` (local bundle), `BrowserEngine` (speechSynthesis), `loadKittenBundle`. |
| `src/lib/files.ts` | `parseFile`: PDF (`pdfjs-dist`), DOCX (`mammoth`), text, `cleanMarkdown`. |
| `src/index.css` | Design tokens + all UI classes (Claude-style warm parchment editorial theme: serif headings, terracotta accent, ring shadows). |
| `public/vendor/kittentts-web.js` | Prebuilt KittenTTS bundle, lazy-loaded. Do not edit. |
| `public/_headers`, `_redirects` | Cloudflare headers (COOP/COEP, deny mic) and SPA fallback. |
| `README.md` | User-facing overview/deploy. |
| `DOCUMENTATION.md` | This file. |

Deleted on purpose: `src/lib/vad.ts`, `src/components/TrainingDrawer.tsx`. Do not reintroduce mic/VAD code.

## State model

```ts
AppSettings = {
  engine: 'kitten'|'browser';
  voice: string;
  speed: number;            // 0.5–2.0
  batchSize: number;        // words mode only, 1–20
  batchMode: 'words'|'sentence'|'phrase';
  advanceMode: 'manual'|'smart';
  trainingCompleted: boolean;
  msPerChar: number | null; // mirrored from TrainingModel
}

TrainingRecord = { id; createdAt; charCount; durationMs }
TrainingModel  = { version: 1; sampleCount; msPerChar; trainedAt }
```

`SessionStatus`: `idle | preparing | batch-preparing | ready | playing | your-turn | paused | complete | error` (plus unused `training`). `trainingMode` is a separate React boolean, not a status.

Runtime is a `useRef` object in `App.tsx` (`Runtime`): `engine, batches, index, activeHandle, handleCache, batchStartAt, startedAt, predictedMs, predictedTotal, timer, prefetchTimer, cancelled, token, completing, completedCount, completedWords, training, trainingRecords, recorded`.

**Async safety:** every async op compares `runtime.token`. Keep this pattern when editing.

## Session flow

```
Setup view  (!sessionActive && !completed)
  ├─ Start dictation ──> startSession ──> engine init ──> status 'ready'
  ├─ Start training session ──> TrainingGuide modal ──> Start training ──> startTrainingSession
  │                             (guide also opens from the header brain menu)
  └─ Start training  ──> startTrainingSession ──> engine init ──> status 'ready' + trainingMode
        └─ Begin training ──> beginSession ──> startBatch(0)
Ready ──> Begin ──> startBatch(i)
startBatch:
  stop old audio/timers
  prepare handle (cache or pending prepare or engine.prepare)
  if smart && model: predictedMs = predictMs(model, charCount); predictedTotal = predictedMs
  batchStartAt = performance.now()        // clock starts with dictation
  status 'playing' -> handle.play()
  schedule prefetch of the next 3 batches (120 ms)
after playback:
  training ? status 'your-turn' (manual only)
           : smart && predictedMs ? startSmartTimer()
           : status 'your-turn'
next():
  playing            -> completeBatch('manual')   // can finish early
  batch-preparing    -> ignore
  your-turn/paused   -> completeBatch('smart-manual')
completeBatch:
  guard completing; token++
  duration = now - batchStartAt
  if training && duration>350 && !recorded.has(index): push {charCount,durationMs}; recorded.add
  last batch -> endSession(); else startBatch(i+1) immediately
Smart timer:
  interval 120 ms; remaining = predictedTotal - (now - batchStartAt); at 0 -> completeBatch('smart-auto')
endSession:
  training -> trainModel(records); if >=3 usable: save model, msPerChar, trainingCompleted=true,
              advanceMode='smart', toast, return to setup
  normal   -> completed=true, stats, showFeedback = Boolean(model)
```

## Timing rules (do not regress)

- `runtime.batchStartAt` is set **immediately before** `setStatus('playing')` / `handle.play()` in `startBatch`. It is **not** set after playback.
- `completeBatch` computes `performance.now() - batchStartAt`.
- `next()` **does not block during playback**; it calls `completeBatch('manual')` so a student who finishes writing early stops the clock accurately.
- `Next` is disabled only during `batch-preparing` (no audio yet).
- Session total time uses `runtime.startedAt` (set in `beginSession`), not batch start.
- In the Smart timer, React state `predictedTotal` is the **remaining** time; `runtime.predictedTotal` is the original total. Do not conflate them.
- View selection uses `trainingMode` (React boolean), not `status`. `TrainingPanel` must render across `preparing/ready/playing/your-turn`; `runtime.training` is the source of truth for “manual-only” and for writing training records.

## Training math

`src/lib/model.ts`:

- `filterTrainingRecords`: keep `durationMs` 350–300 000 and `charCount > 0`.
- `trainModel`: needs **≥ 3** usable records. `msPerChar = Σ durationMs / Σ charCount` (weighted by characters). Default 60 if invalid.
- `runtime.recorded` prevents duplicate samples when the student navigates back/replays during training.
- Training is manual-only: `handlePlaybackEnd` forces `your-turn` when `runtime.training`.
- `predictMs(model, charCount)`: `max(800, charCount * msPerChar)`; returns null for invalid model.
- `adjustMsPerChar(model, rating)` factors: `too-slow 0.85`, `a-little-slow 0.925`, `okay 1.0`, `a-little-fast 1.075`, `too-fast 1.15`; clamped 20–500 ms/char.
- Smart mode gives exactly `predictMs(...)` measured from `batchStartAt`; there is no extra grace period.
- The next batch starts in the same task as `completeBatch`; there is no inter-batch cooldown.

Training script is `TRAINING_TEXT` in `src/lib/text.ts` (two-sentence passage joined from `TRAINING_LINES`). `makeTrainingBatches()` makes one batch per line (11 short phrase batches).

## Feedback flow

- `endSession` normal sets `showFeedback = Boolean(modelRef.current)`.
- `CompletePanel` (inline in `App.tsx`) shows 5 rating buttons + Save/Skip when `showFeedback`.
- `handleSubmitFeedback` calls `adjustMsPerChar`, updates `model`/`modelRef`, `settings.msPerChar`, saves settings + training. No new records.
- The Skip button clears the rating and hides the prompt.
- Training sessions return to setup and never show feedback.

## Storage

Keys are **v2**: `dictate.settings.v2`, `dictate.training.v2`. v1 data is intentionally ignored.

`loadSettings` normalizes: if `advanceMode === 'smart'` but not trained or `msPerChar == null`, force `manual`.

Export shape:
```json
{ "records": [...], "model": {...}, "msPerChar": 126 }
```
`handleImport` accepts that shape; if no valid model it retrains from records; if no model, forces Manual.

## TTS

- `createEngine(id)` returns `BrowserEngine` or `KittenEngine`.
- Kitten: lazy-loads `/vendor/kittentts-web.js`, then `KittenTTS.create({ model:'nano-int8', defaultVoice, speed, player, analytics:false, ortNumThreads:1, ortWasmPath:'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.26.0/dist/' })`. Used to work around static-host WASM URL errors. Do not remove `ortWasmPath`.
- `prepare()` returns a `SpeechHandle` with `durationMs`, optional `wordTimings`, `play(onWordIndex)`, `stop()`.
- `handleCache` keys are `engine|voice|speed|text`, max 4. **Never call `stop()` on evicted handles** — all handles share one audio player.
- Browser engine uses `speechSynthesis`, filters English voices, uses `onboundary` for highlighting, estimates duration with `estimateSpeechMs`.
- Prefetch prepares the next three batches 120 ms after playback starts (`runtime.prefetchTimer`), best-effort. `runtime.pendingPrepares` shares in-flight generates between prefetch and `startBatch`.

## File parsing

`src/lib/files.ts`:
- `.txt/.md`: `.md` goes through `cleanMarkdown` (strips fences, inline code, headings, bold/italic, links, images, list markers, blockquotes, rules).
- `.docx`: dynamic `mammoth.extractRawText`.
- `.pdf`: dynamic `pdfjs-dist` + worker via `?url`; `document.destroy()` is wrapped in try/catch because some workers throw `a.destroy is not a function`.
- Size limit 40 MB.

## Batch modes

`makeBatches(text, wordsPerBatch, batchMode)` in `src/lib/text.ts`:
- `words`: chunks of `batchSize` (1–50).
- `sentence`: split on `(?<=[.!?])\s+`.
- `phrase`: split on `(?<=[;:,])\s+`.
- Single sentence/phrase is kept as one batch if ≤ 40 words; otherwise falls back to word chunks.
- `SetupPanel` shows the words stepper only in words mode, and uses a cheap punctuation-count estimate for the batch count.

## Common changes — quick map

| Want to change… | Touch |
|---|---|
| Training script / batch variety | `TRAINING_TEXT` + `makeTrainingBatches` in `src/lib/text.ts` |
| Training math / prediction | `src/lib/model.ts` (`trainModel`, `predictMs`, `adjustMsPerChar`) |
| Smart timing / start of next batch | `predictedTotal` in `startBatch`, `startSmartTimer` origin, direct `startBatch` in `completeBatch` |
| When the clock starts | `runtime.batchStartAt` placement in `startBatch` |
| Feedback options / factors | `CompletePanel` in `src/App.tsx`; factors in `adjustMsPerChar` |
| Add/rename advance mode | `AdvanceMode` in `types.ts`; `DEFAULT_SETTINGS` in `storage.ts`; `SetupPanel` segmented; `handlePlaybackEnd`/`startBatch`/`next` |
| Batch modes | `BatchMode` in `types.ts`; `makeBatches` in `text.ts`; `SetupPanel`; `startSession` |
| Engine/voice behavior | `src/lib/tts.ts`; voices list in `App.tsx` effect |
| PDF/DOCX/Markdown | `src/lib/files.ts` |
| Storage schema | `src/lib/storage.ts` (bump key + version); `types.ts` |
| Theme / minimal styling | `src/index.css` tokens and classes |
| Pre-training guide copy / slides | `src/components/TrainingGuide.tsx` |
| Brain menu items | `src/components/BrainMenu.tsx` + handlers in `App.tsx` |
| Deploy headers | `public/_headers`, `public/_redirects` |

## Known limitations / risks

- Model is a **single ratio** (ms per character), no intercept. Very short batches skew it; the feedback prompt is the correction. A two-parameter linear fit is the natural upgrade.
- Only one training script; retraining replaces the previous model. Abandoning training keeps the old model (or none).
- Training requires ≥ 3 usable batches; the “End training” path can save a partial model.
- `SessionStatus` still contains an unused `'training'` member.
- `src/index.css` retains unused mic-meter styles (`.meter*`) from the removed feature.
- `package.json` still lists `onnxruntime-web`; the app does not import it directly (the vendored bundle carries its own runtime).
- Kitten model + WASM are fetched from public CDNs and cached by the browser. COOP/COEP comes from `_headers`; without it the threaded runtime may fail.
- LocalStorage v2 ignores v1 data. Private mode/quota failures are swallowed; the app still works in memory.
- `npx tsx` self-checks were run for `trainModel`/`predictMs`/`makeBatches`; there is no committed test suite and no live-browser run.

## Verification checklist

```bash
npm run build
npx --yes tsx -e "import { trainModel, predictMs } from './src/lib/model.ts'; const r=[{id:'1',createdAt:'x',charCount:10,durationMs:1000},{id:'2',createdAt:'x',charCount:20,durationMs:2000},{id:'3',createdAt:'x',charCount:30,durationMs:3000}]; const m=trainModel(r as any); if(!m||Math.abs(m.msPerChar-100)>1e-9) throw new Error('model'); if(predictMs(m,15)!==1500) throw new Error('predict'); console.log('model ok');"
npx --yes tsx -e "import { makeTrainingBatches, TRAINING_TEXT } from './src/lib/text.ts'; const b=makeTrainingBatches(); if(b.length<10) throw new Error('batches'); if(b.map(x=>x.text).join(' ')!==TRAINING_TEXT) throw new Error('text'); const s=makeBatches('One two. Three four! Five?','3','sentence'); if(s.length!==3) throw new Error('sentence'); console.log('text ok', b.length);"
```

Then push. Cloudflare Pages should redeploy on `main`.
