#!/usr/bin/env bash
# Removes everything created by azure-setup.sh and stops all charges.
set -euo pipefail

RG="${RG:-rg-space-mission-game}"

az group delete --name "$RG" --yes --no-wait
APP_ID="$(az ad app list --display-name gh-space-mission-game --query '[0].appId' -o tsv)"
if [ -n "$APP_ID" ]; then az ad app delete --id "$APP_ID"; fi
echo "Deletion of $RG started. It finishes in a few minutes."
