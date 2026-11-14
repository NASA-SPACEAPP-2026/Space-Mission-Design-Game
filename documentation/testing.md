**English** | [Italiano](testing.it.md)

# Tests and validation

[Index](README.md) · [Setup](../README.md) · [Deployment](deployment.md)

## Standard check

With Node.js 24+ and dependencies installed:

```powershell
npm ci
npm run check
```

`check` runs Vitest, production build, and `scripts/verify-build.mjs` in sequence. A failure prevents later stages from running. The ordinary suite does not require external PostgreSQL or real GMAT.

## Automated coverage

| File | Scope |
| --- | --- |
| `tests/content.test.mjs` | HTML contract, script order, saves, resources, renderers |
| `tests/server.test.mjs` | File serving, probe, caching, compression, HEAD, fallback, invalid paths |
| `tests/auth.test.mjs` | Schema, passwords, uniqueness, sessions, cookies, origin, limits, errors |
| `tests/gmat.test.mjs` | GMAT script generation, validation, and result parsing |
| `tests/gmat-bridge.test.mjs` | Bridge with simulated executable, queues, and results |

Account tests use **PGlite**, embedded PostgreSQL installed as a development dependency. It is temporary and separate from `compose.yaml`. Simulated GMAT tests do not certify that Docker can download and execute NASA's program in the current environment.

Use `npm test` for tests only and `npm run build` for compilation only.

## Gameplay browser smoke

Requires a build, running server, and Chrome/Chromium. In one terminal:

```powershell
npm run build
node --env-file-if-exists=.env server.mjs
```

In another:

```powershell
$env:BASE_URL = 'http://localhost:8080'
$env:CHROME_PATH = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
npm run smoke
```

Adapt `CHROME_PATH` to the actual executable. `BASE_URL` defaults to `http://localhost:8080`. The script checks UI startup and reports page/console errors; it does not complete every mission.

## Account browser smoke

After `npm run build`:

```powershell
$env:CHROME_PATH = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
node scripts/smoke-account.mjs
```

The script starts its own temporary server on an available port and a PGlite DB, creates a test user, and exercises registration, reload, logout, and login. It checks `HttpOnly`/`SameSite` cookies and dialog visibility at a mobile viewport. It does not use Docker or Azure accounts and does not require `BASE_URL`.

## Manual local PostgreSQL checks

1. Run `docker compose -f compose.yaml up -d --wait postgres`.
2. Configure `.env`, run `npm run db:migrate`, and start the API and Vite.
3. Register and test case-insensitive username/email duplicates.
4. Try a wrong password and check that the error does not expose internal details.
5. Reload, open Account, and confirm the session.
6. Log out, then sign in by username and email.
7. Restart the backend and verify the account remains available.
8. Check that logout and account switching preserve the same local game.

Do not remove a volume containing data you want to keep just to repeat these checks.

## Manual GMAT checks

Use explicit Compose files as shown in the [GMAT guide](gmat-integration-report.md). Check `http://localhost:8787/healthz`, then play through Vite.

Try transfers, analysis, and lifetime for Earth, the Moon, Mars, and Venus. Check result sources, orbit edits, and recovery after computation errors. Repeat with the service stopped to verify the internal model. Historical GMAT measurements do not replace checks in the current environment.

## Graphics and saves

Check campus, rooms, editors, minigames, tutorial, and save reload. Try mobile viewport, WebGL available/unavailable, `?q=0`, `?q=3`, `?perf=1`, and reduced motion. Current automated graphics checks do not exhaustively cover every combination.

Back up `gng32.save` before testing recovery or deletion; UI reset flows may remove more keys than the main save alone.

## Staging-only checks

Local CI does not verify PostgreSQL certificates, Azure firewalls, deployed credentials, custom domains, persistence after Web App restart, or backup restoration. Pipeline remote smoke checks cover resources and a users-table query, not complete registration/login or GMAT. These checks require the actual target environment.
