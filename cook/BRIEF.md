# Cook brief — Sotto Reads, Fish Audio direction

## Target

Redesign the Sotto Reads SaaS mockup so it reads as a close sibling of fish.audio, with Sotto's own product truth. Replace the previous blue editorial world.

## Reference

- Fish Audio desktop: `../design/inspiration/fish-hero.png`, `../design/inspiration/fish-full.png`
- Fish Audio mobile: the user's attached screenshot
- User annotations on the current build: six screenshots in the thread

What to take from Fish Audio:

- Off-white / warm grey ground, black type, black pill buttons.
- One large centered headline, a short centered paragraph, two actions.
- Product surface as a large rounded object on a painterly pastel stage.
- Clean medium-weight grotesque, generous whitespace, almost no monospace labels.
- Small pill navigation, minimal chrome, black `Sign up` pill.
- The product UI does the visual work; no decorative icon grid.

## Bar

90/100. Match the Fish Audio theme at about 85%, keep Sotto's own product story.

## Rules from the annotations

- Hero background: white with a grey gradient and a soft liquid / radiant pastel glow.
- Change the font. Use a clean medium-weight grotesque, not the heavy Archivo display.
- Rewrite the hero copy. No synthetic "tool that waits for you" line.
- Sample panel: black background, white text and white elements.
- Remove the instrument top bar labels and the Previous / Replay / Next row.
- Add the new advance pill: "Smart advance in 0:03" with a large "Next".
- Remove the Listen / Write / Advance micro labels from the loop.
- Waveform: black on light, rounded bar caps.
- Write-it-down surface: black panel, white text, text visibly appearing while dictation plays.
- Notes section: minimize it. No giant document/batch workspace.
- Privacy section: remove it. Keep the truth in the FAQ and footer.
- Cut the small "Free plan. Browser voice. No account, no upload." line under the hero.
- Remove the rail and the left-margin editorial system. Center the page like Fish.
- Both light and dark mode.
- No invented testimonials, counts, or benchmarks.

## Copy rules

Use the ai-slop-detector list. No "seamlessly", "elevate", "unlock", "robust", "quietly", "at its core", rule-of-three lists, not-X-but-Y, em dashes for rhythm, or fake profundity. Write like a person describing the product to a friend.

## Deliverable

- React + Vite mockup in `mockup/`.
- 1440 and 390 captures, light and dark.
- Deploy to the existing `sottouidraft` Cloudflare Pages project.
- Design state in `cook/` and `design/`.

## Time

Hard cap this pass at 90 minutes. Stop when the page holds next to the reference or the cap hits, whichever comes first.
