# Code for arthurabrarov.com

Scripts the live site loads from GitHub Pages (`https://artabrarov.github.io/portfolio-assets/code/...`), so changes ship with a push instead of a paste into Framer. Pages caches for ~10 minutes.

## Emoji game

| File | What it is |
|---|---|
| `emoji-game.js` | Readable source |
| `emoji-game.min.js` | Build loaded by Framer → Site Settings → Custom Code (end of body): `<script src="https://artabrarov.github.io/portfolio-assets/code/emoji-game.min.js" defer></script>` |

Rebuild: `npx esbuild code/emoji-game.js --minify --target=es2020 > code/emoji-game.min.js`

## Styles come from Framer

The game follows the site's Framer styles, so tweaks made in Framer reach the game without a code change:

- **Colours** use the Framer colour styles through their `--token-…` CSS variables (dark text, grey text, stroke, button fill).
- **Text** copies the Framer text styles at runtime from the homepage elements that use them: body text from the bio in the `Hero` frame, small text and the link style from the `Footer` links, strong text from the `Button` label.

Every value has a fallback in the CSS, so the game keeps its look if a style can't be read. If a Framer colour style is deleted and recreated, its token ID changes and the `C` constants in `emoji-game.js` need the new one.
