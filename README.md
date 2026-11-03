# Read & Write — a private, browser-based dictation tool

Read & Write is a free, static, browser-only dictation app for students. It reads text aloud in small batches (like a teacher dictating notes), then gives you time to write. It can advance manually, or — after a short local training session — use **Smart mode** to estimate when you are finished. There is **no backend, no microphone, and no paid AI API**.

Implementation map for agents: see [DOCUMENTATION.md](./DOCUMENTATION.md).

## Features

- **Input**: PDF, DOCX, TXT, Markdown, or pasted text.
- **Batching**: by words (1–20), by sentence, or by phrase.
- **Text-to-speech**:
  - **KittenTTS Web** — a local neural voice. The model downloads once and is cached by the browser.
  - **Browser speech synthesis** — instant, offline, very light on low-end devices.
  - The next three upcoming batches are prepared in the background, so the next batch starts as soon as the current one ends.
- **Advancement**:
  - **Manual** — you click Next.
  - **Smart** — unlocked after training; advances using your learned pace.
- **Training (required once for Smart mode)**:
  - A three-slide guide explains what training measures and how to time your Next press before the session begins.
  - A built-in training passage with varied batch lengths, long hyphenated words, and mixed word lengths.
  - Each training batch records **character count** and **completion time** (from the start of dictation to when you click Next).
  - The app computes your average **milliseconds per character** and saves it locally.
  - Completing the session unlocks Smart mode and selects it automatically.
- **Feedback adjustment**:
  - At the end of each completed session (when a pace model exists), you can rate the pacing: too slow, a little slow, okay, a little fast, too fast.
  - The saved pace is nudged slightly in the right direction. No per-batch training updates happen silently.
- **Portable data**: export/import your training batches and pace model as JSON, from the setup panel or the header brain menu.
- **Header menu**: a small brain button opens import, export, reset, and a refresher on how training works.
- **Privacy**: no accounts, no uploads, no analytics, no microphone. File parsing, TTS, and timing run in the browser.
- **UI**: minimal blue-and-white theme, responsive, keyboard accessible.

## Stack

- React 19 + TypeScript + Vite
- `pdfjs-dist` for PDF text extraction
- `mammoth` for DOCX text extraction
- `onnxruntime-web` via the KittenTTS Web bundle
- Lucide icons

## Run locally

```bash
npm install
npm run dev
```

Open the URL printed by Vite. On first use of KittenTTS the model downloads from Hugging Face and is cached locally. Choose **Browser voice** to skip the download.

### Build

```bash
npm run build
npm run preview
```

The static site is written to `dist/`.

## Deploy to Cloudflare Pages

1. Push this repository to GitHub.
2. In Cloudflare Pages, create a project from the repository.
3. Build command: `npm run build`
4. Build output directory: `dist`
5. No environment variables are required.

`public/_headers` sets COOP/COEP for the threaded ONNX runtime, and `public/_redirects` serves the SPA fallback. The app is fully static.

## How timing works

- The clock starts **when a batch begins dictating**, not after it finishes.
- It stops when you press Next (or when Smart mode advances).
- Training uses this full window, because you write while the batch is being read.
- Smart mode estimates `characters × ms per character` and advances at that exact time, measured from when dictation for the batch began.
- Outliers (very fast clicks, very long pauses) are ignored when fitting the training data.

## Training data format

```json
{
  "records": [
    { "id": "…", "createdAt": "…", "charCount": 42, "durationMs": 5300 }
  ],
  "model": { "version": 1, "sampleCount": 10, "msPerChar": 126, "trainedAt": "…" },
  "msPerChar": 126
}
```

Upload the same file to restore your pace. Nothing leaves your device.

## Notes

- KittenTTS Web is bundled as a standalone script in `public/vendor/kittentts-web.js` and loaded lazily. Its model and WASM assets come from public CDNs and are cached by the browser.
- The app never sends document text or timing data to a server.
- Training is stored only in `localStorage`; reset it from the setup screen.
- Browser support: current Chrome, Edge, Firefox and Safari. KittenTTS needs WebAssembly. Audio playback starts from a user gesture.

## License

MIT
