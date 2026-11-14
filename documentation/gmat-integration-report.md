**English** | [Italiano](gmat-integration-report.it.md)

# NASA GMAT: integration, startup, and limitations

[Index](README.md) · [Architecture](architecture.md) · [Testing](testing.md)

## Purpose

The service runs NASA GMAT R2025a to check and extend the game's orbital model. It supports Earth (`leo`), the Moon (`moon`), Mars (`mars`), and Venus (`venus`). The internal model supplies immediate estimates; GMAT results are integrated when available, with the source visible to the player.

This guide replaces the earlier development report. Historical measurements remain explicitly historical; they have not been rerun merely to update these documents. This guide does not certify availability on the public website.

## Components and flow

| File | Role |
| --- | --- |
| `public/game/02-orbit.js` | Local calculations and GMAT script generators |
| `public/game/07-main.js` | Requests, UI updates, and results attached to missions |
| `scripts/gmat-server.mjs` | HTTP endpoints and request limit |
| `scripts/gmat-bridge.mjs` | Validation, queues, cache, execution, and parsers |
| `scripts/gmat-up.mjs` | Automatic startup attempt before Vite |
| `docker/gmat/Dockerfile.base` | Ubuntu, GMAT R2025a distribution, and Node |
| `docker/gmat/Dockerfile` | Bridge application image |
| `docker-compose.yml` | Local service on port 8787 |

The browser sends numeric data rather than script text. The bridge selects and validates fields, writes files to a temporary directory, executes `GmatConsole`, parses reports, and returns JSON. Temporary directories are removed afterward. The cache is in memory, separate from PostgreSQL.

## Predictable startup

Docker Desktop must be running. `npm run dev` first attempts automatic startup: find the local base, pull from GHCR, or build locally. Failures do not stop Vite.

Two Compose files coexist: `compose.yaml` for PostgreSQL and `docker-compose.yml` for GMAT. Automatic startup omits `-f`, so do not assume it selects the correct service. To prepare the base manually:

```powershell
docker pull --platform linux/amd64 ghcr.io/nasa-spaceapp-2026/smdg-gmat-base:r2025a
docker tag ghcr.io/nasa-spaceapp-2026/smdg-gmat-base:r2025a smdg-gmat-base:r2025a
```

If pulling is unavailable, build the base instead:

```powershell
docker build --platform linux/amd64 -f docker/gmat/Dockerfile.base -t smdg-gmat-base:r2025a .
```

Then start the service:

```powershell
docker compose -f compose.yaml -f docker-compose.yml up -d --build gmat
```

The initial NASA download is roughly 420 MB. The target platform is `linux/amd64`; other architectures may require emulation. `GMAT_BASE_REMOTE` overrides the automatic startup script's remote image.

Check `http://localhost:8787/healthz`, then play through Vite. After changing mounted files:

```powershell
docker compose -f compose.yaml -f docker-compose.yml restart gmat
docker compose -f compose.yaml -f docker-compose.yml logs --tail 100 gmat
```

Dockerfile changes require rebuilding, rather than just restarting.

## API and load handling

| Method and path | Purpose |
| --- | --- |
| `GET /healthz` | HTTP service probe, `{ "ok": true }` |
| `POST /api/gmat` | Transfer ΔV and optional disposal burn |
| `POST /api/gmat/analysis` | Eclipses, contacts, and orbit evolution |
| `POST /api/gmat/lifetime` | Lifetime for `nom`, `max`, `min`, or `sail` scenario |

The HTTP server limits bodies to 32 KiB and allows 90 requests per minute per TCP peer using memory. These limits are separate from PostgreSQL account limits. Responses include `400` for invalid plans, `413` for oversized bodies, `429` for rate limiting, `503` for full queues, and `502` for computation failures.

The bridge has three separate queues, one per job type, each with one active job and at most five waiting. Timeouts are 30 seconds for transfers, 120 for analysis, and 240 for lifetime. Different job types may run concurrently. The bounded result cache is lost on restart.

`GMAT_CONSOLE` selects the executable; `PORT` sets the service port, default 8787. The HTTP probe alone does not prove a real GMAT calculation can finish.

## Models and gameplay effects

| Body | Gravity | Perturbations and atmosphere |
| --- | --- | --- |
| Earth | JGM2 4×4 | Jacchia-Roberts atmosphere |
| Moon | LP165P 20×20 | Earth and Sun, no atmospheric drag |
| Mars | Mars50c 20×20 | Sun and exponential atmosphere |
| Venus | MGNP180U 20×20 | Sun, no atmospheric drag model |

Transfers use impulsive-burn targeting. Analysis uses eclipse/contact locators and orbit propagation; the bridge derives station-keeping and element changes from reports.

Ground stations are Milan, Svalbard, and Canberra, with gameplay availability also depending on unlocked facilities. Worst-case eclipse feeds battery checks; decay contributes to station-keeping; lifetime affects reviews and disposal. The five-year threshold is an implemented game rule, not a claim of regulatory compliance.

Results appear in orbital budgets, design checks, reviews, and reports. Results attached to missions may persist in the browser save.

## Scientific assumptions and limits

- Fixed reference epoch of 1 January 2027; no full orbital calendar in the game.
- Constant Earth solar activity at separate levels rather than a real-cycle forecast.
- Simplified drag coefficient, satellite area, and sail parameters.
- Mars uses an exponential atmosphere rather than Mars-GRAM.
- Venus has no atmospheric drag; lifetime ends when periapsis reaches the atmosphere threshold.
- Approximate ground-station coordinates and epoch-dependent geometry.
- Displayed distances and light times do not automatically replace every local communications model.
- Agreement between two-body impulsive models checks numerical consistency, not real-flight accuracy.

These simulations are educational rather than operational mission validation.

## Preserved historical measurements

The previous report recorded container runs that were not repeated for this documentation update:

| Historical case | Reported result |
| --- | --- |
| LEO–GEO transfer | 3856.5 versus 3856.6 m/s from the local model |
| 45° plane change | About 5879 m/s in both models |
| GEO with inclination change | 4198.6 versus 4198.7 m/s |
| Lunar transfer | 1196.6 versus 1196.5 m/s |
| Earth orbit at 400 km, 51.6° | About 36 minutes maximum eclipse and 11 km/month decay |
| 3U lifetime at 400 km | 88 nominal days, 50 at solar maximum, 287 at solar minimum |
| Sun-synchronous orbit at 600 km | About +0.99°/day nodal drift |
| Moon at 100 km, 30° | Impact after about 11.4 days |
| Contacts from lunar and Martian orbits | About 400 minutes/day from modeled stations |
| Runtime | Transfers about 0.6 s, analysis about 10 s, lifetime seconds to about a minute in the historical environment |

These are regression examples, not universal values: mass, area, orbital elements, geometry, and model version matter. Earlier statements about total test counts or workflows never having run are not used to describe current status.

## Educational resources and traceability

The game includes a CML/MDL ladder, four mission segments, replay, and comparisons with MinXSS, RAVAN, CIRiS, MarCO, Lunar Flashlight, and CAPSTONE. Comparison data and links are in `TWIN` within `public/game/07-main.js`.

The NASA distribution and model files are identified by the base Dockerfile and generators. CML/MDL educational labels are a game adaptation; verify original sources before citing them as official terminology. Current validation procedures are in [testing](testing.md).

## Publishing

`.github/workflows/gmat-base-image.yml` builds and publishes the GHCR base on manual dispatch or matching file changes. Defining that process does not prove a particular image is currently available or public.

Development uses Vite's proxy. Azure requires separate container hosting and same-origin `/api/gmat*` routing; the current web package creates neither. Without the service, gameplay continues with the internal model.
