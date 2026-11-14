**English** | [Italiano](entry-flow.it.md)

# Game entry and username accounts

## Experience

Opening the game shows a Go No-Go introduction with the original illustration returned by `artSVG('title')`. The introduction stays visible until click or keyboard activation, then the session is checked. A valid session leads to the campus. Otherwise, account creation appears, with a sign-in option for returning players.

Registration asks only for username (3–24 ASCII letters, digits, or underscores) and password (15–128 characters). A show/hide button helps password entry. Errors leave the form available; an unavailable account service does not grant access. The entry screen does not provide guest play.

After registration or login, gameplay starts directly in the campus. A new agency uses the username as its name; existing local saves are preserved. The in-game menu still provides other modes, tutorial, and settings. The Account button supports logout: after session revocation, the page reloads the entry flow.

The flow supports Italian and English through `gngLang`, mobile viewports, keyboard use, and reduced motion. Entry screens do not require landscape orientation; gameplay retains its own orientation guidance.

## Files and startup

- `index.html`: static entry screens, visible before game startup.
- `public/account.css`: styling, responsive layout, and animations.
- `public/account.js`: session check, intro, forms, requests, and logout.
- `public/game/07-main.js`: shares game artwork and starts once on `gng-authenticated`.
- `backend/auth.mjs`: registration without email, preserving existing email compatibility.

This screen controls the entry experience, rather than protecting static assets. APIs validate sessions on the server. Missions remain local and are not associated or synchronized with accounts.

## Required migration

Before using registration without email:

```powershell
docker compose -f compose.yaml up -d --wait postgres
npm run db:migrate
npm run dev:api
# In a second terminal:
npm run dev
```

First configure `.env` from `.env.example`, preserving any existing settings. Visit the origin in `APP_ORIGIN`, normally `http://localhost:5173`.

The migration runner applies `001-auth.sql`, then `002-username-accounts.sql`, in a transaction. The second migration only removes `NOT NULL` from `users.email`, preserving existing email addresses, passwords, and sessions. Unique indexes remain valid and allow multiple `NULL` emails. No fake email addresses are generated. Both migrations are repeatable; there is still no applied-version ledger.

For an existing environment, apply migration before deploying the new backend. Startup does not run it automatically. The registration API now uses `{username,password}`; email remains optional for compatibility, and API login with an existing email still works.

## Validation

`npm run check` runs tests, build, and bundle verification. Account tests also cover registration without email, multiple email-less users, case-insensitive uniqueness, and existing login compatibility.

Browser validation:

```powershell
npm run build
$env:CHROME_PATH = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
node scripts/smoke-account.mjs
```

The smoke uses temporary PGlite and checks artwork, persistent splash and click transition, signup, direct game entry, session restoration, logout, wrong passwords, service failure, cookies, and mobile. Verification images are written to `dist/entry-splash.png`, `dist/entry-register.png`, and `dist/entry-mobile.png`.

`npm run smoke` against an existing server now requires `GNG_USERNAME` and `GNG_PASSWORD` for an existing test account. Never put real credentials in files or commits.
