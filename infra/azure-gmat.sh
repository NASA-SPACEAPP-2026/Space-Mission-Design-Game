#!/usr/bin/env bash
# NASA GMAT as a service on Azure Container Apps (consumption plan, scale to zero).
# With min replicas 0 you only use compute while GMAT is running, which normally stays inside the monthly free grant of the consumption plan
# (check the current Azure pricing page). The first call after an idle period is slow: the container has to start (cold start, tens of seconds).
# Requires: Azure CLI logged in (`az login`) and a PUBLIC image (see infra/gmat-image-push.sh).
#
#   IMAGE=docker.io/<user>/smdg-gmat:latest ./infra/azure-gmat.sh
#
# Uses the same resource group as infra/azure-setup.sh, so infra/azure-teardown.sh removes it too.
# The script also sets GMAT_URL on the web apps found in that group: the site server then forwards /api/gmat* to the container.
set -euo pipefail
: "${IMAGE:?set IMAGE to the public image, e.g. IMAGE=docker.io/<user>/smdg-gmat:latest}"
LOCATION="${LOCATION:-westeurope}"
RG="${RG:-rg-space-mission-game}"
ENV_NAME="${ENV_NAME:-cae-smg}"
APP_NAME="${APP_NAME:-ca-smg-gmat}"

az extension add --name containerapp --upgrade --only-show-errors
az provider register --namespace Microsoft.App --wait
az provider register --namespace Microsoft.OperationalInsights --wait

az group create --name "$RG" --location "$LOCATION" --output none
az containerapp env create --name "$ENV_NAME" --resource-group "$RG" --location "$LOCATION" --output none

# 1 vCPU / 2 GiB, at most one replica: GMAT jobs queue inside the service, and the free grant goes further.
az containerapp create --name "$APP_NAME" --resource-group "$RG" --environment "$ENV_NAME" \
  --image "$IMAGE" --target-port 8787 --ingress external \
  --cpu 1.0 --memory 2.0Gi --min-replicas 0 --max-replicas 1 --output none

FQDN="$(az containerapp show --name "$APP_NAME" --resource-group "$RG" --query properties.configuration.ingress.fqdn --output tsv)"
GMAT_URL="https://$FQDN"
echo "GMAT service: $GMAT_URL  (health: $GMAT_URL/healthz; the first call after idle takes a while)"

APPS="$(az webapp list --resource-group "$RG" --query '[].name' --output tsv || true)"
if [ -z "$APPS" ]; then
  echo "No web apps in $RG. Set GMAT_URL=$GMAT_URL on the site yourself (az webapp config appsettings set ... --settings GMAT_URL=$GMAT_URL)."
else
  for app in $APPS; do
    az webapp config appsettings set --name "$app" --resource-group "$RG" --settings "GMAT_URL=$GMAT_URL" --output none
    echo "GMAT_URL set on $app"
  done
fi
