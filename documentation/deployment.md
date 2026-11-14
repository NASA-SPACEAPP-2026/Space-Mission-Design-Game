**English** | [Italiano](deployment.it.md)

# Azure deployment and CI/CD

[Index](README.md) · [Database setup](authentication.md) · [Testing](testing.md)

## Deployment components

The main application includes compiled assets and a Node server. PostgreSQL is separate; GMAT is another optional service. The Node server now forwards `/api/gmat`, `/api/gmat/analysis` and `/api/gmat/lifetime` to the configured service. Production uses `GMAT_URL`, otherwise `gmat-service.json`; `GMAT_URL=off` disables the proxy. No service returns `503 no-gmat`; an unreachable service returns `502 gmat-unreachable`. The container remains separate and is not included in the web ZIP.

| Component | Runtime |
| --- | --- |
| Frontend | `dist/` files served by the backend |
| HTTP and accounts | Node.js 24+, started with `node server.mjs` |
| Users and sessions | PostgreSQL selected by `DATABASE_URL` |
| GMAT calculations | Separate container, requiring its own hosting and routing |

This guide describes repository scripts and workflows. Verify actual resource names, deployment status, and costs in the target Azure account.

## Branches and environments

| Event | CI behavior |
| --- | --- |
| PR targeting `dev` or `main` | Install, test, build, verify, and package |
| Push to `dev` | Checks and deployment to `staging` |
| Push to `main` | Checks and deployment to `production` |
| Push to a working branch | No deployment configured by this workflow |

Recommended flow: working branch → PR to `dev` → staging validation → PR from `dev` to `main`. Creating `update-documentation` does not publish a site.

## Release contents

After `npm run build`, `npm run package:azure` uses Bash and `zip` to create `release.zip`:

```text
release.zip
  dist/                  HTML, hashed bundles, audio, fonts, compressed assets
  server.mjs             HTTP server, accounts and GMAT proxy
  gmat-service.json      Default shared GMAT target
  backend/               Authentication and PostgreSQL connection
  db/                    SQL schema
  scripts/migrate.mjs    Schema application command
  package.json
  package-lock.json
  node_modules/          Runtime dependencies from npm ci --omit=dev
```

Packaging requires an existing build and checks essential assets. CI runs it on Linux, installing runtime dependencies in the packaging environment. App Service does not perform a remote build.

On Windows, use an environment with Bash, npm, and `zip`, such as a properly configured WSL installation. This is not a native PowerShell command.

## Initial provisioning

### 1. Web applications and pipeline identity

Read and run `infra/azure-setup.sh` in Bash with authenticated Azure CLI and suitable permissions. It defines a resource group, two Linux plans, and two Web Apps:

| Environment/setting | Script value |
| --- | --- |
| Staging | F1 plan, no Always On |
| Production | B1 plan, Always On enabled |
| Default region | `westeurope` |
| Default runtime | `NODE:24-lts` |
| Startup | `node server.mjs` |

SKUs are script choices rather than guarantees of availability or price. F1 has operational limits and may suspend the app. Provisioning creates resources that may incur charges.

The script configures HTTPS, `SCM_DO_BUILD_DURING_DEPLOYMENT=false`, `NODE_ENV=production`, an Entra application, and GitHub OIDC federated credentials for `staging` and `production`. It assigns `Website Contributor` on the resource group and prints commands to set GitHub variables.

### 2. GitHub variables

| Variable | Scope |
| --- | --- |
| `AZURE_CLIENT_ID` | Repository |
| `AZURE_TENANT_ID` | Repository |
| `AZURE_SUBSCRIPTION_ID` | Repository |
| `AZURE_RESOURCE_GROUP` | Optional; workflow defaults to `rg-space-mission-game` |
| `AZURE_WEBAPP_NAME` | Specific to each GitHub Environment |

Azure authentication uses OIDC. DB credentials must not be placed in these public workflow configuration variables.

### 3. Per-environment database

After creating the Web App, run `infra/azure-database.sh` separately for each environment, setting `RG`, `PG_SERVER`, `WEBAPP`, and `PG_ADMIN_PASSWORD`. Do not enable shell tracing with secrets.

The script creates PostgreSQL 17 Flexible Server, its database, and firewall rules for possible Web App outbound IPs. It does not automatically authorize the machine running migrations. Staging and production must use separate databases and credentials.

### 4. App Service settings

| Setting | Required value |
| --- | --- |
| `DATABASE_URL` | Environment-specific PostgreSQL URL with correctly encoded credentials |
| `DATABASE_SSL` | `true` |
| `APP_ORIGIN` | Actual visited HTTPS origin, without trailing slash |
| `NODE_ENV` | `production`, including hosted staging |

Manage secrets securely, optionally using Key Vault references. TLS certificate verification stays enabled. Production rejects missing DB configuration, disabled TLS, or an HTTP origin.

### 5. Schema before release

Email-free signup also requires `002-username-accounts.sql`: apply it before the backend. Existing users remain valid. Verify the splash, CSS, account script and artwork after deployment. [Entry and accounts](entry-flow.md).


From an environment authorized to reach PostgreSQL, set the correct variables and run `npm run db:migrate`. This command also loads `.env` if present: make sure it does not accidentally select the local DB.

Apply the migration **before deployment**, first in staging and then production. Provisioning, Node startup, and the current CI/CD workflow do not run it automatically. See [migration runner limitations](authentication.md#startup-and-migrations).

## Workflow sequence

`.github/workflows/ci-cd.yml`:

1. Checks out source, configures Node 24, and runs `npm ci`.
2. Runs `npm run check` and `npm run package:azure`.
3. For pushes, uploads a temporary artifact and starts the environment deployment job.
4. Authenticates through OIDC and deploys the ZIP with cleanup and startup command `node server.mjs`.
5. Explicitly restarts App Service.
6. Retries smoke checks to accommodate cold starts.

Remote smoke checks cover the probe, Brotli, ETag, HTML, `/api/auth/me`, game bundle, fonts, and audio. They do not register users, complete login, or check GMAT. An unauthenticated `/api/auth/me` response proves access to the users table, not the entire account contract.

Protect `dev` and `main` with required PRs and checks. Any production deployment approval is configured in its GitHub Environment.

## Caching and invalidation

The server gives `/assets/*`, `/audio/*`, and `/fonts/*` one-year immutable caching, HTML and `/game/*` `no-cache`, and other files one-hour caching. APIs and probes use `no-store`.

The game bundle has a content hash in its filename; audio uses a versioned URL. Changes to stable filenames with long caching need a new URL or a suitable invalidation strategy.

## Validation, rollback, and diagnosis

After deployment, verify registration, login, logout, account persistence after app restart, staging/production isolation, and required account entry. Check that existing saves still load on the same origin. See [testing](testing.md) for complete flows.

| Symptom | Check |
| --- | --- |
| Process does not start | Node runtime, startup command, required variables |
| Probe succeeds, accounts return `503` | DB, DNS, firewall, certificates, credentials, schema |
| Accounts return `403` | `APP_ORIGIN`, custom domain, actual protocol |
| Old HTML served | Actual deployment, process restart, bundle URL |
| GMAT returns `503` / `502` | `GMAT_URL` configuration and upstream availability |

Rollback deploys a previous application release; it does not restore PostgreSQL schema or data. Assess code/schema compatibility and verify backup/restore before migrations. Do not delete tables or volumes to fix connection errors.


## GMAT on Azure Container Apps

`infra/gmat-image-push.sh` builds and pushes base and service `linux/amd64` images, requiring Docker buildx, registry login and `REPO`. Images must be public for the current provisioning flow. `infra/azure-gmat.sh` requires `IMAGE`, creates a Container Apps environment and a service with 1 vCPU, 2 GiB, external ingress on 8787 and 0–1 replicas. It sets `GMAT_URL` on Web Apps found in the resource group.

These scripts publish images and create external resources; they are not run to prepare this branch. Costs depend on the environment; scale-to-zero introduces cold starts. `gmat-service.json`, included in the web package, provides the default shared target. Update it if the service moves, or use environment-specific `GMAT_URL`. `GMAT_URL=off` disables only the production server proxy.

The Node server now forwards `/api/gmat`, `/api/gmat/analysis` and `/api/gmat/lifetime` to the configured service. Production uses `GMAT_URL`, otherwise `gmat-service.json`; `GMAT_URL=off` disables the proxy. No service returns `503 no-gmat`; an unreachable service returns `502 gmat-unreachable`. The container remains separate and is not included in the web ZIP.

`npm run dev` attempts the local container using explicit `docker-compose.yml` and writes `.gmat-target`, ignored by Git. If Docker is unavailable or startup fails, it selects the shared service in `gmat-service.json`. Vite uses `GMAT_URL` when set to a value other than `off`, otherwise `.gmat-target`, then the shared service and finally localhost:8787. The production server handles `off` as disabling GMAT; it does not currently disable the Vite proxy. Defining a shared endpoint does not certify its remote availability in this branch validation.

## Resource removal

`infra/azure-teardown.sh` initiates deletion of the entire resource group and removes an Entra application found by name. This is destructive and includes databases in that group. Verify subscription, group, identity, and backups first. Resources outside the group are not automatically removed.
