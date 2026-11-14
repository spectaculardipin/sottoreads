# Direction

Status: current. Supersedes the blue editorial direction. Built in the Fish Audio redesign pass.

## The world: The Quiet Studio

A warm off-white room with one black product surface on a muted painted stage. The page is closer to a recording studio's product page than an editorial magazine: calm ground, one strong object, black pill actions, and a small amount of pastel color carrying the product.

Reference bar: fish.audio. Match its theme at roughly 85% and keep Sotto's own product truth.

## Palette

| Token | Hex | Role |
|---|---|---|
| `--bg` | `#F5F3EF` | warm off-white ground |
| `--surface` | `#FFFFFF` | cards, file panel |
| `--ink` | `#0B0B0B` | type, buttons |
| `--muted` | `#6B6B66` | supporting text |
| `--line` | `#E6E2DA` | hairlines |
| `--panel` | `#0A0A0A` | sample panel, pace panel, Pro panel |
| `--panel-ink` | `#FFFFFF` | text on black |
| `--stage` | `#DCC9C3 → #D2C3C6 → #C9CFD8` | muted pastel canvas |
| dark ground | `#0A0A0A` | night page |
| dark panel | `#141414` | raised product surfaces |
| dark stage | `#2A2628 → #232326 → #1D2024` | graphite canvas |

No blue accent. No gradients in type. The pastel lives on the stage and the pace band, not as decoration on the whole page.

## Type

- **Schibsted Grotesk Variable** for everything visible.
- Hero: 72px, weight 470, line-height 1.04, tracking `-0.02em`.
- Section titles: 44px, weight 500, tracking `-0.026em`.
- Body: 16 to 17px, weight 400.
- Labels: sentence case, 11 to 13px. No tracked uppercase micro-labels.
- No monospace in the visible interface. Data labels use the same grotesque at small sizes.

## Signature

**The stage and the sample panel.** A muted pastel canvas with grain, the black practice panel inset 96px and running off the bottom edge, and the white advance pill inside it: "Smart advance in 0:03" with "Next". This is the one object that must feel like the product.

Supporting marks:

- The black pill button, used everywhere as the primary action.
- The divided three-step strip, not three floating cards.
- The pastel pace band, a full-bleed second chromatic beat with the heading left and the black pace panel right.
- The cream closing block with one black button.

## Layout

- One 1120px working width, 1180px max shell.
- Hero centered: try pill, two-line headline, one supporting line, two actions, stage.
- Loop: one white strip divided into three columns.
- Pace: full-bleed warm pastel band, text left, black panel right.
- Notes: compact split, text left, one file card right.
- Pro: text left, black voice/chat panel right.
- Pricing: centered head, Free white card, Pro black card.
- FAQ: centered head, one-column accordion.
- Closing: warm ground, one headline, one black button.
- No section rules. Air and surfaces separate the page.

## Motion

- Hero enters once, 720ms, 14px rise.
- Pastel glow drifts slowly behind the hero. Reduced motion stops it.
- The writing demo types its line, then holds. Reduced motion shows the full line.
- The waveform animates only while the sample is playing.
- Buttons step up 1px, pills respond, the FAQ opens with a short fade.
- No scroll-triggered reveals, no parallax, no carousels.

## Copy

Plain and specific. The writer writes by hand. The app speaks a batch and waits. Smart mode times the writing and advances. No "elevate", "unlock", "seamless", "quietly", rule-of-three adjective lists, not-X-but-Y, or em dashes for rhythm.

The current hero: "Dictation practice that goes quiet while you write."
The current pace: "It times your handwriting."
The current Pro: "Studio voices, when the browser voice isn't enough."
The current close: "Start with one batch."

## Anti-references

- The previous blue editorial page with the rail, numbered margin, mono labels, and section rules.
- Generic AI SaaS: purple-to-blue gradient hero, floating glass, icon tile grids, three feature cards with checkmarks.
- Audio startup: neon waveforms, glow, HUD.
- Fish Audio's exact copy, painterly image, or product layout. Take the theme and the stage discipline, not the assets.
