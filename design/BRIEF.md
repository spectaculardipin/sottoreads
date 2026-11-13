# Sotto Reads redesign brief

## Objective

Build a completely new high-fidelity UI mockup for Sotto Reads as a full SaaS landing page, not only the dictation tool. The page must present the current free product and the planned Pro plan clearly, in both light and dark mode.

This is a design draft. It does not need to be fully functional. It must look and read like a product a real company would ship.

## Audience

Students who write by hand and study with notes, PDFs, and textbooks. They are in a quiet session, often with headphones. They care about focus, privacy, and control over pace.

## Deliverable

- A React + Vite mockup in `mockup/`.
- A full landing page: navigation, hero with a real product surface, how it works, Smart pace, input and batching, privacy, Pro features, pricing, FAQ, final call to action, footer.
- Light and dark mode, fully designed, not inverted.
- Responsive at 1440 and 390 at minimum.
- Theme toggle, working sample playback through the browser voice, working tabs or accordions, hover and press states, focus states, reduced-motion support.
- Design state in `design/`: BRIEF.md, PRODUCT.md, DIRECTION.md, ROUNDS.md, shots per round.

## Inspiration

Reference sites: luvvoice.com, fish.audio, invideo.io/tools/ai-text-to-speech.

Extract principles only, never layouts:

- Put the real tool on the first screen at meaningful scale.
- One very large type idea carries the first viewport.
- Structure the ground with hairlines or a faint grid instead of gradients.
- One dark object on a light page (or one light object on a dark page) creates focus.
- Keep the palette restrained; let the product surface carry density and color.
- Small numbered annotations and mono labels add editorial credibility.
- Show real controls and real states, not abstract feature illustrations.
- Whitespace is the layout.

Do not copy any reference's composition, copy, imagery, or signature effect.

## Design constraints

- Completely new visual world. The current warm parchment, terracotta, serif identity is an anti-reference.
- Palette and type system lock after round 3.
- Default move is remove, not add.
- No purple-to-blue gradient hero, no icon tile above every heading, no cards inside cards, no three-adjective lists, no "seamlessly / elevate / unlock / robust", no em dashes used for rhythm, no gray text on colored backgrounds.
- No invented metrics, testimonials, customer logos, press, or benchmarks.
- Pricing: Free $0, Pro $8 per month, presented without a caveat.
- Free plan: browser voice only. Pro: cloud voices from Fish Audio and ElevenLabs, hands-free advance, AI support chat.

## Process

- Minimum 15 rounds, hard stop at 3 hours.
- Each round: change the top finding, screenshot at 1440 and 390 in both themes, get a fresh-context review, apply the highest-leverage fix, log the round.
- Revert any round that scores lower than the previous one.
- Stop early only if the last three rounds all score 9+ on every axis with zero P0 findings.

## Rubric (0-10 each, total /80)

1. Hierarchy
2. Typography
3. Layout and rhythm
4. Color
5. Motion
6. Copy
7. Slop-free
8. Accessibility

## Finish

- Leaderboard of every round.
- Screenshots for the best round and the last round.
- Plain statement of which rounds were wasted and why.
- Recommendation.
- Deploy to Cloudflare Pages as `sottouidraft.pages.dev`.
- Send the result to spectaculardipin@gmail.com.
