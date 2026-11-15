#!/usr/bin/env bash
# Run once per environment after az login. Do not enable shell tracing.
set -euo pipefail
: "${RG:?Resource group required}"
: "${PG_SERVER:?Unique PostgreSQL server name required}"
: "${WEBAPP:?Existing App Service name required}"
: "${PG_ADMIN_PASSWORD:?Set a strong password in your shell}"
LOCATION="${LOCATION:-westeurope}"
PG_ADMIN="${PG_ADMIN:-gngadmin}"
PG_DATABASE="${PG_DATABASE:-gng}"
az postgres flexible-server create --resource-group "$RG" --name "$PG_SERVER" \
  --location "$LOCATION" --admin-user "$PG_ADMIN" --admin-password "$PG_ADMIN_PASSWORD" \
  --sku-name Standard_B1ms --tier Burstable --version 17 --storage-size 32 \
  --backup-retention 7 --public-access None --output none
az postgres flexible-server db create --resource-group "$RG" --server-name "$PG_SERVER" \
  --database-name "$PG_DATABASE" --output none
IPS="$(az webapp show -g "$RG" -n "$WEBAPP" --query possibleOutboundIpAddresses -o tsv)"
IFS=',' read -ra ADDRESSES <<< "$IPS"
for ip in "${ADDRESSES[@]}"; do
  az postgres flexible-server firewall-rule create -g "$RG" -n "$PG_SERVER" \
    --rule-name "app-${ip//./-}" --start-ip-address "$ip" --end-ip-address "$ip" --output none
done
echo 'Database created. Configure App Service settings and apply the schema using documentation/authentication.md.'
