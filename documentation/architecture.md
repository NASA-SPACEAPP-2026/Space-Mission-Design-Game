# App architecture and game flow

## Folder layout

```text
app/
  frontend/   PlayCanvas + Vite + TypeScript first-person game
  backend/    Express health endpoint
documentation/
Go-No-Go.html  existing, complete mission-design game
```

## Frontend

- Uses [PlayCanvas](https://playcanvas.com/) for the navigable first-person lunar-base scene.
- Starts with a classic New Game / Load Game / Options menu.
- Uses WASD/arrow keys and mouse look; **E** opens the nearby mission console, **V** toggles third person, and **P** pauses.
- Loads the original `Go-No-Go.html` from the repository root in the mission console. Vite serves that exact source as `/legacy-game.html` in development and includes it in production output; mission rules and screens are not reimplemented in a second frontend.
- The original game retains its tutorial, mission phases, spacecraft design, testing, flight, reports, and `gng32.save` browser save.
- Loads NASA GLB assets from `app/frontend/public/assets/nasa/`.

## Backend

- Exposes `GET /api/health`, used by the frontend menu to show backend connectivity.
- The existing Go-No-Go game owns mission state and local browser saves; this API does not replace those game rules or fabricate a separate mission model.
