# Direction

Status: committed for the first build. Palette and type lock after round 3.
Revision 2: pivoted to a soft blue atmosphere after client feedback. Closer to Luvvoice and Fish Audio in clarity; Foundable supplies the blue.

## The world: The Quiet Blue Desk

A study desk on a clear morning. Pale sky-blue light across the page, white paper on the desk, a deep navy instrument with one bright blue playhead. The mood is calm and airy, not technical and not bookish. It should feel like a well-made study app a student would leave open for an hour.

Three materials:

1. **Sky.** Soft blue fields for the hero and the closing call to action. Flat color, no gradient, no clouds, no glow.
2. **Paper.** White and blue-white surfaces with fine hairlines, generous space, and square sheets. This carries reading, notes, and the written word.
3. **Navy instrument.** A deep blue-black panel for the session, pace model, and Pro card. Precise, but softer than black. One bright blue indicator.

## Signature idea

**The Batch Strip.** A ruled strip with the batch number in the margin, the phrase in a large clean grotesque, three word states (spoken, current, upcoming), a thin blue playhead, and a small "your turn" clock. It is the hero's real session, the how-it-works diagram, and the practice room. Specific to dictation, not a generic audio waveform.

Supporting marks:

- **The margin rail.** A narrow left column with section numbers (01, 02, 03) and a continuous hairline. It gives the page the rhythm of a script margin without turning bookish.
- **The pause mark.** A small navy square holding two pale blue vertical bars. Logo, favicon, section marker.

## Palette

Light mode: a clear morning.

| Token | Hex | Role |
|---|---|---|
| `--bg` | `#F5F9FC` | page ground, blue-white |
| `--bg-2` | `#E8F1F8` | recessed bands |
| `--surface` | `#FFFFFF` | paper sheets, panels |
| `--surface-2` | `#F0F6FB` | secondary paper |
| `--ink` | `#0D2233` | primary text, navy |
| `--ink-2` | `#284256` | secondary text |
| `--muted` | `#5C7386` | supporting text |
| `--line` | `#D8E5EF` | hairlines |
| `--line-strong` | `#B6CCDC` | structural rules |
| `--accent` | `#2E73B5` | blue links, selected states |
| `--accent-strong` | `#1D5E9B` | blue text on light |
| `--accent-soft` | `#E2F0FC` | selected rows |
| `--hero-bg` | `#C9E2F7` | hero field |
| `--cta-bg` | `#BBDCF5` | closing field |
| `--panel` | `#0E2436` | navy instrument |
| `--panel-2` | `#163247` | instrument controls |
| `--panel-ink` | `#F4F9FD` | text on navy |
| `--panel-muted` | `#A5BFD2` | labels on navy |
| `--panel-accent` | `#8FD0FA` | playhead, current word |
| `--ok` | `#4F8F6B` | small status LED only |

Dark mode: the same desk at night.

| Token | Hex | Role |
|---|---|---|
| `--bg` | `#08121A` | page ground |
| `--bg-2` | `#0E1D28` | recessed bands |
| `--surface` | `#102230` | paper sheets |
| `--surface-2` | `#142A3A` | secondary paper |
| `--ink` | `#EAF3FA` | primary text |
| `--ink-2` | `#C6D9E7` | secondary text |
| `--muted` | `#8FA7B8` | supporting text |
| `--line` | `#1E3748` | hairlines |
| `--line-strong` | `#315064` | structural rules |
| `--accent` | `#8CCBF6` | blue links, selected states |
| `--accent-strong` | `#B5E0FB` | blue text on dark |
| `--accent-soft` | `#163449` | selected rows |
| `--hero-bg` | `#0F2636` | hero field |
| `--cta-bg` | `#BCE0FA` | closing field stays light |
| `--panel` | `#122A3B` | navy instrument |
| `--panel-2` | `#1A3A50` | instrument controls |
| `--panel-ink` | `#F2F9FD` | text on navy |
| `--panel-muted` | `#9DB8CA` | labels on navy |
| `--panel-accent` | `#8FD0FA` | playhead, current word |
| `--ok` | `#6FB58D` | small status LED only |

Color strategy: **Soft field, ink buttons.** Blue is atmosphere and selection, not the primary button color. Primary actions are navy (light mode) or pale blue with navy text (dark mode), like the references. No gradients, no glow, no second accent hue.

## Type

| Role | Face | Use |
|---|---|---|
| Display | **Archivo** variable, 650 to 750 | H1, section headlines, batch phrases, prices |
| Text / UI | **Archivo** variable, 400 to 650 | body, navigation, buttons, labels |
| Data | **Geist Mono**, 400 to 500 | batch numbers, timers, small metadata only |

Why: Luvvoice and Fish Audio earn their clarity from one confident grotesque, not a pairing of display faces. Archivo has more character than Inter and holds up at 100px with tight tracking. Geist Mono survives as a small annotation voice, not a texture. Anybody is retired. No serif.

Scale:

- Hero H1: `clamp(54px, 6.6vw, 96px)`, line-height 0.95, letter-spacing -0.04em.
- Section H2: `clamp(38px, 4.4vw, 64px)`, line-height 1.0, letter-spacing -0.035em.
- Feature H3: 24 to 28px, line-height 1.1.
- Body large: 18 to 19px / 1.6.
- Body: 16px / 1.6.
- Small: 14px / 1.5.
- Labels: 11px uppercase, Archivo 600, tracking 0.1em.
- Mono: 10 to 11px, tracking 0.06em.
- Buttons: 15px, weight 600.

## Layout grammar

- 12 columns, max width 1280px, 24px gutters, 48px page margins desktop, 20px mobile.
- A left margin rail (72 to 88px) carries section numbers and a hairline. Collapses to a small label on mobile.
- Hero and closing are full-bleed soft blue fields. Content sections sit on blue-white paper.
- Hero is one screen. Sections are one screen at 1440x900. No neighbor heading peeking in.
- White paper sheets and navy panels are the only rounded rectangles (14 to 18px). Buttons are pills. Hairline rules separate regions.
- The navy instrument appears in the hero, once mid-page, and in the Pro and pricing cards. Not everywhere.
- No photography. Product UI, type, rules, and the batch strip are the imagery.
- Reduce mono labels by half compared with revision 1. Let the type and space do the work.

## Motion

- Hero enters once, staggered, 600ms, 14px rise. Reduced motion instant.
- "Hear a batch" plays the browser voice, highlights words on boundary events, moves the waveform. A stop control is always visible while playing. No autoplay.
- Buttons step 1px on hover, settle on press. Linked panels lift 2px. Nav underlines draw.
- Theme changes crossfade colors over 180ms.
- Accordion opens with a 220ms row transition.
- No scroll-triggered fades. No parallax. No tilt. No carousel.

## Copy voice

Plain, calm, specific. The product term is "batch". The writer "writes", not "transcribes". The app "reads", not "generates audio". The pace is "yours".

Rules:

- H1 names the category and the differentiator.
- One hard fact on the first screen.
- Buttons are a verb and an object: "Start free", "Hear a batch", "See the plans".
- No "seamlessly", "elevate", "unlock", "robust", "effortless", "supercharge", "AI-powered".
- No em dashes used for rhythm.
- No three-adjective lists.
- No fabricated testimonials, logos, counts, or benchmarks. Sample pace numbers are labelled SAMPLE.

## Anti-references

- The current SottoReads look: warm parchment, terracotta, serif headings, bookish cards.
- Revision 1 of this mockup: graphite-black instrument world with a signal-orange accent. Too technical, too dark, too far from the references.
- Generic AI SaaS: purple-to-blue gradient hero, floating glass panels, glowing orbs, bento grids of icon tiles.
- Audio startup: black neon waveforms, glow, futuristic HUD.
- Study app: stock photo of a student at a desk, pastel blobs, every element in a rounded card.
- Foundable's exact cloud illustration and sky scene. Take the soft blue and the confidence, not the clouds.
- The reference sites' composition: Luvvoice's exact split hero, Fish Audio's painterly app frame, invideo's centered serif hero.

## Success test

A first-time visitor understands within five seconds:

1. This is a dictation practice tool for people who write by hand.
2. It reads a short batch, waits, and moves at a pace it learned from them.
3. The free plan is private and needs no account.
4. Pro adds studio voices and hands-free advance.
5. What to click next.

If someone leaves after one viewport, they should remember the batch strip and the phrase "the dictation tool that waits for you", not a mood.
