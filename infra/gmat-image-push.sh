#!/usr/bin/env bash
# Builds the NASA GMAT service image (linux/amd64) and pushes it to a PUBLIC registry, so Azure can pull it without credentials or a paid registry.
# Requires: Docker with buildx, `docker login` to the registry. The first build downloads GMAT (about 420 MB).
#
#   REPO=docker.io/<your-dockerhub-user> ./infra/gmat-image-push.sh
#
# Afterwards make both repositories public (Docker Hub: repository -> Settings -> Visibility), then run infra/azure-gmat.sh.
set -euo pipefail
: "${REPO:?set REPO, e.g. REPO=docker.io/<your-dockerhub-user>}"

docker buildx build --platform linux/amd64 -f docker/gmat/Dockerfile.base -t "$REPO/smdg-gmat-base:r2025a" --push .
docker buildx build --platform linux/amd64 -f docker/gmat/Dockerfile --build-arg BASE="$REPO/smdg-gmat-base:r2025a" -t "$REPO/smdg-gmat:latest" --push .

echo
echo "Done. Next: IMAGE=$REPO/smdg-gmat:latest ./infra/azure-gmat.sh"
