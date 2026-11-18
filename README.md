# Theme Studio for LeetCode

A fresh coat of paint for leetcode.com: 8 themed "worlds", each with a painted backdrop, glass panels, a themed editor and an **Accepted** finisher.

| World | Mood |
|---|---|
| Ultraviolet | Moonlit lavender (default) |
| Synthwave | Neon sunset, perspective grid |
| Aurora | Northern lights, teal + periwinkle |
| Ember | Desert dusk, warm orange |
| Matcha | Calm green, topographic lines |
| Abyss | Deep sea, light rays |
| Graphite | Minimal mono, acid lime |
| Paper | Light theme, cream + vermilion |

## Install (unpacked)

1. Open `chrome://extensions` (or `edge://extensions`).
2. Turn on **Developer mode** (top right).
3. Click **Load unpacked** and pick this folder (the one containing `manifest.json`).
4. Pin the extension and open any LeetCode page.

## Use

- **Popup**: pick a world, set backdrop strength, toggle glass panels, the Accepted finisher, the font, and the on-page switcher. **Preview "Accepted"** plays the animation on the current LeetCode tab.
- **On-page switcher**: the small tab on the right edge.
- **Alt + Shift + T**: cycle to the next world.
- Switching between a dark world and **Paper** (light) shows a "Reload" prompt so the code editor's syntax colors switch too.

## How it works

LeetCode's UI is built on CSS variables (`--layer-01`, `--text-primary`, `--sd-background`, `--difficulty-easy`, …). The extension re-points those at the chosen palette, so nearly every surface follows the theme without depending on class names that change often. Older utility classes that still hardcode colors are covered by a small set of overrides. The backdrops are SVGs built in code from each palette, so there are no image files.

Files: `src/themes.js` (palettes), `src/scenery.js` (backdrops), `src/content.js` + `src/content.css` (page theming), `popup/` (settings UI).

Fonts: Unbounded and Space Grotesk, both SIL Open Font License.
