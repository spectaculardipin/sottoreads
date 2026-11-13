# Sotto Reads — UI mockup

A high-fidelity redesign draft for Sotto Reads. Full SaaS landing page, light and dark mode, with a working browser-voice sample and a practice-room dialog.

This is a design mockup, not the production app. The production app lives in `../dictation-tool/`.

## Run

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:5173/`. Append `?theme=light` or `?theme=dark` to force a theme for screenshots.

## Build

```bash
npm run build
npm run preview
```

Output: `dist/`.

## Deploy

Cloudflare Pages:

- Build command: `npm run build`
- Output directory: `dist`
- No environment variables.

## Structure

- `src/App.tsx`: page composition and dialog state.
- `src/components/`: navigation, hero batch strip, sections, pricing, FAQ, footer, auth and practice dialogs.
- `src/styles/tokens.css`: palette and type tokens for both themes.
- `src/styles/base.css`: reset, type, buttons, header, footer, dialogs.
- `src/styles/sections.css`: page sections and responsive rules.
- `src/hooks/useTheme.ts`: persisted light/dark theme.
- `src/hooks/useSampleVoice.ts`: browser speech synthesis with word highlighting and a timed fallback.

Design notes live in `../design/` (PRODUCT.md, DIRECTION.md, ROUNDS.md, screenshots).
