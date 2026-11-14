**English** | [Italiano](testing.it.md)

# Tests and validation

[Index](README.md) · [Entry flow](entry-flow.md) · [Deployment](deployment.md)

## CI checks

Use Node.js 24 or newer, matching `package.json` and the CI runtime:

```powershell
npm ci
npm run check
```

`check` runs Vitest, the production build and `scripts/verify-build.mjs` in sequence. A failed stage stops the command. CI also runs `npm run package:azure` on Linux; packaging needs Bash, npm and zip and an existing build.

| Test file | Coverage |
| --- | --- |
| `tests/content.test.mjs` | HTML, script order, saves, resources, renderers and mission contracts |
| `tests/server.test.mjs` | File serving, probe, caching, compression, HEAD, fallback and invalid paths |
| `tests/auth.test.mjs` | Passwords, uniqueness, cookies, sessions, CSRF, limits, username-only signup and repeatable upgrade of an existing DB |
| `tests/gmat.test.mjs` | GMAT script generation, validation and parsing |
| `tests/gmat-bridge.test.mjs` | Bridge using a simulated executable, queues and results |

PGlite tests use temporary embedded PostgreSQL, separate from Docker and real users. Simulated GMAT does not prove real container execution. `npm test` runs only the suite; `npm run build` only compiles.

## Complete account browser smoke

```powershell
npm run build
$env:CHROME_PATH = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
node scripts/smoke-account.mjs
```

Adapt the executable path. The script starts its own ephemeral server and PGlite DB. It checks artwork, splash persistence beyond three seconds, click-to-continue, exactly two form inputs, password visibility, username-only registration, direct campus entry, session restoration, logout, wrong passwords, service failure, mobile layout and cookie attributes. It also runs the gameplay smoke against the same temporary server and checks English, keyboard entry and reduced motion. It does not create accounts in Docker or Azure. Screenshots are written to `dist/entry-splash.png`, `dist/entry-register.png` and `dist/entry-mobile.png`; gameplay smoke writes `dist/game-smoke.png`.

## Gameplay smoke against an existing server

Start PostgreSQL and the API after applying both migrations. Build the frontend and serve it with `node --env-file-if-exists=.env server.mjs`; set `APP_ORIGIN=http://localhost:8080` for this direct test. Then, in another terminal:

```powershell
$env:BASE_URL = 'http://localhost:8080'
$env:CHROME_PATH = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
# Supply GNG_USERNAME and GNG_PASSWORD through your environment for an existing test account.
npm run smoke
```

This smoke requires `GNG_USERNAME` and `GNG_PASSWORD`, signs in rather than registering, checks the rendered campus/HUD and reports page or console errors. Never commit credentials. Restore the Vite origin before returning to development.

## Manual checklist

1. Splash remains until click or keyboard activation; no countdown.
2. Registration needs username and password only; reject short passwords and duplicate usernames regardless of case.
3. Existing users still sign in; API email login remains compatible.
4. A wrong password or unavailable service leaves the entry form accessible and the game stopped.
5. Valid sessions enter the campus after clicking the splash; logout returns to entry.
6. Existing local saves survive sign-in/out, reload and account changes.
7. Verify keyboard, mobile portrait/landscape, reduced motion and WebGL fallback.
8. Apply migrations twice on a disposable existing schema; verify account data remains.

Local PostgreSQL defaults to host port 5432. If occupied, change both `POSTGRES_PORT` and the port in `DATABASE_URL`, then recreate only this project's container with Compose. Do not delete the data volume to troubleshoot connections.

## GMAT and deployment limits

Use the [GMAT guide](gmat-integration-report.md) for real Earth, Moon, Mars and Venus calculations and fallback checks. Authentication is required to reach the game; GMAT remains optional.

Local tests do not prove Azure firewall, TLS, custom-domain configuration, backup restore or deployed credentials. Remote CI smoke checks resources and `/api/auth/me`, not the whole login or GMAT flow. Apply migration 002 before deployment and validate registration, persistence after restart and environment isolation on staging.
