#!/usr/bin/env bash
# Builds release.zip for Azure App Service from an already built workspace
# (run `npm run build` first). The zip contains only what runs in production:
#   app/backend/dist          compiled API
#   app/frontend/dist         built frontend (includes legacy-game.html from public/)
#   node_modules              production dependencies of the backend only
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$(realpath -m "${1:-$ROOT/release.zip}")"
STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT

cd "$ROOT"
for required in app/backend/dist/index.js app/frontend/dist/index.html app/frontend/dist/legacy-game.html; do
  [ -e "$required" ] || { echo "Missing $required - run 'npm run build' first." >&2; exit 1; }
done

# Manifests + lockfile: `npm ci` then installs exactly the locked production
# dependencies of the backend workspace, without dev tooling.
mkdir -p "$STAGE/app/backend" "$STAGE/app/frontend" "$STAGE/app/contracts"
cp package.json package-lock.json "$STAGE/"
cp app/backend/package.json "$STAGE/app/backend/"
cp app/frontend/package.json "$STAGE/app/frontend/"
cp app/contracts/package.json "$STAGE/app/contracts/"
(cd "$STAGE" && npm ci --omit=dev --workspace app/backend --ignore-scripts --no-audit --no-fund)

# Workspace symlinks are not needed at runtime and do not survive zipping.
rm -rf "$STAGE/node_modules/@space"

cp -r app/backend/dist "$STAGE/app/backend/dist"
cp -r app/frontend/dist "$STAGE/app/frontend/dist"

rm -f "$OUT"
(cd "$STAGE" && zip -qr "$OUT" .)
echo "Created $OUT ($(du -h "$OUT" | cut -f1))"
