# Code for arthurabrarov.com

Everything the live site runs, loaded from GitHub Pages (`https://artabrarov.github.io/portfolio-assets/code/...`), so changes ship with a push instead of a paste into Framer. Pages caches for ~10 minutes.

## Emoji game

| File | What it is |
|---|---|
| `emoji-game.js` | Readable source |
| `emoji-game.min.js` | Build loaded by Framer → Site Settings → Custom Code (end of body): `<script src="https://artabrarov.github.io/portfolio-assets/code/emoji-game.min.js" defer></script>` |

Rebuild: `npx esbuild code/emoji-game.js --minify --target=es2020 > code/emoji-game.min.js`

## Code components

| Source | Build Framer imports |
|---|---|
| `components/src/SitesGallery.tsx` | `components/SitesGallery.js` |
| `components/src/DotGridRepel.tsx` | `components/DotGridRepel.js` |
| `components/src/LayeredShot.tsx` | `components/LayeredShot.js` |

Each Framer code file is a small wrapper:

```tsx
import * as React from "react"
import * as Framer from "framer"
import DotGridRepel, { register } from "https://artabrarov.github.io/portfolio-assets/code/components/DotGridRepel.js"
register({ React, Framer })
/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default DotGridRepel
```

The builds don't bundle React or Framer: `build/shim.js` stands in for them and `register()` hands over the real ones from Framer, so the component uses Framer's own React.

Rebuild after editing a source: `sh code/build/build-components.sh`
