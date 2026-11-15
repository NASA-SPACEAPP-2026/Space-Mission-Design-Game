**English** | [Italiano](testing.it.md)

# Tests and validation

[Index](README.md) · [Entry flow](entry-flow.md) · [Deployment](deployment.md)

## CI checks

Use Node.js 24 or newer, matching `package.json` and the CI runtime:

```powershell
npm ci
npm run check
```

The suite limits workers to two to reduce CPU and memory contention during PGlite, scrypt and compression. Timeouts and assertions remain unchanged.

`npm test` also prints a complete table grouped by file, with each test's number, result (`PASS`, `FAIL`, `SKIP`), duration and full name. Long names wrap without truncation; Vitest still prints failure details and stack traces. On PowerShell, use `npm.cmd test` if execution policy blocks `npm.ps1`.

Passing tests are green, failures red and skipped tests yellow. The final summary lists per-file results, totals, the pass rate among executed tests and the actual elapsed time. Redirected logs stay uncolored; `FORCE_COLOR=1` forces colors and `NO_COLOR=1` disables them.

`check` runs Vitest, the production build and `scripts/verify-build.mjs` in sequence. A failed stage stops the command. CI also runs `npm run package:azure` on Linux; packaging needs Bash, npm and zip and an existing build.

| Test file | Coverage |
| --- | --- |
| `tests/content.test.mjs` | HTML, script order, saves, resources, renderers and mission contracts |
| `tests/server.test.mjs` | File serving, probe, caching, compression, HEAD, fallback and invalid paths |
| `tests/auth.test.mjs` | Passwords, uniqueness, cookies, sessions, CSRF, limits, username-only signup and repeatable upgrade of an existing DB |
| `tests/gmat-proxy.test.mjs` | GMAT HTTP proxy, methods, forwarded address, missing service and unreachable upstream |
| `tests/gmat.test.mjs` | GMAT script generation, validation and parsing |
| `tests/gmat-bridge.test.mjs` | Bridge using a simulated executable, queues and results |
| `tests/consortia.test.mjs`, `tests/consortia-ui.test.mjs` | Membership, roles, chat, moderation, spectating, joint missions, rankings and weekly challenges |
| `tests/roads.test.mjs` | Campus road geometry and placement |
| `tests/audit-api.test.mjs` | Invalid JSON, CSRF, forged sessions, upload limits, parallel reads, duplicate awards and seat contention |
| `tests/audit-database.test.mjs` | Database configuration, TLS and connection timeouts without external connections |
| `tests/audit-gmat.test.mjs` | Numeric input matrix, corrupt reports, queue recovery and cache behavior |
| `tests/audit-rules.test.mjs` | Orbital conservation laws, Hohmann transfers, independent mission state and challenge boundaries |

Run `npm run test:coverage` for V8 coverage of `backend/`, `server.mjs` and `scripts/gmat-bridge.mjs`. The HTML report is `test-results/coverage/index.html`; this percentage does not measure the whole browser UI. See the [2026-11-15 audit report (Italian)](test-audit-2026-11-15.it.md) for findings and limits.

PGlite tests use temporary embedded PostgreSQL, separate from Docker and real users. Simulated GMAT does not prove real container execution. `npm test` runs only the suite; `npm run build` only compiles.

## Complete account browser smoke

```powershell
npm run build
$env:CHROME_PATH = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
npm run smoke:account
```

Adapt the executable path. The script starts its own ephemeral server and PGlite DB. It checks the original title screen, the account gate on New game, dismissal with Cancel/Escape, two form inputs, automatic username-only signup, resuming the mode picker, sessions, logout, wrong passwords, service failure, mobile layout and cookies. Gameplay smoke checks saved-game persistence and resuming after reload. English, Italian persistence, keyboard entry and reduced motion are also checked. It does not create accounts in Docker or Azure. Screenshots are `dist/entry-title.png`, `dist/entry-register.png`, `dist/entry-mobile.png` and `dist/game-smoke.png`.

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

1. The title menu remains visible until an action; New game opens the account form for guests.
2. The combined account form accepts username and password; existing names require the matching password. API registration rejects duplicate usernames regardless of case and enforces 1–128 password characters.
3. Existing users still sign in; API email login remains compatible.
4. A wrong password or unavailable service leaves the entry form accessible and the game stopped.
5. Valid sessions open the mode picker directly; logout reloads the title menu as a guest.
6. Existing local saves survive sign-in/out, reload and account changes.
7. Verify keyboard, mobile portrait/landscape, reduced motion and WebGL fallback.
8. Apply migrations twice on a disposable existing schema; verify account data remains.

Local PostgreSQL defaults to host port 5432. If occupied, change both `POSTGRES_PORT` and the port in `DATABASE_URL`, then recreate only this project's container with Compose. Do not delete the data volume to troubleshoot connections.

## GMAT and deployment limits

Use the [GMAT guide](gmat-integration-report.md) for real Earth, Moon, Mars and Venus calculations and fallback checks. Authentication is required to reach the game; GMAT remains optional.

Local tests do not prove Azure firewall, TLS, custom-domain configuration, backup restore or deployed credentials. Remote CI smoke checks resources and `/api/auth/me`, not the whole login or GMAT flow. Apply migration 002 before deployment and validate registration, persistence after restart and environment isolation on staging.
