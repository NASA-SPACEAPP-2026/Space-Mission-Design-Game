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

## NASA GMAT (optional, automatic)

The game asks NASA's [General Mission Analysis Tool](https://software.nasa.gov/software/GSC-19468-1) to compute
the ΔV of every transfer, plus the real **eclipse time, ground-station contacts and orbit decay** of the player's
working orbit around **Earth, the Moon, Mars and Venus** (shown in the *GMAT analysis* card of the Orbit Budget, the build gauges,
the PDR and the report). A separate background job flies the orbit to re-entry (Earth, Mars), impact (Moon) or the atmosphere (Venus) to
get the **orbit lifetime**: three solar-activity levels for Earth, and the end-of-life rule (re-entry within 5 years, or a drag sail,
or a disposal burn) now depends on it.
GMAT runs in a Docker container; `npm run dev` starts it for you (`scripts/gmat-up.mjs`). Without Docker the game
quietly falls back to its own numbers, and every value says which source it came from.

- First run pulls the prebuilt base image from GitHub Container Registry, or builds it once (about 420 MB download).
- The base image is published by `.github/workflows/gmat-base-image.yml` (manual run, or when `docker/gmat/Dockerfile.base` changes).
- After editing `scripts/gmat-*.mjs` or `public/game/02-orbit.js`: `docker compose restart gmat`.

## Branches and deployment

Work goes into `dev` through pull requests; every push to `dev` deploys to **staging**. Merging
`dev` into `main` deploys to **production**. Details in
[documentation/deployment.md](documentation/deployment.md).

## Documentation

- [Architecture](documentation/architecture.md)
- [Deployment](documentation/deployment.md)
- [Save format](documentation/legacy-save-format.md)
- [Challenge brief](documentation/challenge.md)
