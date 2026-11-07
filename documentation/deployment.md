# Deployment (Azure App Service + GitHub Actions)

## How it works

`.github/workflows/ci-cd.yml` runs on every pull request and push to `main` / `dev`:

1. **Build and test**: `npm ci`, `npm run check` (Vitest + Vite build), then
   `npm run package:azure` builds `release.zip`.
2. **Deploy** (push only): the job logs in to Azure with OIDC (no stored password), deploys the
   zip and smoke-tests `/api/health`, `/` and the audio asset.

| Branch | GitHub Environment | Azure Web App | Plan |
|--------|--------------------|---------------|------|
| `dev`  | `staging`          | `smg-staging-*` | F1 (free) |
| `main` | `production`       | `smg-prod-*`    | B1 (about 12 EUR/month, billed hourly) |

The zip contains:

```text
dist/          static 2D game (index.html + hashed assets/ + audio + .br/.gz)
server.mjs     minimal static server, Node built-ins only
package.json   runtime manifest, no dependencies
```

The build minifies the split game scripts into one content-hashed
`assets/game-<hash>.js` and precompresses text assets. `server.mjs` serves the `.br`/`.gz`
version, sets `ETag`/`Last-Modified`/`Content-Length` and answers `304` on revalidation.

App Service runs `node server.mjs`. There is no API process, no database and no build step on
the server.

## One-time setup

1. `az login`, then run `./infra/azure-setup.sh`. It creates the resource group, the two plans
   and web apps, sets the startup command to `node server.mjs`, and creates the OIDC trust for
   the two GitHub environments.
2. Run the `gh variable set ...` commands it prints (repository variables plus
   `AZURE_WEBAPP_NAME` per environment).
3. In GitHub: protect `main` and `dev` (require PR + the "Build and test" check). Optionally add
   required reviewers to the `production` environment for a manual approval before each deploy.
4. Push to `dev` first and check the staging URL, then merge `dev` into `main`.

### Existing web apps created before the 2D refactor

They may still point at the removed `app/backend/dist/index.js`. The deploy action now sets
`startup-command: node server.mjs`, uses `clean: true` and restarts the app, so the next
`dev`/`main` deploy fixes them automatically.

If you need to fix one immediately, replace `<app>` with the real App Service name (without
angle brackets: the shell reads `<app>` as input redirection):

```bash
az webapp config set --name smg-staging-768b8a --resource-group rg-space-mission-game \
  --startup-file "node server.mjs"
az webapp restart --name smg-staging-768b8a --resource-group rg-space-mission-game
```

The Node runtime must be 24:

```bash
az webapp config show --name <app> --resource-group rg-space-mission-game --query linuxFxVersion
az webapp config set  --name <app> --resource-group rg-space-mission-game --linux-fx-version "NODE|24-lts"
```

## Caching

`server.mjs` sets:

- `index.html`: `no-cache`;
- `/assets/*` (Vite content-hashed files): `public, max-age=31536000, immutable`;
- other files: `public, max-age=3600`;
- `/api/health`: `no-store`.

## After the challenge

`./infra/azure-teardown.sh` deletes the resource group and the app registration, which stops all
charges. Set a budget alert in Azure Cost Management while the app is live.

## Known gaps

- The F1 staging app stops for the day after 60 CPU minutes and sleeps when idle.
- `index.html` is still a monolith; the module extraction described in
  [architecture.md](./architecture.md) is the next step.
- There is no server-side leaderboard or multiplayer backend. Saves are per browser.
