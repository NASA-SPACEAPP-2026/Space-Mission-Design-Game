#!/usr/bin/env bash
# Builds release.zip for Azure App Service from an already built frontend
# (run `npm run build` first). The zip contains only what runs in production:
#   dist/         static game (Vite output)
#   server.mjs    static files and authentication API
#   package.json  runtime manifest and PostgreSQL dependencies
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
ls "$ROOT"/dist/assets/game-*.js >/dev/null 2>&1 || { echo "Missing dist/assets/game-*.js - run 'npm run build' first." >&2; exit 1; }
[ -f "$ROOT/dist/index.html.br" ] || { echo "Missing precompressed index.html - run 'npm run build' first." >&2; exit 1; }
[ -f "$ROOT/dist/fonts/ibm-plex-sans.woff2" ] || { echo "Missing self-hosted fonts - run 'npm run build' first." >&2; exit 1; }

cp -R "$ROOT/dist" "$STAGE/dist"
cp "$ROOT/server.mjs" "$STAGE/server.mjs"
cp "$ROOT/gmat-service.json" "$STAGE/gmat-service.json"
cp -R "$ROOT/backend" "$STAGE/backend"
cp -R "$ROOT/db" "$STAGE/db"
mkdir -p "$STAGE/scripts"
cp "$ROOT/scripts/migrate.mjs" "$STAGE/scripts/migrate.mjs"
cp "$ROOT/package.json" "$ROOT/package-lock.json" "$STAGE/"
(cd "$STAGE" && npm ci --omit=dev)


rm -f "$OUT"
(cd "$STAGE" && zip -qr "$OUT" .)
echo "Created $OUT ($(du -h "$OUT" | cut -f1))"
