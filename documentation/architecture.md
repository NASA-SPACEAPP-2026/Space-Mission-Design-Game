# App architecture and game flow

## Direction

The game is a static application. The campus and rooms use 2D SVG, while the satellite
and orbit editors use the locally bundled Three.js renderer when WebGL is available.
There is no server-side mission state: the game saves to `localStorage`.

## Current layout and runtime

- `index.html` contains the shell and styles.
- `public/game/` contains classic scripts loaded in order: Three.js and its toon styling,
  game data, orbit mechanics, mission logic, 3D editors, campus, rooms and main UI.
- `public/audio/theme.mp3` contains the soundtrack and is loaded on demand.
- `public/fonts/` contains the self-hosted fonts used by the shell; the newer interface
  also requests the Barlow families from Google Fonts.
- `server.mjs` serves the production build and the health endpoint.
- `tests/` and `scripts/` contain static/server checks, build tools and a browser smoke test.

The source is adapted from `Go No-Go.html`. The 3D editors fall back to the available 2D
views or controls when WebGL is unavailable. Saves use the `gng32.save` key; compatibility
with every previous saved mission has not been independently verified.

## Build

`npm run build` uses Vite, concatenates and minifies the classic scripts into a hashed game
bundle, then precompresses text assets. `npm run check` also runs the test suite and verifies
the resulting bundle. The newer game includes Three.js and additional artwork, so the bundle
is larger than the earlier 2D-only version.

## Server

`server.mjs` is deliberately small:

- serves `dist/`;
- prefers precompressed `.br`/`.gz` files when the client accepts them;
- sends `ETag`, `Last-Modified`, `Content-Length` and `Vary: Accept-Encoding`, and answers
  conditional requests with `304`;
- long-lived cache for hashed `/assets/*`, `no-cache` for the shell and `/game/*`;
- `GET /api/health` returns `{"status":"ok"}` only as a liveness probe for the existing Azure
  smoke test. It is not a game API.

## Next refactor step

The scripts are split by domain but still use the classic global scope. The next step is the
conversion to ES modules and TypeScript under `src/`, one domain per pull request:

```text
src/
  app/        boot, state, save/migrations, i18n
  sim/        technology DB, orbit math, mission logic, economy
  render/     campus SVG, rooms, satellite and orbit editors
  screens/    hub, meeting, design, tests, launch, reports
  ui/         HUD, modals, tutorial, components
  styles/
```

Rules for that step:

- keep `gng32.save` compatible and add a save-version migration;
- move code with `git mv` to preserve history;
- add characterization tests before moving logic;
- keep one working commit per module;
- do not reintroduce a bundler-only runtime requirement: the build must stay a static site.

## Tests

`npm test` runs Vitest:

- `tests/content.test.mjs` guards the static contract (script order, 3D editors, external
  audio, no backend references, shell size);
- `tests/server.test.mjs` starts `server.mjs` on an ephemeral port and checks the shell, health
  probe, asset caching, SPA fallback, 404s, path traversal and HEAD.

`npm run smoke` is optional and needs a running build plus a Chromium executable. It checks the
welcome dialog, starts a normal game and fails on page or console errors.
