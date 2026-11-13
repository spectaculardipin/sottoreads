# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React 19 + Vite + TypeScript for the mockup. Custom token-driven CSS and accessible primitives built in the shadcn/ui pattern (no component CLI). The production app already uses React 19 + Vite + TypeScript.

## Users

Students who write by hand: secondary school, university, and language learners working through lecture notes, textbook passages, and vocabulary. They are in a quiet study session, often with headphones, a notebook, and a PDF or document open. Their job is to hear a short piece of text, hold it in their head, write it down accurately, and keep moving without breaking concentration.

## Product Purpose

Sotto Reads is a dictation practice tool. It reads notes aloud in small batches, then gives the writer time to write each batch by hand before moving on. It exists because passive reading and typing do not build the same recall or handwriting fluency as hearing a line and reproducing it.

Success means the writer stays in the session: the next batch arrives only when they are ready, the pace fits their actual writing speed, and no setup step breaks concentration.

## Positioning

Sotto Reads learns a personal writing pace from a short training session and uses it to advance dictation automatically. The pace model is local, portable, and explainable: one number, milliseconds per character, trained on the writer's own batches. The free plan runs in the browser with no account and no upload. A neighboring dictation app cannot truthfully copy both the local-first data path and the learned-pace mechanism without changing its architecture.

## Operating Context

- Load text by pasting it or by dropping a PDF, DOCX, TXT, or Markdown file.
- Choose a batch mode: words (1 to 20 per batch), sentence, or phrase.
- Choose a voice and speed. The free plan uses the browser's built-in speech synthesis.
- Start a session. Each batch is spoken once while the writer writes it by hand.
- Advance manually with Next, or train Smart mode and let the learned pace advance.
- Smart mode requires one training session of 11 short batches. Training records character count and completion time, then fits a single ratio: milliseconds per character.
- After a session, the writer can rate the pacing and nudge the model.
- Pace data exports and imports as JSON. It lives in localStorage on the current browser.
- The current app is fully static and deployed on Cloudflare Pages.

## Capabilities and Constraints

Confirmed in the current product:

- Input: PDF, DOCX, TXT, Markdown, or pasted text. PDF and DOCX parsing happen in the browser. File size limit is 40 MB.
- Batch modes: words, sentence, phrase.
- Free voice: browser speech synthesis only.
- Local neural voice (KittenTTS) exists in the current app but is not part of the free plan in this redesign.
- Manual advance and Smart advance. Smart is locked until the 11-batch training session completes.
- Training model: weighted milliseconds per character, minimum three usable batches, feedback adjustment after a session.
- Local storage keys: `dictate.settings.v2`, `dictate.training.v2`. Export/import JSON.
- No account, no analytics, no microphone in the current build. `_headers` denies microphone access.
- Responsive web app, keyboard accessible, reduced-motion aware.

Planned paid plan, approved for this mockup:

- Cloud voices from Fish Audio and ElevenLabs.
- Hands-free advance using cloud transcription.
- In-app AI support chat.
- Paid subscription with an account.
- Pricing shown in the mockup: Free $0, Pro $8 per month. Treated as the final proposed pricing for this design round.

Undecided or not yet built:

- Exact cloud voice catalogue and names.
- Which transcription provider powers hands-free advance.
- Whether pace data syncs to an account or stays local on Pro.
- Billing provider and tax handling.

## Brand Commitments

- Name: Sotto Reads. The name refers to sotto voce, a quiet voice meant to be heard closely.
- Voice: plain, calm, specific. No hype, no grand claims, no fake urgency.
- The product is open source. The free browser app is public on GitHub.
- No invented testimonials, customer counts, benchmarks, press mentions, or logos.
- The free plan must remain genuinely useful without an account.

## Evidence on Hand

- Live app: https://sottoreads.pages.dev
- Repository: https://github.com/spectaculardipin/sottoreads
- Current README, implementation documentation, and two product screenshots in `dictation-tool/docs/`.
- Real sample text used by the app: "The morning light moved slowly across the desk. Small habits, repeated daily, become the quiet architecture of a good life. Read each phrase aloud, then write it down with care."
- Real training text: an 11-line lighthouse and explorer passage in `src/lib/text.ts`.

Absent and not to be fabricated: testimonials, named customers, usage numbers, press coverage, benchmark scores, investor logos, awards, and social proof of any kind.

## Product Principles

1. Protect the study session. Every screen should reduce the distance between hearing a batch and writing it.
2. Privacy is the default, not a feature tier. Free practice never needs an account or an upload.
3. The writer owns the pace. The app estimates, the writer can always override.
4. Show the real tool. The product is the proof; no abstract illustrations pretending to be it.
5. Say the true thing. No invented proof, no inflated claims, no dark-pattern urgency.

## Accessibility & Inclusion

- Target WCAG 2.2 AA contrast for text and controls in both themes.
- Full keyboard access, visible focus rings, skip link, labelled controls, semantic headings.
- Respect `prefers-reduced-motion`; nothing important depends on motion.
- Touch targets at least 44px on mobile.
- No audio autoplay. The sample is user-initiated and can be stopped.
