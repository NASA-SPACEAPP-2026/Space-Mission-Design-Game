# Deployment (Azure App Service + GitHub Actions)

## How it works

`.github/workflows/ci-cd.yml` runs on every pull request and push to `main` / `dev`:

1. **Build and test**: `npm ci`, `npm run build`, `npm test` (Node 24).
2. **Deploy** (push only): `scripts/package-azure.sh` builds `release.zip`, then the job logs in to
   Azure with OIDC (no stored password), deploys it, and smoke-tests `/api/health`.

| Branch | GitHub Environment | Azure Web App | Plan |
|--------|--------------------|---------------|------|
| `dev`  | `staging`          | `smg-staging-*` | F1 (free) |
| `main` | `production`       | `smg-prod-*`    | B1 (about 12 EUR/month, billed hourly) |

One Express process serves both the API (`/api/*`) and the built frontend, so the relative
`/api` calls in the frontend work without CORS or proxies. The original game
(`app/frontend/public/legacy-game.html`) is part of the frontend build, so it is served at
`/legacy-game.html` for the mission console iframe.

## One-time setup

1. `az login`, then run `./infra/azure-setup.sh`. It creates the resource group, the two plans
   and web apps, and the OIDC trust for the two GitHub environments.
2. Run the `gh variable set ...` commands it prints (repository variables plus
   `AZURE_WEBAPP_NAME` per environment).
3. In GitHub: protect `main` and `dev` (require PR + the "Build and test" check). Optionally add
   required reviewers to the `production` environment for a manual approval before each deploy.
4. Push to `dev` first and check the staging URL, then merge `dev` into `main`.

## Node.js version

CI builds with Node 24 and `infra/azure-setup.sh` creates the web apps with `NODE:24-lts`. Web apps
created earlier keep the runtime they were created with; check and align them once:

```bash
az webapp config show --name <app> --resource-group rg-space-mission-game --query linuxFxVersion
az webapp config set  --name <app> --resource-group rg-space-mission-game --linux-fx-version "NODE|24-lts"
```

## After the challenge

`./infra/azure-teardown.sh` deletes the resource group and the app registration, which stops all
charges. Set a budget alert in Azure Cost Management while the app is live.

## Known gaps

- The database is not wired up yet (no MySQL driver is installed). When it is, the SQL files in `app/backend/src/migrations/sql`
  must be copied into `app/backend/dist` (tsc does not copy them), and the connection string
  goes in App Service application settings.
- The F1 staging app stops for the day after 60 CPU minutes and sleeps when idle.
