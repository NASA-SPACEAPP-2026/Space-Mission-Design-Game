🇬🇧 English | [🇮🇹 Italiano](README.it.md)

# Space Mission Design Game

A **static** web game for the Space Mission Design Game challenge: design a CubeSat
mission, negotiate requirements, build and test the spacecraft, launch it and fly it. The game
is a single-page app built with Vite; there is no backend or database.

The challenge brief is in [documentation/challenge.md](documentation/challenge.md).

## Quick start

Requirements: [Node.js](https://nodejs.org/) 24 (see `.nvmrc`) and Git.

```bash
git clone https://github.com/NASA-SPACEAPP-2026/Space-Mission-Design-Game.git
cd Space-Mission-Design-Game
npm install
npm run dev
```

Open the URL printed by Vite (http://localhost:5173). The game state is saved in the browser
(`localStorage`, key `gng32.save`); nothing is sent to a server.

## Scripts

| Command | What it does |
|---------|--------------|
| `npm run dev` | Vite dev server with hot reload |
| `npm run build` | Builds, minifies, hashes and precompresses the static site into `dist/` |
| `npm run preview` | Serves the production build locally |
| `npm run start` | Runs `server.mjs` on `dist/` (the production server used by App Service) |
| `npm test` | Runs the Vitest suite |
| `npm run smoke` | Optional browser smoke test against a running build |
| `npm run check` | Tests + production build |
| `npm run package:azure` | Builds `release.zip` for Azure App Service |

## Project structure

```text
index.html              shell: markup and CSS
public/game/            game scripts, split by domain (data, orbit, logic, campus, rooms, main)
public/fonts/           self-hosted latin WOFF2 fonts and OFL licenses
public/audio/theme.mp3  soundtrack, loaded on demand (not embedded in HTML)
server.mjs              minimal static server for Azure App Service
tests/                  Vitest tests for the static contract and the server
scripts/                Azure packaging and optional browser smoke test
infra/                  One-off Azure setup and teardown
documentation/          Architecture, deployment, save format, challenge brief
.github/workflows/      CI/CD
```

The scripts are classic scripts loaded in order, so the global bindings stay compatible while
the code is split. The next refactor step converts them to ES modules/TypeScript under `src/`
(see [architecture](documentation/architecture.md)).

## Branches and deployment

Work goes into `dev` through pull requests; every push to `dev` deploys to **staging**. Merging
`dev` into `main` deploys to **production**. Details in
[documentation/deployment.md](documentation/deployment.md).

## Documentation

- [Architecture](documentation/architecture.md)
- [Deployment](documentation/deployment.md)
- [Save format](documentation/legacy-save-format.md)
- [Challenge brief](documentation/challenge.md)

## Account e database

Vedi [mappa concettuale, schema PostgreSQL, API e configurazione Azure](./documentation/authentication.md).
