# App architecture and game flow

## Folder layout

```text
app/
  frontend/    PlayCanvas + Vite + TypeScript first-person game
    public/legacy-game.html   the original, complete Go-No-Go mission-design game
    public/assets/nasa/       NASA GLB models
  backend/     Express API; also serves the built frontend in production
  contracts/   planned v1 HTTP API types and request validation (not used by the app yet)
documentation/
infra/         Azure setup / teardown
scripts/       Azure packaging (release.zip)
```

`app/frontend` and `app/backend` are npm workspaces of the root `package.json`.

## Frontend

- Uses [PlayCanvas](https://playcanvas.com/) for the navigable first-person lunar-base scene.
- Starts with a classic New Game / Load Game / Options menu.
- Uses WASD/arrow keys and mouse look; **E** opens the nearby mission console, **V** toggles third
  person, and **P** pauses. On touch screens a virtual joystick moves and dragging on the canvas
  looks around (`src/touch-controls.ts`).
- The mission console shows the original game in an iframe at `/legacy-game.html`. The file lives
  in `public/`, so Vite serves it unchanged in development and copies it into the build; mission
  rules and screens are not reimplemented in a second frontend. Tailwind is told to skip it
  (`@source not` in `src/style.css`) so the game's markup does not add classes to the app CSS.
- The original game keeps its tutorial, mission phases, spacecraft design, testing, flight,
  reports, and the `gng32.save` browser save (see [legacy-save-format.md](./legacy-save-format.md)).
- History API routes (`/profile`, `/missions`, `/missions/:id`) are resolved in `src/router.ts`.
- Loads NASA GLB assets from `app/frontend/public/assets/nasa/` (see [nasa-assets.md](./nasa-assets.md)).

## Backend

- Exposes `GET /api/health`, used by the frontend menu to show backend connectivity and by the
  deployment smoke test.
- When `app/frontend/dist` exists, the same Express process serves the built frontend and falls
  back to `index.html` for non-API routes.
- The existing Go-No-Go game owns mission state and local browser saves; this API does not replace
  those game rules.

### Prepared but not wired yet

A MySQL persistence layer is in place for a possible database, but the running app does not use
it (the server prints `DATABASE Not configured yet`):

- `src/migrations/` — migration runner and `sql/001_initial_schema.sql`
- `src/persistence/dao/` — DAO interfaces and MySQL adapters
- `app/contracts/` — v1 request/response types and validation

No MySQL driver is installed yet. The code is covered by the backend tests, which use fake SQL
connections instead of a real database, so it keeps compiling and working while unused. Wiring them up requires the steps listed under "Known gaps" in
[deployment.md](./deployment.md).

## Tests

`npm test` runs every workspace's tests: vitest in the frontend (`app/frontend/test`) and
`node:test` through `tsx` in the backend (`app/backend/test`, including `server.node.ts`, which
starts the real entry point and calls `/api/health`).
