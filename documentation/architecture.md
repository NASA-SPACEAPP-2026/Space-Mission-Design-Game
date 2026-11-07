# App architecture and game flow

## Direction

The project is **2D only** and **static**:

- no PlayCanvas scene, no NASA `.glb` models, no first-person lunar base;
- no Express API, no MySQL, no server-side mission state;
- no three.js: the satellite designer and the orbit planner use the 2D views
  (`satSVG`, the orbit canvas `obcv` and the DRM SVG).

The player's whole game state lives in `localStorage`. The server only serves files.

## Current layout

```text
index.html              shell: markup and CSS
public/game/            classic scripts, loaded in this order:
  01-data.js              technology database
  02-orbit.js             two-body orbit mechanics
  03-logic.js             mission logic, stakeholders, economy
  04-stubs.js             no-op S3/FD3 guards after the 3D removal
  05-campus.js            isometric campus renderer and world layout
  06-rooms.js             interior SVG renderers
  07-main.js              boot, screens, save, HUD, tutorial
public/fonts/           self-hosted latin WOFF2 fonts and OFL licenses
public/audio/theme.mp3  soundtrack, fetched when the player enables music
server.mjs              minimal static server used by Azure App Service
tests/                  Vitest suites: static contract + server behaviour
scripts/                Azure packaging and optional browser smoke test
infra/                  Azure setup / teardown
documentation/
```

`index.html` is the promoted, newer version of the original `Go-No-Go_beta.html`. The old
`legacy-game.html` copy was removed to avoid two sources of truth.

The scripts are still classic scripts, not ES modules: the split keeps the existing global
bindings and execution order working. This is deliberate for the incremental refactor.

## Runtime flow

- On boot the game loads `gng32.save` (or creates a new agency) and renders the 2D isometric
  campus.
- Buildings open 2D rooms: administration and meetings, construction yard, clean room, test
  laboratory, flight dynamics, mission control, launch pad.
- The mission phases follow the challenge: objectives and requirements, spacecraft design,
  orbit and launch, assembly, testing, flight, reviews (MDR, PDR, CDR, FRR, MCR) and reports.
- The satellite designer is the 2D grid (`satSVG`, drag and drop). The 3D `SAT3D` module was
  removed; the 2D fallback is now the only path.
- The flight-dynamics screen uses the 2D orbit canvas and the DRM schematic. The 3D `FD3`
  module was removed; legacy saves that still use the old DRM format get the 2D schematic and
  numeric controls.
- The soundtrack is a separate `public/audio/theme.mp3` file, fetched on demand and decoded with
  the Web Audio API. It is no longer a 2.5 MB base64 string inside the page.

## Build and runtime performance

`npm run build` does three steps:

1. Vite builds `dist/` and copies `public/`.
2. `scripts/build-game.mjs` concatenates the classic scripts in order, minifies them with
   esbuild, writes a content-hashed `dist/assets/game-<hash>.js` and rewrites `dist/index.html`
   to load only that file. `dist/game/` is removed from the production output; the dev server
   still uses the split source files.
3. `scripts/precompress.mjs` writes `.br` and `.gz` versions of text assets.

Current production payload (local measurement):

| Asset | Raw | gzip | brotli |
|---|---:|---:|---:|
| `index.html` | ~96 kB | ~21 kB | ~18 kB |
| game bundle | ~830 kB | ~271 kB | ~208 kB |
| fonts (used files) | ~81 kB | — | — |
| soundtrack | ~1,45 MB | — | — |

The fonts are self-hosted in `public/fonts/` (latin WOFF2, only the weights used), with the
body and display fonts preloaded. The soundtrack is a 96 kbps MP3, fetched on first interaction
and versioned with `?v=<hash>`.

The campus renderer also avoids thousands of repeated SVG nodes: trees are `<use>` references
to three `<symbol>` definitions and the empty depth-sort `<g>` wrappers were removed. Trees
outside the current view (plus a margin) are culled and re-rendered after pan/zoom. The campus
SVG is now around 2,500 nodes instead of ~8,500; the old `feTurbulence` ground filter was
replaced by a gradient and the unused blur filter removed.

On coarse pointers/mobile, panning switches to a low-detail forest: the detailed `<use>` trees,
labels, walkers and SVG filters are hidden during the gesture, and three merged `<path>`
canopies (one per tree type) are shown instead. Camera updates are coalesced with
`requestAnimationFrame`, the SVG has `touch-action: none`, and pointer capture starts only
after the drag threshold. Under 4× CPU throttling this took the average frame interval from
~115 ms to ~10 ms in the local test. Desktop keeps the detailed trees while panning.

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
  render/     campus SVG, rooms, satellite 2D, orbit 2D
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

- `tests/content.test.mjs` guards the 2D/static contract (script order, no three.js, no embedded
  audio, no backend references, shell size);
- `tests/server.test.mjs` starts `server.mjs` on an ephemeral port and checks the shell, health
  probe, asset caching, SPA fallback, 404s, path traversal and HEAD.

`npm run smoke` is optional and needs a running build plus a Chromium executable. It checks the
welcome dialog, starts a normal game and fails on page or console errors.
