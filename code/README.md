# Code for arthurabrarov.com

Scripts the live site loads from GitHub Pages (`https://artabrarov.github.io/portfolio-assets/code/...`), so changes ship with a push instead of a paste into Framer. Pages caches for ~10 minutes.

## Emoji game

| File | What it is |
|---|---|
| `emoji-game.js` | Readable source |
| `emoji-game.min.js` | Build loaded by Framer → Site Settings → Custom Code (end of body): `<script src="https://artabrarov.github.io/portfolio-assets/code/emoji-game.min.js" defer></script>` |

Rebuild: `npx esbuild code/emoji-game.js --minify --target=es2020 > code/emoji-game.min.js`

## Image lightbox

Click or tap an image or video on any page except /sites to open it full screen. On computers: the left and right arrow keys, or a two-finger swipe sideways on a trackpad, move through the page's images and videos. Pinch on a trackpad to zoom into an open image or video (up to 4×; images load the full size original), and two fingers then pan; clicking the open media does nothing. It opens on the cards' White colour style (no effects) with the avatar of the item's section (top left: its card's on Home, its section's in a case study, copied from Framer's Avatar layer, image or icon tile; the company logo where a section has none), ← counter → (centre) and a Close button (top right) styled like the site's buttons and linked to its Framer colour styles; Close, a click on the background, Esc or scroll closes it. Keyboard: Tab reaches each image and video, Enter or Space opens it, and focus returns to it on close. Media stays in Framer: images open in a bigger version from Framer's image server, and videos carry on from the frame they were on. Next to the avatar, a label names the section the current item belongs to, in the counter's type: the title in that section's header in Framer (Apron: AI-Powered Clean Bills, Apron Card…), so renaming a section in Framer renames its label (case studies and Lab; not on Home); it's hidden where it would run into the counter. On phones and tablets it works as in Photos: swipe sideways to move (a filmstrip: the next item rides in beside the current one, and it glides on past a quarter of the screen or with a flick, springs back otherwise, and gives way like a rubber band at either end), pinch to zoom and drag to look around, swipe down or tap the background or Close to close; on phones the margins are 16px instead of 32px, and ← counter → sits at the bottom, within reach of a thumb. The skipped pages and the minimum size (80px, which leaves out the avatar and logos) are set at the top of the file.

The same file, since it runs on every page, also draws one keyboard focus ring for the whole site, as the lightbox's buttons: 2px in the dark text colour, 2px outside the element, following its corners (pills stay pills, text links and logo tiles get matching rounding); on images and videos it's drawn round their rounded frame. While a ring shows, frames that would cut it off stop clipping.


| File | What it is |
|---|---|
| `lightbox.js` | Readable source |
| `lightbox.min.js` | Build loaded by Framer → Site Settings → Custom Code (end of body): `<script src="https://artabrarov.github.io/portfolio-assets/code/lightbox.min.js" defer></script>` |

Rebuild: `npx esbuild code/lightbox.js --minify --target=es2020 > code/lightbox.min.js`

## About sheet

The Hero's About button (a Primary button labelled "About", linked to `#about`) opens a white sheet in the middle of the screen, on the page's grey: a photo, a short bio, a thin divider, the companies I've worked at (each with its role and years), and a last bio paragraph inviting people for a chat over a flat white, by email or LinkedIn, both links in the dark text colour that turn grey on hover. Close (top right, as in the lightbox), a click on the grey, Esc, or on phones and tablets a swipe down (from the top of the sheet, as in the lightbox) closes it; any page opened with `#about` opens it straight away. Keyboard: focus moves into the sheet, Tab stays inside it, and focus returns to the About button on close. While it's open the page behind doesn't scroll, and the lightbox ignores the images under the grey. The words, the photo, the companies and the email and LinkedIn addresses are set in `CONTENT` at the top of the file; the photo lives in [`about/`](../about/).

It's drawn from the site's Framer styles, read each time it opens: the cards' White colour style, corners, corner smoothing and padding for the sheet; the homepage Image Frame's corners, fill and stroke for the photo; the bio's text style in the Hero for the text (the first paragraph in the dark text colour, the rest in grey); the Primary button for Close (its label text style, its line and shadow copied from the page's button, White at rest and the page background on hover); the page background colour style for the grey; the dark and grey text colour styles for the words and links; and the colour style behind the homepage images for the divider.

| File | What it is |
|---|---|
| `about.js` | Readable source |
| `about.min.js` | Build loaded by Framer → Site Settings → Custom Code (end of body): `<script src="https://artabrarov.github.io/portfolio-assets/code/about.min.js" defer></script>` |

Rebuild: `npx esbuild code/about.js --minify --target=es2020 > code/about.min.js`

## Styles come from Framer

The game follows the site's Framer styles, so tweaks made in Framer reach the game without a code change:

- **Colours** use the Framer colour styles through their `--token-…` CSS variables (dark text, grey text, stroke, button fill). The shop's buttons match the site's Primary button: White at rest, the page background on hover, the button label text style, and the line and shadow copied from the page's button (so a different shadow or line colour style in Framer carries over).
- **Text** copies the Framer text styles at runtime from the homepage elements that use them: body text from the bio in the `Hero` frame, small text and the link style from the `Footer` links, strong text from the `Button` label.

Every value has a fallback in the CSS, so the game keeps its look if a style can't be read. If a Framer colour style is deleted and recreated, its token ID changes and the `C` constants in `emoji-game.js` need the new one.

## Coffee

The footer's Coffee link (to `#coffee`) opens the coffee I drink, full screen like the lightbox: the bags stand in a line, newest in the middle and older ones to its left, each with its name and roaster under it. Scroll, swipe or drag to move along the line; hovering a bag turns it to face you. Click a bag, or anywhere in its column (its name and roaster too), to zoom in: it flies to the middle while the rest fade where they are, with "<coffee> by <roaster>" and my review under it and the lightbox's ‹ n / N › switcher at the top. Zoomed in, dragging turns the bag round (tipping it only slightly up and down), it leans a little towards the pointer, and ‹ ›, ← → or a swipe slide to the next one. A click outside or Esc goes back to the line; there, a click outside, Close or Esc closes it, and Back works too. Any page opened with `#coffee` opens it straight away, and so does any change of the address to `#coffee` (on phones Framer's router follows the link itself). On phones the bag in the middle of the line fills most of the width with half of each neighbour at the screen's edges, a flick carries on and slows down, and zoomed in the title and review sit at the top with the switcher at the bottom (where the lightbox has it on phones). It opens with the bags turning in from the side and growing slightly, over the lightbox's own 300 ms and easing.

The bags aren't modelled: each is a block-bottom bag (or a stand-up pouch) of its real size, built in the script, with photos of its faces wrapped on. The list is [`coffee/coffees.json`](../coffee/coffees.json), and each bag's faces are `coffee/<slug>/front.webp`, `back.webp`, `left.webp`, `right.webp` and `bottom.webp`; adding a coffee is a push, with no Framer step. three.js loads from esm.sh only when Coffee is first opened.

It's drawn from the site's Framer styles: the White, Black, Dark Grey and Background colour styles (as CSS tokens); the Title and Paragraph text styles, read from the page each time it opens, for the zoomed-in title and review; and the Title Large and Paragraph Large text styles (19/28) for the name and roaster on the line, read the same way when the page uses them, otherwise Title and Paragraph at 19/28. Close and the switcher are the lightbox's own buttons (its classes), so they need `lightbox.min.js` on the page.

| File | What it is |
|---|---|
| `coffee.js` | Readable source |
| `coffee.min.js` | Build loaded by Framer → Site Settings → Custom Code (end of body), after the lightbox: `<script src="https://artabrarov.github.io/portfolio-assets/code/coffee.min.js" defer></script>` |

Rebuild: `npx esbuild code/coffee.js --minify --target=es2020 > code/coffee.min.js`
