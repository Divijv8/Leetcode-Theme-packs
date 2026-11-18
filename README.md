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

## Screen Shots
<img width="1895" height="867" alt="image" src="https://github.com/user-attachments/assets/2dcbcecb-87e0-4394-97a5-e4ea9d802850" />
<img width="1907" height="851" alt="image" src="https://github.com/user-attachments/assets/8ad30de5-7c5d-45a3-a75e-56b13cc415e6" />
<img width="1877" height="830" alt="image" src="https://github.com/user-attachments/assets/0e50f8be-2762-497b-bd4c-52d4ccb4e84f" />
<img width="175" height="448" alt="image" src="https://github.com/user-attachments/assets/53563d75-d2c0-4b87-8dfd-471b83cc40bf" />



## Use

- **Popup**: pick a world, set backdrop strength, toggle glass panels, the Accepted finisher, the font, and the on-page switcher. **Preview "Accepted"** plays the animation on the current LeetCode tab.
- **On-page switcher**: the small tab on the right edge.
- **Alt + Shift + T**: cycle to the next world.
- Switching between a dark world and **Paper** (light) shows a "Reload" prompt so the code editor's syntax colors switch too.

## How it works

LeetCode's UI is built on CSS variables (`--layer-01`, `--text-primary`, `--sd-background`, `--difficulty-easy`, …). The extension re-points those at the chosen palette, so nearly every surface follows the theme without depending on class names that change often. Older utility classes that still hardcode colors are covered by a small set of overrides. The backdrops are SVGs built in code from each palette, so there are no image files.

Files: `src/themes.js` (palettes), `src/scenery.js` (backdrops), `src/content.js` + `src/content.css` (page theming), `popup/` (settings UI).

Fonts: Unbounded and Space Grotesk, both SIL Open Font License.
