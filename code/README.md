# Code for arthurabrarov.com

Scripts the live site loads from GitHub Pages (`https://artabrarov.github.io/portfolio-assets/code/...`), so changes ship with a push instead of a paste into Framer. Pages caches for ~10 minutes.

## Emoji game

| File | What it is |
|---|---|
| `emoji-game.js` | Readable source |
| `emoji-game.min.js` | Build loaded by Framer → Site Settings → Custom Code (end of body): `<script src="https://artabrarov.github.io/portfolio-assets/code/emoji-game.min.js" defer></script>` |

Rebuild: `npx esbuild code/emoji-game.js --minify --target=es2020 > code/emoji-game.min.js`

## Image lightbox

On computers, click an image or video on any page except /sites to open it full screen over a 30% black overlay; the left and right arrow keys move through the page's images and videos. It opens on plain white with ← counter → buttons (top left) and a Close button (top right) styled like the site's buttons and linked to its Framer colour styles; Close, a click anywhere, Esc or scroll closes it. Keyboard: Tab reaches each image and video, Enter or Space opens it, and focus returns to it on close. Media stays in Framer: images open in a bigger version from Framer's image server, and videos carry on from the frame they were on. Phones and tablets are left as they are. The skipped pages and the minimum size (80px, which leaves out the avatar and logos) are set at the top of the file.

| File | What it is |
|---|---|
| `lightbox.js` | Readable source |
| `lightbox.min.js` | Build loaded by Framer → Site Settings → Custom Code (end of body): `<script src="https://artabrarov.github.io/portfolio-assets/code/lightbox.min.js" defer></script>` |

Rebuild: `npx esbuild code/lightbox.js --minify --target=es2020 > code/lightbox.min.js`

## Styles come from Framer

The game follows the site's Framer styles, so tweaks made in Framer reach the game without a code change:

- **Colours** use the Framer colour styles through their `--token-…` CSS variables (dark text, grey text, stroke, button fill).
- **Text** copies the Framer text styles at runtime from the homepage elements that use them: body text from the bio in the `Hero` frame, small text and the link style from the `Footer` links, strong text from the `Button` label.

Every value has a fallback in the CSS, so the game keeps its look if a style can't be read. If a Framer colour style is deleted and recreated, its token ID changes and the `C` constants in `emoji-game.js` need the new one.
