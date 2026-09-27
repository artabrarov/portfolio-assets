# Code for arthurabrarov.com

Scripts the live site loads from here (GitHub Pages), so changes ship with a push instead of a paste into Framer.

| File | What it is | Loaded by |
|---|---|---|
| `emoji-game.js` | Readable source of the homepage emoji game | — |
| `emoji-game.min.js` | Minified build of the above | Framer → Site Settings → Custom Code (end of body) |

Update the game: edit `emoji-game.js`, rebuild, push.

```
npx esbuild code/emoji-game.js --minify --target=es2020 > code/emoji-game.min.js
```

GitHub Pages caches for ~10 minutes, so changes reach visitors within minutes of a push.
