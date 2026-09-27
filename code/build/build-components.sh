#!/bin/sh
# Bundles each component in code/components/src into code/components/<Name>.js for Framer to import by URL.
# react and framer are swapped for build/shim.js; the Framer wrapper passes the real ones in via register().
cd "$(dirname "$0")/.."
for src in components/src/*.tsx; do
  name=$(basename "$src" .tsx)
  printf 'export { register } from "../build/shim.js"\nexport { default } from "../components/src/%s.tsx"\n' "$name" > build/entry.js
  npx esbuild build/entry.js --bundle --format=esm --minify --keep-names --target=es2020 \
    --jsx=transform --jsx-factory=__h --jsx-fragment=__F --inject:build/shim.js \
    --alias:react=./build/shim.js --alias:framer=./build/shim.js --log-level=warning \
    --outfile="components/$name.js"
done
rm -f build/entry.js
