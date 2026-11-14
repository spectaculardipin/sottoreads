# Sotto Reads — Design Session Reference

Status: **primary visual reference** for the planned working app.
Session date: 14 November 2026.
Final score: **90 / 100** from a fresh-context design critic.
Live mockup: **https://sottouidraft.pages.dev**

This document records the redesign session only. It describes what was built, why it looks the way it does, the exact tokens and copy, and the state of the files. It does not propose a build plan.

---

## 1. Session summary

The starting point was the original blue editorial mockup. The user rated it **25 / 100** and rejected it as not shippable. The direction was reset to **fish.audio** as the primary reference, with explicit visual annotations:

- Change the hero ground to a white / grey gradient with a soft liquid, immersive pastel glow.
- Change the font.
- Rewrite the hero text.
- Make the sample panel black with white elements and text.
- Remove the instrument top-bar labels and the Previous / Replay / Next row.
- Add the new `Smart advance in 0:03` pill with a large `Next`.
- Remove the Listen / Write / Advance micro labels.
- Make the waveform black with rounded bar caps.
- Make the write-it-down surface black with white text, and show the text appearing while dictation plays.
- Minimize the notes section.
- Remove the privacy section.
- Cut the small "Free plan. Browser voice. No account, no upload." line.
- Match Fish Audio's theme at roughly 85% while keeping Sotto's own product story.

The final result is a Fish Audio sibling: warm off-white ground, one strong product object on a real painted stage, black pill actions, a clean medium-weight grotesque, and Sotto's dictation and handwriting story. The blue editorial world, rail, section rules, tracked caps, and monospace label layer were removed.

Final critic verdict: **"The paint lands, the page now reads as Fish's quieter cousin with its own product truth, and it clears 90."**

---

## 2. The design world

Name: **The Quiet Studio**.

A warm off-white room with one black product surface seated on a real painterly canvas. The page is calm and product-first, not editorial. The only chromatic moments are the painted stage and the blush pace band. The rest is paper, ink, and black panels.

What was taken from Fish Audio:

- Off-white / warm grey ground and black type.
- One centered grotesque headline, a short supporting paragraph, two actions.
- A real product surface as the visual argument, seated on a painted stage.
- Black pill primary buttons, outline secondary buttons.
- Minimal nav, generous whitespace, sentence-case labels.
- A dark full-bleed feature band.
- A quiet two-card pricing section and a simple FAQ.

What was not copied:

- Fish's copy, painterly image, exact layout, product UI, tabs, voice selector, or signature sections.
- No fake logos, testimonials, customer counts, benchmarks, or press.

Reference images used during the session:

- `design/inspiration/fish-hero.png`
- `design/inspiration/fish-full.png`
- The user's six annotated screenshots in the thread.

---

## 3. Color tokens

The active token file is `mockup/src/styles/tokens.css`.

### Light

| Token | Value | Role |
|---|---|---|
| `--bg` | `#F5F3EF` | warm off-white page ground |
| `--bg-2` | `#ECE9E2` | recessed surfaces |
| `--surface` | `#FFFFFF` | cards, file card, dialog panels |
| `--surface-2` | `#FAF8F4` | secondary paper |
| `--ink` | `#0B0B0B` | primary type, black buttons |
| `--ink-2` | `#2B2B28` | secondary type |
| `--muted` | `#6B6B66` | supporting text |
| `--line` | `#E6E2DA` | hairlines |
| `--line-strong` | `#C9C5BC` | stronger rules |
| `--panel` | `#0A0A0A` | sample, pace, Pro panels |
| `--panel-2` | `#161616` | raised dark surfaces |
| `--panel-ink` | `#FFFFFF` | type on black |
| `--panel-muted` | `#A6A6A0` | labels on black |
| `--panel-line` | `rgba(255,255,255,0.14)` | dividers on black |
| `--accent` | `#0B0B0B` | the accent is black, not a hue |
| `--focus` | `#0B0B0B` | focus ring on light |
| `--btn-primary-bg` | `#0B0B0B` | primary button |
| `--btn-primary-ink` | `#FFFFFF` | primary button text |
| `--btn-primary-hover` | `#2B2B28` | primary hover |
| `--logo-bg` | `#0B0B0B` | logo mark |
| `--logo-ink` | `#FFFFFF` | logo bars |
| `--chip-pro-bg` | `#0B0B0B` | Pro chip |
| `--chip-pro-ink` | `#FFFFFF` | Pro chip text |
| `--shadow-paper` | `0 18px 50px rgba(20,20,20,0.08)` | file and paper cards |
| `--shadow-panel` | `0 30px 80px rgba(20,20,20,0.18)` | dark product panels |

### Dark

| Token | Value | Role |
|---|---|---|
| `--bg` | `#0A0A0A` | page ground |
| `--bg-2` | `#121212` | recessed surfaces |
| `--surface` | `#141414` | cards |
| `--surface-2` | `#181818` | secondary surface |
| `--ink` | `#F5F3EF` | primary type |
| `--ink-2` | `#D8D4CC` | secondary type |
| `--muted` | `#A09C94` | supporting text |
| `--line` | `#262626` | hairlines |
| `--line-strong` | `#3A3A3A` | stronger rules |
| `--panel` | `#161616` | dark panels |
| `--panel-2` | `#1E1E1E` | raised dark surfaces |
| `--panel-ink` | `#F5F3EF` | type on panels |
| `--panel-muted` | `#A09C94` | labels on panels |
| `--panel-line` | `rgba(255,255,255,0.16)` | dividers |
| `--accent` | `#FFFFFF` | inverted accent |
| `--focus` | `#FFFFFF` | focus ring on dark |
| `--btn-primary-bg` | `#FFFFFF` | primary button |
| `--btn-primary-ink` | `#0B0B0B` | primary text |
| `--btn-primary-hover` | `#E8E4DC` | primary hover |
| `--logo-bg` | `#FFFFFF` | logo mark |
| `--logo-ink` | `#0B0B0B` | logo bars |
| `--chip-pro-bg` | `#FFFFFF` | Pro chip |
| `--chip-pro-ink` | `#0B0B0B` | Pro chip text |
| `--shadow-paper` | `0 18px 50px rgba(0,0,0,0.4)` | paper cards |
| `--shadow-panel` | `0 30px 80px rgba(0,0,0,0.6)` | panels |

### Stage

The stage is a real painted image, not a CSS gradient in the final build.

| Asset | Size | Use |
|---|---|---|
| `mockup/public/stage-light.jpg` | 1400 × 1400 | light mode canvas |
| `mockup/public/stage-dark.jpg` | 1400 × 1400 | dark mode canvas |

Light canvas: cream, warm ochre, dusty rose, pale slate blue. Dark canvas: deep rose, plum, indigo, muted teal, warm cream highlights. Both are oil/gouache impasto with visible bristle drag, palette-knife edges, and canvas weave. They were generated for the mockup.

The stage also has a very light SVG turbulence grain overlay at 6% opacity, multiply in light and screen in dark. The CSS token `--stage` still contains a fallback gradient, but the final stage rule uses the JPG images.

---

## 4. Typography

Active face: **Schibsted Grotesk Variable**.
Loaded in `mockup/src/main.tsx` from `@fontsource-variable/schibsted-grotesk`.
Fallbacks: Helvetica Neue, Arial, sans-serif.

No visible monospace. `--font-mono` maps to Schibsted Grotesk. The UI labels are sentence case, not tracked uppercase.

| Role | Size | Weight | Line height | Tracking |
|---|---|---|---|---|
| Hero H1 | `clamp(44px, 5.2vw, 72px)` | 470 | 1.04 | `-0.02em` |
| Section H2 | `clamp(32px, 3.4vw, 44px)` | 500 | 1.06 | `-0.026em` |
| Pro H2 (split) | `clamp(30px, 3vw, 40px)` | 500 | 1.06 | `-0.026em` |
| Closing H2 | `clamp(38px, 4.6vw, 56px)` | 500 | 1.04 | `-0.03em` |
| Body / hero sub | 16–17px | 400 | 1.55–1.6 | normal |
| Loop step H3 | 22–25px | 560 | 1.2 | `-0.025em` |
| Small labels | 11–13px | 500–600 | normal | normal |

Hero title breaks as two lines at 1440:

> Dictation practice that
> goes quiet while you write.

At 390 it becomes three lines:

> Dictation practice that
> goes quiet while
> you write.

The section titles are deliberately shorter and quieter than the hero. The old 84/60 heavy display type is gone.

---

## 5. Layout system

| Property | Value |
|---|---|
| Max shell | 1180px |
| Working content width | 1120px |
| Page gutters | 48px desktop, 32px tablet, 20px mobile |
| Hero stage | `min(1040px, 100%)` |
| Notes block | 760px |
| Pricing cards | 900px |
| FAQ | 820px |
| Closing | 720px |
| Radii | 20px section objects, 16px panel tops, 24–28px cards/strips, pills 999px |
| Section padding | `clamp(64px, 7vw, 96px)` |
| Breakpoints | 1100px, 980px, 640px |
| Motion easing | `cubic-bezier(0.2, 0, 0, 1)` |

The page has no section rules. Air, alternate surfaces, and full-bleed bands separate the sections.

The hero sits under the transparent nav. The nav is sticky and gets a blurred off-white surface after scroll.

---

## 6. Page architecture

### 6.1 Navigation

Height 70px. Transparent at the top of the page, over the hero glow. On scroll: `rgba(247,247,244,0.9)` with a 16px backdrop blur and a hairline.

- Left: pause-mark logo + `sotto reads` wordmark. The wordmark is Schibsted 650, 20px, with `reads` in muted.
- Center: `How it works`, `Pace`, `Pricing`, `FAQ`.
- Right: circular theme toggle, `Log in` text button, black `Start free` pill.
- Mobile at 900px: links hidden, hamburger opens a full-screen off-white menu with numbered links and actions. Focus is trapped. Escape closes and returns focus.

### 6.2 Hero

The hero is centered, not split.

- `Try free / Browser voice` segmented pill.
- H1: **Dictation practice that goes quiet while you write.**
- Sub: **Load your notes. It speaks one short batch, then waits while you write it down.**
- Actions: black `Start free` pill with arrow; outline `Hear a sample` pill with play icon. While playing, the second button becomes `Stop the sample`.
- Stage: the painted canvas.
- The old four-fact strip and the small "Free plan. Browser voice. No account, no upload." line are removed.

Hero stage:

- Width `min(1040px, 100%)`, min-height 440px.
- Padding `64px 96px 40px`.
- Radius 20px, no shadow.
- Black sample panel inset 96px left/right, bottom closed by 40px of paint. Panel radius `16px 16px 0 0`.
- The panel runs off the original bottom edge idea, then the final revision closes the bottom with paint so the canvas reads as a mat.

Sample panel (`BatchStrip`):

- Black `#0A0A0A`; on dark `#141414` with a soft white border.
- Top row: small pause/waveform mark + `Practice`; circular play/pause button on the right.
- Meter row: white waveform (40 rounded bars, 55% opacity unplayed, 100% hot) and `Batch 4 of 18` on the right.
- Phrase: **The morning light moved slowly across the desk, and the room stayed quiet.** White, 36px at desktop, 24px on mobile, left-aligned. Words have spoken / current / upcoming states; current is underlined; playback uses the browser speech boundary events.
- Foot: `Your turn` / `Reading aloud` on the left; white advance pill on the right:
  - `Smart advance in 0:03`
  - large `Next` with arrow.
- The old instrument top bar, Previous / Replay / Next row, and this-batch progress bar are gone.

### 6.3 The loop

Section title: **One batch at a time.**
Lede: **No timer races you. The next batch waits until you are done.**

One white strip, 1120px wide, 28px radius, hairline border, soft paper shadow, divided into three equal columns with 1px vertical rules.

1. **A short batch, read once.**
   *A few seconds of listening.*
   Visual: black rounded waveform bars on the white strip.

2. **Then you write it down.**
   *The batch stays on screen while you work.*
   Visual: black writing panel with the white line **Small habits, repeated daily** and a blinking white caret. The line is visible at rest. On hover it types once over 2.4s, then holds.

3. **Next, when you're ready.**
   *Press it yourself, or let your pace decide.*
   Visual: black `Smart advance in 0:03 / Next` pill, full width of the column.

No Listen / Write / Advance labels. No numbered steps. On mobile the strip stacks and the dividers become horizontal.

### 6.4 Pace

Full-bleed blush band. Light: `#EDE4DD`, with a soft radial highlight. Dark: `#151016`, with the same radial structure in rose/indigo.

Split layout, 1120px, `0.8fr / 1.2fr`, 48px gap.

Left:

- H2: **It times your handwriting.**
- Lede: **A short training session measures how long each batch takes and turns it into one number. Smart mode uses it to decide when to advance.**

Right:

- Black pace panel, 720px, 24px radius, shadow.
- Head: `Pace model` + `Sample` chip.
- Big number: **420** + `ms per character`.
- 11 grey bars with the last bar white.
- Axis: `Batch 01` / `Batch 11`.
- `Advance` segmented control: `Manual` / `Smart`, Smart selected.
- `After a session` rating chips: `Too slow`, `A little slow`, `Okay`, `A little fast`, `Too fast`.
- The 420 is sample pace data, not a real user metric. The panel is labelled `Sample`.

The band is the second chromatic beat. On mobile it stacks and the heading centers.

### 6.5 Notes

Minimized, centered block. Max 760px, 30px gap.

- H2: **Bring your notes.**
- Lede: **Paste text or drop a PDF, DOCX, TXT, or Markdown file. Sotto Reads splits it into batches in your browser.**
- File type pills: `PDF`, `DOCX`, `TXT`, `MD`.
- One white file card, 440px:
  - Black `PDF` badge.
  - `lecture-07.pdf`
  - `2 pages / 842 words`
  - Three soft skeleton lines.
  - Full-width black `Open the practice room` button.
  - `Your file stays in your browser.`

The old large document sheet, batch list, upload/paste tabs, and workspace are gone.

### 6.6 Pro

Full-bleed dark band. Light: `#0A0A0A`. Dark: `#121212`.

Split layout, 1120px, `0.95fr / 1.05fr`, 48–64px gap, vertically centered.

Left:

- H2: **Studio voices, when the browser voice isn't enough.**
- Lede: **Fish Audio and ElevenLabs voices, hands-free advance, and a support chat inside the session.**

Right:

- Dark panel `#161616`, 20px radius, white hairline.
- Head: `Voice library` + `Pro` chip.
- Rows:
  - `ElevenLabs` / `Cloud voice` / `0:04` (selected)
  - `Fish Audio` / `Cloud voice` / `0:05`
  - `Browser` / `Free plan` / `0:03`
- Rows have a white circular initial (E/F/B), a mini white waveform, and a duration.
- Below: one-column extras.
  - `Hands-free` + a 44px toggle. Copy: **Listening for the end of your batch. The microphone is on only during a session.** Off state: **Turn on to advance when the transcription hears you finish.**
  - `In-session help` + `AI chat` chip. Copy: **Ask a question without losing your place in the batch.**
  - Chat: `Sotto support` / `Online`; user `You` / **How do I slow the pace?**; Sotto / **Smart mode follows your learned pace. Rate the pacing after a session, or switch to Manual.**
- The old three white feature cards above the panel are removed. The panel is the feature demonstration.

On mobile it stacks: dark band, centered heading, panel.

### 6.7 Pricing

Centered heading, max 900px cards.

- H2: **Start free, then add studio voices on Pro.**
- No price lede.

Free card:

- `Free` + `No account` chip.
- `For daily practice.`
- `$0 / free`
- Features:
  - Browser voice on every session
  - PDF, DOCX, TXT, and Markdown
  - Words, sentence, and phrase batches
  - Manual and learned-pace advance
- Black `Start free` button.
- `Runs in your browser.`

Pro card:

- Black in light mode; `#191919` with a white 1px border and a 3px white top rule in dark mode.
- `Pro` + `Studio` chip.
- `For studio voices and hands-free sessions.`
- `$8 / month`
- Features:
  - Everything in Free
  - Fish Audio and ElevenLabs voices
  - Hands-free advance
  - AI support chat
- White `Start Pro` button.
- `Billed monthly.`

The pricing is a mockup presentation. The Pro plan is a design concept, not a working subscription.

### 6.8 FAQ

Centered heading.

- H2: **Before you start.**
- Sub: **If something is still unclear, open an issue on GitHub.**

One-column accordion, max 820px, hairline top and row rules, plus/minus icon.

1. **Does Sotto Reads upload my notes?**
   No. The free plan opens and splits the file in your browser. On Pro, only the text of the batch you are hearing goes to the voice provider.

2. **Do I need an account?**
   Not for the free plan. Pro needs one so your voice settings and subscription can follow you.

3. **What is Smart mode?**
   A short training session measures your writing speed. Smart mode uses it to advance. You can always press Next first.

4. **Which voice do I get for free?**
   Your browser's built-in voice. It is instant and works offline after the page loads. Pro adds Fish Audio and ElevenLabs.

5. **Can I use it offline?**
   The free plan works offline after the page loads, as long as your device voice does not need a network. Pro voices need a connection.

6. **Can I move my pace to another browser?**
   Yes. Export it as JSON and import it on the other browser. It contains your training batches and the pace model.

The old two-column FAQ and side "Open an issue" block are gone.

### 6.9 Closing

A warm cream block, max 720px, centered.

- H2: **Start with one batch.**
- Sub: **Free practice runs in your browser. No install.**
- Black `Start free` pill.
- No kicker, no watermark, no second right-hand action.
- A very soft pastel glow behind the block.
- In dark mode the block is black with white type and a white button.

### 6.10 Footer

Four columns.

- Brand: logo, **A dictation tool for people who write by hand. Free practice runs in your browser. Pro adds studio voices.** Then **Free plan: your file stays in your browser. No account, no upload. Pro needs an account.** An `Open source` chip.
- Product: How it works, Pace, Pricing, FAQ.
- App: Start free, Log in to Pro, GitHub.
- More: Changelog, Support, Docs.
- Bottom: `© 2026 Sotto Reads. The free app is open source.` and `Made for handwritten notes.`
- No theme toggle in the footer; the toggle is in the nav only.

### 6.11 Dialogs

**Practice room** (opens from `Start free` and `Open the practice room`):

- Native dialog, max 1040px, off-white surface, 24px radius.
- Header: logo, `Practice room / sample`, close.
- Ready state: `Browser voice` chip; `A three-batch sample.`; explanation; three facts `3 batches`, `26 words`, `Free plan`; `Begin dictation`; `One batch is read at a time. Press Next when you finish writing.`
- Session state: `Batch 01 / 03`, `26 words / sample`; the same black sample panel with `Manual advance when ready` and `Next`; a note that the full app keeps the place and trains the pace.
- Finish state: check mark, `Session complete.`, a summary, `Practice again`, `Close`.
- The sample uses the real sentence split:
  `The morning light moved slowly across the desk.`
  `Small habits, repeated daily, become the quiet architecture.`
  `Read each phrase aloud, then write it down with care.`

**Auth** (opens from `Log in` and `Start Pro`):

- `Log in` or `Start Pro`; subcopy; email field; `Continue with email`; a demo note: `Demo only. No email is sent. Free practice does not need an account.`
- Submitted state: `Check your inbox`, `A sign-in link is on its way to {email}.`, `Use a different email`.
- No Google/Apple auth in the mockup.

---

## 7. Component and responsive specifications

### Buttons

- Base: 48px min height, 999px radius, Schibsted 520, 15px, 1px `--line-strong` border.
- Primary: black bg / white text in light; white bg / black text in dark.
- Secondary: transparent with a 1px border; hover fills `--surface`.
- Large: 52px min height, 26px side padding.
- Hover: translateY(-1px). Active: translateY(0).
- On black panels, focus rings use white.
- Tap targets are 44px minimum on mobile.

### Nav

- 70px inner height.
- Transparent at the top of the hero; blurred off-white after 8px scroll.
- Mobile menu is a fixed full-screen off-white panel with a focus trap and Escape handling.

### Stage and sample panel

- Stage: 1040 × 440 min, 20px radius, no shadow, painted JPG, 96px side padding, 64px top, 40px bottom paint.
- Panel: 100% width inside the stage, 16px top radius, black, no bottom radius.
- Sample top: 34px play button, `Practice`, white mark.
- Meter: 40 bars, 44px high, gap 4px; batch label right.
- Phrase: 36px desktop / 24px mobile, line-height 1.24.
- Foot: state label left, white pill right; `Smart advance in 0:03` + `Next`.
- On mobile: meter wraps; waveform full width; batch label below; foot stacks; pill full width; the `Smart advance in 0:03` copy stays on one line.

### Breakpoints

| Width | Behavior |
|---|---|
| > 1100 | full layout |
| ≤ 1100 | gutters 32px |
| ≤ 980 | hero stack, stage padding reduced, loop strip stacks, pace and Pro split stack, notes center, pricing stacks |
| ≤ 640 | gutters 20px, hero title 3 lines, actions full width, stage 24px radius, panel 14px top radius, sample foot stacked, section padding 56px, pricing/closing headings centered |

No horizontal overflow at 320, 390, or 1440. Verified with a browser width check.

---

## 8. Motion

- Hero entrance: 720ms rise, 14px, staggered 0/60/120/180/240ms. Reduced motion disables it.
- Hero glow: slow 18s drift. Reduced motion stops it.
- Sample waveform: bars animate only while the browser voice is speaking.
- Word highlight: `speechSynthesis` boundary events; fallback timed highlight if boundaries are unavailable.
- Writing demo: full line at rest; on hover it types once over 2.4s. Reduced motion shows the full line.
- FAQ: 180ms fade/slide on open.
- Buttons: 160ms hover/active.
- Theme: 160–240ms color transitions.
- No scroll-triggered fades, parallax, tilt, carousels, or autoplay audio.

---

## 9. Accessibility

- One `h1`; section headings in order.
- Skip link.
- Visible focus rings; white rings on black surfaces.
- 44px controls on mobile; 40px sample play on desktop.
- Reduced motion honored.
- Native `<dialog>` for practice and auth; Escape and backdrop close; practice dialog has a persistent hidden `h2` for `aria-labelledby`.
- Mobile menu traps focus.
- No unnamed buttons or links in the final audit.
- Contrast: body muted text passes on the warm ground; white on black panels; the black/white button language is high contrast.
- No microphone on the landing page. The Pro mockup describes hands-free advance, but the page does not request microphone permission.

---

## 10. Session ledger

| Round | Score | What changed | Critic outcome |
|---|---:|---|---|
| 1 | 74 | First Fish-direction build: neutral palette, Schibsted, centered hero, black sample panel, advance pill, simplified loop, minimized notes, privacy removed | Strong 74; stage still a card in a ring |
| 2 | 77 | Continuous warm ground, wider stage, 72/44 type scale, cream close, Pro split, section rules removed, dark Pro card, sentence-case labels | Real gains; stage still CSS |
| 3 | 85 | Layered stage, pace band, loop strip, balanced pricing, caps removed | Strong 85; stage still a gradient |
| 4 | 88 | Flat stage, centered notes, full-bleed Pro band, dark rose/indigo, mobile clipping fix | Structural fixes landed; stage still read as CSS |
| 5 | **90** | Real oil/gouache canvas for light and dark, write line pinned, mobile centering, dark Pro band lift | **Hits the bar** |
| 6 | 90 (optional) | Closed the stage bottom with 40px of paint; mobile advance pill on one line | Critic's optional 93 note applied; not re-scored |

The final critic's caveat: the first screen at 1440x900 shows the top of the stage and the sample phrase; the advance pill sits just below the fold. Fish crops its product card too. The optional stage-mat fix was applied after the score.

Screenshots:

- Final scored build: `cook/stills/r13/`
- Final deployed build: `cook/stills/r14/`
- Live capture: `cook/stills/live-final-r14.png`
- Full history: `cook/stills/r01/` through `r14/`

The critic's final words:

> The paint lands, the page now reads as Fish's quieter cousin with its own product truth, and it clears 90.

---

## 11. Files and deployment

### Mockup source

`mockup/`

| File | Role |
|---|---|
| `src/App.tsx` | page composition, theme, dialogs |
| `src/components/Nav.tsx` | sticky nav, mobile menu, focus trap |
| `src/components/Hero.tsx` | centered hero, sample playback |
| `src/components/BatchStrip.tsx` | black sample panel, waveform, phrase, advance pill |
| `src/components/Loop.tsx` | divided three-column strip |
| `src/components/Pace.tsx` | blush band and black pace panel |
| `src/components/Notes.tsx` | centered notes block |
| `src/components/Pro.tsx` | full-bleed dark Pro band and voice panel |
| `src/components/Pricing.tsx` | Free and Pro cards |
| `src/components/Faq.tsx` | one-column accordion |
| `src/components/Closing.tsx` | cream closing |
| `src/components/Footer.tsx` | four-column footer |
| `src/components/AuthDialog.tsx` | mock login / Start Pro |
| `src/components/PracticeDialog.tsx` | three-batch practice room |
| `src/components/Logo.tsx` | pause mark + wordmark |
| `src/components/ThemeToggle.tsx` | light/dark control |
| `src/hooks/useTheme.ts` | persisted theme |
| `src/hooks/useSampleVoice.ts` | browser speech synthesis + word highlighting |
| `src/components/Privacy.tsx` | present in the source, not imported; the privacy section was removed |
| `src/styles/tokens.css` | palette and type tokens |
| `src/styles/base.css` | reset, type, buttons, nav, footer, dialogs |
| `src/styles/sections.css` | earlier layout rules; still loaded, overridden by `fish.css` |
| `src/styles/fish.css` | the final Fish-direction system and overrides |
| `public/stage-light.jpg` | painted stage, light |
| `public/stage-dark.jpg` | painted stage, dark |
| `public/og.png` | 1200 × 630 share image |
| `index.html` | title, description, OG/Twitter, theme boot script |

Cascade order in `src/main.tsx`:

1. `tokens.css`
2. `base.css`
3. `sections.css`
4. `fish.css` (last, owns the final look)

`src/App.css` and `src/index.css` remain from the Vite starter but are not imported. `public/icons.svg` is a starter asset and is not used.

The active font import is Schibsted Grotesk. Geist Mono @font-face imports remain in `main.tsx`, but no visible token references Geist Mono.

### Design and session files

| Path | Contents |
|---|---|
| `design/PRODUCT.md` | product truth and constraints |
| `design/BRIEF.md` | original redesign brief |
| `design/DIRECTION.md` | current Fish-direction design contract |
| `design/ROUNDS.md` | earlier blue round log, marked superseded |
| `cook/BRIEF.md` | Fish redesign brief, bar, rules |
| `cook/SHOTS.md` | reference shots and what to take |
| `cook/ROUNDS.md` | 74 → 77 → 85 → 88 → 90 ledger |
| `cook/stills/r01–r14/` | round screenshots |
| `cook/stills/live-final-r14.png` | final live capture |

### Deployment

- GitHub branch: `design/mockup-redesign` on `spectaculardipin/sottoreads`
- Cloudflare Pages project: `sottouidraft`
- Live: **https://sottouidraft.pages.dev**
- Build command: `npm run build`, root `mockup`, output `dist`
- Theme query for captures: `?theme=light` or `?theme=dark`
- `main` and the production app at `sottoreads.pages.dev` were not changed.

The mockup runs at `http://127.0.0.1:5173/` during design work.

---

## 12. Exact visible copy

### Nav and hero

- `sotto reads`
- `How it works` / `Pace` / `Pricing` / `FAQ`
- `Log in` / `Start free`
- `Try free` / `Browser voice`
- **Dictation practice that goes quiet while you write.**
- **Load your notes. It speaks one short batch, then waits while you write it down.**
- `Start free` / `Hear a sample` / `Stop the sample`
- `Practice` / `Batch 4 of 18`
- **The morning light moved slowly across the desk, and the room stayed quiet.**
- `Your turn` / `Reading aloud`
- `Smart advance in 0:03` / `Next`

### Loop

- **One batch at a time.**
- **No timer races you. The next batch waits until you are done.**
- **A short batch, read once.** / *A few seconds of listening.*
- **Then you write it down.** / *The batch stays on screen while you work.*
- **Next, when you're ready.** / *Press it yourself, or let your pace decide.*
- `Small habits, repeated daily`
- `Smart advance in 0:03` / `Next`

### Pace

- **It times your handwriting.**
- **A short training session measures how long each batch takes and turns it into one number. Smart mode uses it to decide when to advance.**
- `Pace model` / `Sample`
- `420` / `ms per character`
- `Batch 01` / `Batch 11`
- `Advance` / `Manual` / `Smart`
- `After a session`
- `Too slow` / `A little slow` / `Okay` / `A little fast` / `Too fast`

### Notes

- **Bring your notes.**
- **Paste text or drop a PDF, DOCX, TXT, or Markdown file. Sotto Reads splits it into batches in your browser.**
- `PDF` / `DOCX` / `TXT` / `MD`
- `lecture-07.pdf`
- `2 pages / 842 words`
- `Open the practice room`
- `Your file stays in your browser.`

### Pro

- **Studio voices, when the browser voice isn't enough.**
- **Fish Audio and ElevenLabs voices, hands-free advance, and a support chat inside the session.**
- `Voice library` / `Pro`
- `ElevenLabs` / `Cloud voice` / `0:04`
- `Fish Audio` / `Cloud voice` / `0:05`
- `Browser` / `Free plan` / `0:03`
- `Hands-free`
- **Listening for the end of your batch. The microphone is on only during a session.** (off: **Turn on to advance when the transcription hears you finish.**)
- `In-session help` / `AI chat`
- **Ask a question without losing your place in the batch.**
- `Sotto support` / `Online`
- `You` / **How do I slow the pace?**
- `Sotto` / **Smart mode follows your learned pace. Rate the pacing after a session, or switch to Manual.**

### Pricing

- **Start free, then add studio voices on Pro.**
- `Free` / `No account` / `For daily practice.` / `$0` / `/ free`
- `Browser voice on every session`
- `PDF, DOCX, TXT, and Markdown`
- `Words, sentence, and phrase batches`
- `Manual and learned-pace advance`
- `Start free` / `Runs in your browser.`
- `Pro` / `Studio` / `For studio voices and hands-free sessions.` / `$8` / `/ month`
- `Everything in Free`
- `Fish Audio and ElevenLabs voices`
- `Hands-free advance`
- `AI support chat`
- `Start Pro` / `Billed monthly.`

### FAQ

- **Before you start.**
- **If something is still unclear, open an issue on GitHub.**
- The six questions and answers in section 6.8.

### Closing and footer

- **Start with one batch.**
- **Free practice runs in your browser. No install.**
- `Start free`
- **A dictation tool for people who write by hand. Free practice runs in your browser. Pro adds studio voices.**
- **Free plan: your file stays in your browser. No account, no upload. Pro needs an account.**
- `Open source`
- `Product` / `How it works` / `Pace` / `Pricing` / `FAQ`
- `App` / `Start free` / `Log in to Pro` / `GitHub`
- `More` / `Changelog` / `Support` / `Docs`
- `© 2026 Sotto Reads. The free app is open source.`
- `Made for handwritten notes.`

### Practice dialog

- `Practice room / sample`
- `Browser voice`
- **A three-batch sample.**
- **This is the real session view. The voice is your browser's built-in voice, and nothing is saved. The full app adds file upload, batching modes, and a learned pace.**
- `3` / `batches`, `26` / `words`, `Free` / `plan`
- `Begin dictation`
- **One batch is read at a time. Press Next when you finish writing.**
- `Batch 01 / 03` / `26 words / sample`
- `Practice` / `Batch 1 of 3`
- `Reading aloud` / `Manual advance when ready` / `Next` or `Finish`
- **Sample session. The full app keeps your place, trains your pace, and can advance for you.**
- **Session complete.**
- **You worked through 3 batches and 26 words. The full app would show your time and adjust the pace model.**
- `Practice again` / `Close`

### Auth dialog

- `Log in` / `Start Pro`
- `Use the email you want on your Pro account.`
- `Pro is $8 per month. Free practice does not need an account.`
- `Email`
- `Continue with email`
- `Demo only. No email is sent. Free practice does not need an account.`
- `Check your inbox`
- `A sign-in link is on its way to {email}.`
- `Use a different email`

---

## 13. What the mockup does not define

These are states of the mockup, recorded so the reference is not mistaken for a finished product:

- There is no backend, auth, billing, usage metering, cloud TTS, cloud transcription, or OpenAI chat integration. The Pro card, voice library, hands-free toggle, chat, and auth dialog are design surfaces.
- The Free plan uses the browser speech synthesis API for the sample. The Pro voice rows do not play provider audio.
- The stage images are generated for this mockup and should be replaced with licensed or commissioned art in production.
- The pricing is presented as a product proposal: Free $0, Pro $8/month. There is no subscription flow.
- The pace number 420 ms/character and the file metadata 2 pages / 842 words are sample data, not measured product facts.
- The "Smart advance in 0:03" value is a sample remaining-time state, not a live timer from a real session.
- The landing page does not use a microphone. The Pro hands-free control describes a planned feature.
- The first screen at 1440x900 shows the top of the stage and the sample phrase; the advance pill is just below the fold. The critic accepted this as a composition choice.
- The active visible font is Schibsted Grotesk. Geist Mono @font-face files remain in the bundle but no visible token references them.
- The old `Privacy.tsx`, `App.css`, `index.css`, `public/icons.svg`, and much of `sections.css` remain in the source tree but are unused or overridden. The final look is owned by `fish.css`.

---

## 14. Final verdict

The final scored build is **90 / 100**. The critic's verdict:

> The paint lands, the page now reads as Fish's quieter cousin with its own product truth, and it clears 90.

The final deployed build adds the optional stage-mat polish. It is available at **https://sottouidraft.pages.dev**.
