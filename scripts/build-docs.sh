#!/usr/bin/env bash
# Rebuilds the GitHub Pages preview in docs/ from a clean web export.
#
# GitHub Pages serves this repo under the /Kesef-sheli/ subpath, not domain root. Expo's web
# export bakes absolute "/..." URLs for the entry script, favicon, and (inside the JS bundle
# itself) the @expo/vector-icons font files — those all 404 under a subpath, which is what made
# every icon in the app render as a fallback glyph. This script rewrites them to relative "./..."
# paths so the exported build works from any subpath.
set -euo pipefail
cd "$(dirname "$0")/.."

rm -rf dist .expo
npx expo export --platform web --clear

sed -i 's#href="/favicon.ico"#href="./favicon.ico"#; s#src="/_expo/#src="./_expo/#' dist/index.html
sed -i 's#"/assets/#"./assets/#g' dist/_expo/static/js/web/*.js

rm -rf docs/_expo docs/assets docs/favicon.ico docs/metadata.json
cp -r dist/_expo dist/assets dist/favicon.ico dist/metadata.json dist/index.html docs/

echo "docs/ rebuilt from a clean export."
