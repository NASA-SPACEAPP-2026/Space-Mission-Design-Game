**English** | [Italiano](README.it.md)

# Go No-Go documentation

The guides describe the implementation in the repository and are available in English and Italian. Filenames, variables, endpoints, and identifiers retain their actual code names.

## Reading paths

| Goal | Guide |
| --- | --- |
| Install and play | [Main README](../README.md) |
| Understand modules, rendering, and builds | [Architecture](architecture.md) |
| Understand what goes into the DB | [Accounts and database](authentication.md) |
| Find where missions are saved | [Local saves](legacy-save-format.md) |
| Enable or diagnose NASA GMAT | [GMAT integration](gmat-integration-report.md) |
| Deploy or operate Azure | [Deployment](deployment.md) |
| Run tests and browser checks | [Testing](testing.md) |
| Understand educational objectives | [Challenge](challenge.md) |

Every guide has a language link at the top. English uses `.md`; Italian uses `.it.md`, including the [Italian project README](../README.it.md) and [Italian challenge brief](challenge.it.md).

## Three separate concerns

1. **Local gameplay:** browser simulation and `gng32.save` in `localStorage`.
2. **Accounts:** Node APIs and PostgreSQL for users, sessions, and request limits.
3. **Orbital analysis:** optional GMAT service, accessed through Vite's development proxy.

Registration does not upload a mission. Deploying the Node server does not deploy GMAT. `/api/health` checks the process; `/api/auth/me` also queries the account schema.

## Sources of truth

| Subject | Files |
| --- | --- |
| Commands and dependencies | [`package.json`](../package.json), [`package-lock.json`](../package-lock.json) |
| DB schema | [`db/001-auth.sql`](../db/001-auth.sql) |
| Connection and migration | [`backend/database.mjs`](../backend/database.mjs), [`scripts/migrate.mjs`](../scripts/migrate.mjs) |
| Account contract | [`backend/auth.mjs`](../backend/auth.mjs), [`public/account.js`](../public/account.js) |
| Routing and file serving | [`server.mjs`](../server.mjs), [`vite.config.ts`](../vite.config.ts) |
| Saves and UI | [`public/game/07-main.js`](../public/game/07-main.js) |
| Local services | [`compose.yaml`](../compose.yaml), [`docker-compose.yml`](../docker-compose.yml) |
| Pipelines | [CI/CD](../.github/workflows/ci-cd.yml), [GMAT image](../.github/workflows/gmat-base-image.yml) |

## Maintaining the guides

When a contract changes, update both language versions of its guide and the README summary. Distinguish implemented behavior, future proposals, and historical measurements. Do not claim a remote environment has been verified without checking it.

`Go No-Go.html` and `dist/` are build outputs, not documentation to edit manually. Font licenses in `public/fonts/` retain their original text.
