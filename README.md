# Read & Write — a private, browser-based dictation tool

Read & Write is a free, static, browser-only dictation app for students. It reads text aloud in small batches (like a teacher dictating notes), then gives you time to write. It can advance manually, use the microphone to detect speech and pauses, or — after an optional local training period — predict when you are likely finished using maths only. There is **no backend and no paid AI API**.

## Features

- **Input**: PDF, DOCX, TXT, Markdown, or pasted text.
- **Chunking**: adjustable batch size (1–8 words), with optional paragraph breaks.
- **Text-to-speech**:
  - **KittenTTS Web** — a local neural voice. The ~25 MB model is downloaded once and cached by the browser (Cache API). No text or audio is sent to a server.
  - **Browser speech synthesis** — instant, offline, and very light on low-end devices.
  - Background preparation of upcoming batches so playback starts quickly.
- **Advancement modes**:
  - **Manual** — you click Next.
  - **Mic** — lightweight energy/pause detection estimates when you have spoken enough, then advances after a short silence. Audio is analysed in memory and never recorded or uploaded.
  - **Predicted** — after optional training, a local regression model predicts how long you need. The model works without microphone access.
- **Optional training mode (opt-in)**:
  - Collects batch features (word count, character count, average word length, syllables, punctuation) and your completion times.
  - Fits a local ridge regression model with continuous adaptation.
  - Shows learned pace, model readiness, and predicted times.
  - Exports/imports training data and model parameters as JSON.
  - Stored only in `localStorage`; reset or disable at any time.
- **Privacy**: no accounts, no uploads, no analytics. File parsing and TTS run in the browser.
- **UI**: minimal blue-and-white theme, responsive, keyboard accessible.

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS 3 (used sparingly; the app uses a small custom CSS layer)
- `pdfjs-dist` for PDF text extraction
- `mammoth` for DOCX text extraction
- `onnxruntime-web` via the KittenTTS Web bundle
- Lucide icons

## Run locally

```bash
npm install
npm run dev
```

Open the URL printed by Vite. On first use of KittenTTS the model downloads from Hugging Face and is cached locally. You can choose **Browser speech** in Settings to skip the download entirely.

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

`public/_headers` sets COOP/COEP so the threaded ONNX runtime can use `SharedArrayBuffer`, and `public/_redirects` serves the SPA fallback. The app is fully static.

## How the prediction works

During training the app records, for each completed batch:

- words, characters, average word length, syllables, punctuation, batch size
- time taken to copy the batch (ms)
- pause before the batch started (ms)
- TTS engine and speed

A local ridge regression (with standardised features and a small L2 penalty) estimates `ms per word`. Predictions are clamped to sensible bounds and blended with a rolling median of your recent pace. The model updates after every recorded batch and can be exported/imported as JSON. No microphone is needed once the model is trained.

## Microphone mode

Mic mode uses the Web Audio API to compute short-window RMS energy. It tracks speech/silence segments and estimates the number of spoken words from the duration of voiced audio. When enough speech is detected and a pause follows, the batch completes. Audio is processed in memory and is never stored. Permission is requested only when you start a session in Mic or Predicted mode; you can always fall back to Next.

## Training data format

The JSON export contains:

```json
{
  "version": 1,
  "exportedAt": "2026-…",
  "settings": { "enabled": true, "minSamples": 8, "graceMs": 2500 },
  "records": [ … ],
  "model": { "sampleCount": 12, "coefficients": [ … ], … }
}
```

Upload the same file to restore your personalised model. Nothing leaves your device.

## Notes

- KittenTTS Web is bundled as a standalone script in `public/vendor/kittentts-web.js` and loaded lazily. Its model and WASM assets are fetched from public CDNs (Hugging Face and jsDelivr) and cached by the browser.
- The app never sends document text or microphone audio to a server.
- Training is strictly opt-in and local.
- Browser support: current Chrome, Edge, Firefox and Safari. KittenTTS needs WebAssembly; Mic mode needs `getUserMedia` and an AudioContext. On iOS, audio playback must start from a user gesture.

## License

MIT
