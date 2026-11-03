# App architecture

## Folder layout

```text
app/
  frontend/   PlayCanvas + Vite + TypeScript
  backend/    Express + TypeScript API
documentation/
```

## Frontend

- Uses [PlayCanvas](https://playcanvas.com/) for the 3D scene.
- Loads NASA GLB assets from `app/frontend/public/assets/nasa/`.
- Provides a first `Go / No-Go` HUD to simulate mission decisions.

## Backend

- Exposes mission-related APIs:
  - `GET /api/health`
  - `GET /api/missions`
  - `POST /api/telemetry`
- Validates payload shape and mission constraints.
