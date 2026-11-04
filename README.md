🇬🇧 English | [🇮🇹 Italiano](README.it.md)

# Space Mission Design Game

A web game for the Space Mission Design Game challenge: you walk through a first-person lunar base
(PlayCanvas) and, at the mission console, open **Go-No-Go**, the full mission-design simulation.
The challenge brief is in [documentation/challenge.md](documentation/challenge.md).

## Quick start

Requirements: [Node.js](https://nodejs.org/) 24 (see `.nvmrc`) and Git.

```bash
git clone https://github.com/NASA-SPACEAPP-2026/Space-Mission-Design-Game.git
cd Space-Mission-Design-Game
npm install
npm run dev
```

`npm run dev` starts the backend (http://localhost:8080) and the frontend together; open the URL
printed by Vite (http://localhost:5173), which proxies `/api` to the backend.

Controls: **WASD**/arrows and mouse to move, **E** near the mission console to open Go-No-Go,
**V** third-person view, **Esc** releases the mouse, **P** pause. On touch screens a virtual
joystick moves and dragging looks around. **Carica partita** resumes the browser save created by
the game.

## Scripts

| Command | What it does |
|---------|--------------|
| `npm run dev` | Frontend + backend in watch mode |
| `npm run dev:frontend` / `npm run dev:backend` | Only one of the two |
| `npm run build` | Builds both workspaces (`app/*/dist`) |
| `npm test` | Runs every test suite (frontend: vitest, backend: `node:test`) |
| `npm start` | Runs the built backend, which also serves the built frontend |

## Project structure

```text
app/
  frontend/          PlayCanvas + Vite + Tailwind; public/legacy-game.html is the original Go-No-Go game
  backend/           Express API (health endpoint; MySQL persistence prepared, not wired yet)
  contracts/         Planned v1 HTTP API types and request validation (not used by the app yet)
documentation/       Architecture, deployment, assets, challenge brief
infra/               One-off Azure setup and teardown scripts
scripts/             Packaging for Azure App Service
.github/workflows/   CI/CD
```

## Branches and deployment

Work goes into `dev` through pull requests; every push to `dev` deploys to **staging**. Merging
`dev` into `main` deploys to **production**. Details in
[documentation/deployment.md](documentation/deployment.md).

## Documentation

- [Architecture](documentation/architecture.md)
- [Deployment](documentation/deployment.md)
- [Legacy save format](documentation/legacy-save-format.md)
- [NASA 3D assets](documentation/nasa-assets.md)
- [Challenge brief](documentation/challenge.md)
