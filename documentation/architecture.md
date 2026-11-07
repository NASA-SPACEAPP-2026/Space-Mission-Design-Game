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

## Server

`server.mjs` is deliberately small:

- serves `dist/`;
- SPA fallback to `index.html` for unknown routes without a file extension;
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
