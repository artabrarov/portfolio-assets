# Code for arthurabrarov.com

Scripts the live site loads from GitHub Pages (`https://artabrarov.github.io/portfolio-assets/code/...`), so changes ship with a push instead of a paste into Framer. Pages caches for ~10 minutes.

## Emoji game

| File | What it is |
|---|---|
| `emoji-game.js` | Readable source |
| `emoji-game.min.js` | Build loaded by Framer → Site Settings → Custom Code (end of body): `<script src="https://artabrarov.github.io/portfolio-assets/code/emoji-game.min.js" defer></script>` |

Rebuild: `npx esbuild code/emoji-game.js --minify --target=es2020 > code/emoji-game.min.js`

## Image lightbox

Click or tap an image or video on any page except /sites to open it full screen. On computers: the left and right arrow keys, or a two-finger swipe sideways on a trackpad, move through the page's images and videos. Pinch on a trackpad to zoom into an open image or video (up to 4×; images load the full size original), and two fingers then pan; clicking the open media does nothing. It opens on the cards' White colour style (no effects) with the company's logo (top left), ← counter → (centre) and a Close button (top right) styled like the site's buttons and linked to its Framer colour styles; Close, a click on the background, Esc or scroll closes it. Keyboard: Tab reaches each image and video, Enter or Space opens it, and focus returns to it on close. Media stays in Framer: images open in a bigger version from Framer's image server, and videos carry on from the frame they were on. Next to the logo, a label names the section the current item belongs to, in the counter's type (Apron: Bills, Expenses, Capture, Mobile app, Design system; Joompay: Product, Brand; Redmadrobot: Rostelecom Key, Concepts; set per page in `SECTIONS`, by Framer layer name or by card order); it's hidden where it would run into the counter. On phones and tablets it works as in Photos: swipe sideways to move (a filmstrip: the next item rides in beside the current one, and it glides on past a quarter of the screen or with a flick, springs back otherwise, and gives way like a rubber band at either end), pinch to zoom and drag to look around, swipe down or tap the background or Close to close; on phones the margins are 16px instead of 32px, and ← counter → sits at the bottom, within reach of a thumb. The skipped pages and the minimum size (80px, which leaves out the avatar and logos) are set at the top of the file.

The same file, since it runs on every page, also draws one keyboard focus ring for the whole site, as the lightbox's buttons: 2px in the dark text colour, 2px outside the element, following its corners (pills stay pills, text links and logo tiles get matching rounding); on images and videos it's drawn round their rounded frame. While a ring shows, frames that would cut it off stop clipping.

| File | What it is |
|---|---|
| `lightbox.js` | Readable source |
| `lightbox.min.js` | Build loaded by Framer → Site Settings → Custom Code (end of body): `<script src="https://artabrarov.github.io/portfolio-assets/code/lightbox.min.js" defer></script>` |

Rebuild: `npx esbuild code/lightbox.js --minify --target=es2020 > code/lightbox.min.js`

## About sheet

The Hero's About button (a Secondary button labelled "About", linked to `#about`) opens a white sheet in the middle of the screen, on the page's grey: a photo, a short bio, a thin divider, the companies I've worked at (each with its role and years), and a last bio paragraph inviting people for a chat over a flat white, by email or LinkedIn, both links in the dark text colour that turn grey on hover. Close (top right, as in the lightbox), a click on the grey, Esc, or on phones and tablets a swipe down (from the top of the sheet, as in the lightbox) closes it; any page opened with `#about` opens it straight away. Keyboard: focus moves into the sheet, Tab stays inside it, and focus returns to the About button on close. While it's open the page behind doesn't scroll, and the lightbox ignores the images under the grey. The words, the photo, the companies and the email and LinkedIn addresses are set in `CONTENT` at the top of the file; the photo lives in [`about/`](../about/).

It's drawn from the site's Framer styles, read each time it opens: the cards' White colour style, corners, corner smoothing and padding for the sheet; the homepage Image Frame's corners, fill and stroke for the photo; the bio's text style in the Hero for the text (the first paragraph in the dark text colour, the rest in grey); the Secondary button for Close (its label text style, and its colour styles: Hover at rest, Stroke on hover); the page background colour style for the grey; the dark and grey text colour styles for the words and links; and the colour style behind the homepage images for the divider.

| File | What it is |
|---|---|
| `about.js` | Readable source |
| `about.min.js` | Build loaded by Framer → Site Settings → Custom Code (end of body): `<script src="https://artabrarov.github.io/portfolio-assets/code/about.min.js" defer></script>` |

Rebuild: `npx esbuild code/about.js --minify --target=es2020 > code/about.min.js`

## Styles come from Framer

The game follows the site's Framer styles, so tweaks made in Framer reach the game without a code change:

- **Colours** use the Framer colour styles through their `--token-…` CSS variables (dark text, grey text, stroke, button fill). The shop's buttons match the site's Secondary button: the Hover colour style at rest, Stroke on hover, the button label text style.
- **Text** copies the Framer text styles at runtime from the homepage elements that use them: body text from the bio in the `Hero` frame, small text and the link style from the `Footer` links, strong text from the `Button` label.

Every value has a fallback in the CSS, so the game keeps its look if a style can't be read. If a Framer colour style is deleted and recreated, its token ID changes and the `C` constants in `emoji-game.js` need the new one.
