#!/usr/bin/env bash
# One-off Azure setup for staging (dev branch) and production (main branch).
# Requires: Azure CLI logged in (`az login`) with permission to create
# resources and an Entra app registration.
#
# Everything lives in ONE resource group so it can be removed in one command
# (see infra/azure-teardown.sh).
set -euo pipefail

GITHUB_REPO="${GITHUB_REPO:-NASA-SPACEAPP-2026/Space-Mission-Design-Game}"
LOCATION="${LOCATION:-westeurope}"
RG="${RG:-rg-space-mission-game}"
SUFFIX="${SUFFIX:-$(openssl rand -hex 3)}" # web app names are globally unique
STAGING_APP="smg-staging-$SUFFIX"
PROD_APP="smg-prod-$SUFFIX"
# Check the runtimes your CLI offers with: az webapp list-runtimes --os linux
RUNTIME="${RUNTIME:-NODE:22-lts}"
STARTUP="node app/backend/dist/index.js"

az group create --name "$RG" --location "$LOCATION" --output none

# Staging: free tier (60 CPU min/day, sleeps when idle, no SLA).
az appservice plan create --name plan-smg-staging --resource-group "$RG" \
  --location "$LOCATION" --is-linux --sku F1 --output none
# Production: Basic B1, billed per hour; delete the group when done.
az appservice plan create --name plan-smg-prod --resource-group "$RG" \
  --location "$LOCATION" --is-linux --sku B1 --output none

create_app() { # name plan
  az webapp create --name "$1" --resource-group "$RG" --plan "$2" \
    --runtime "$RUNTIME" --output none
  az webapp update --name "$1" --resource-group "$RG" --https-only true --output none
  az webapp config set --name "$1" --resource-group "$RG" \
    --startup-file "$STARTUP" --output none
  # We deploy a prebuilt package, so skip the remote build.
  az webapp config appsettings set --name "$1" --resource-group "$RG" \
    --settings SCM_DO_BUILD_DURING_DEPLOYMENT=false NODE_ENV=production --output none
}
create_app "$STAGING_APP" plan-smg-staging
create_app "$PROD_APP" plan-smg-prod
# Always On avoids cold starts; not available on the F1 plan.
az webapp config set --name "$PROD_APP" --resource-group "$RG" --always-on true --output none

# GitHub -> Azure login via OIDC (no secrets stored in GitHub).
APP_ID="$(az ad app create --display-name "gh-space-mission-game" --query appId -o tsv)"
az ad sp create --id "$APP_ID" --output none
for env in staging production; do
  az ad app federated-credential create --id "$APP_ID" --parameters "{
    \"name\": \"github-$env\",
    \"issuer\": \"https://token.actions.githubusercontent.com\",
    \"subject\": \"repo:$GITHUB_REPO:environment:$env\",
    \"audiences\": [\"api://AzureADTokenExchange\"]
  }" --output none
done
RG_ID="$(az group show --name "$RG" --query id -o tsv)"
az role assignment create --assignee "$APP_ID" --role "Website Contributor" \
  --scope "$RG_ID" --output none

TENANT_ID="$(az account show --query tenantId -o tsv)"
SUBSCRIPTION_ID="$(az account show --query id -o tsv)"

cat <<OUT

Azure is ready. Set these GitHub variables (not secrets) with the gh CLI:

  gh variable set AZURE_CLIENT_ID       --repo $GITHUB_REPO --body $APP_ID
  gh variable set AZURE_TENANT_ID       --repo $GITHUB_REPO --body $TENANT_ID
  gh variable set AZURE_SUBSCRIPTION_ID --repo $GITHUB_REPO --body $SUBSCRIPTION_ID
  gh api -X PUT repos/$GITHUB_REPO/environments/staging    >/dev/null
  gh api -X PUT repos/$GITHUB_REPO/environments/production >/dev/null
  gh variable set AZURE_WEBAPP_NAME --repo $GITHUB_REPO --env staging    --body $STAGING_APP
  gh variable set AZURE_WEBAPP_NAME --repo $GITHUB_REPO --env production --body $PROD_APP

Staging:    https://$STAGING_APP.azurewebsites.net
Production: https://$PROD_APP.azurewebsites.net
OUT
