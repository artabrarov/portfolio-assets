# Sites

Media for the gallery on [arthurabrarov.com/sites](https://arthurabrarov.com/sites): portfolio sites I admire, each linked to the original. The designs belong to their creators.

Each card is a browser window floating over a background, so every site comes as layers named after its domain:

| File | What it is |
|---|---|
| `<domain>-bg.jpg` | Background behind the window |
| `<domain>-window.png` | The browser window with the site's screenshot |
| `<domain>-window.mp4` | For video cards: a clip of the site that plays on hover |
| `<domain>-poster.png` | For video cards: the still shown before hover, in place of `-window.png` |

To add a site, add its `-bg.jpg` and `-window.png` (plus the clip and poster for a hover video) and list it in the `SitesGallery` component in Framer.
