#!/usr/bin/env bash
# Builds release.zip for Azure App Service from an already built frontend
# (run `npm run build` first). The zip contains only what runs in production:
#   dist/         static 2D game (Vite output)
#   server.mjs    minimal static file server, no API and no dependencies
#   package.json  runtime manifest for App Service
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="${1:-$ROOT/release.zip}"
case "$OUT" in
  /*) ;;
  *) OUT="$ROOT/$OUT" ;;
esac
STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT

[ -f "$ROOT/dist/index.html" ] || { echo "Missing dist/index.html - run 'npm run build' first." >&2; exit 1; }
[ -f "$ROOT/dist/audio/theme.mp3" ] || { echo "Missing dist/audio/theme.mp3 - run 'npm run build' first." >&2; exit 1; }

cp -R "$ROOT/dist" "$STAGE/dist"
cp "$ROOT/server.mjs" "$STAGE/server.mjs"

cat > "$STAGE/package.json" <<'JSON'
{
  "name": "space-mission-design-game",
  "private": true,
  "version": "0.2.0",
  "type": "module",
  "engines": {
    "node": ">=24"
  },
  "scripts": {
    "start": "node server.mjs"
  }
}
JSON

rm -f "$OUT"
(cd "$STAGE" && zip -qr "$OUT" .)
echo "Created $OUT ($(du -h "$OUT" | cut -f1))"
