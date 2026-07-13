#!/usr/bin/env bash
set -euo pipefail

TAG="${1:-latest}"
REGISTRY_OWNER="${REGISTRY_OWNER:-gopal-chhetri}"
IMAGE="ghcr.io/${REGISTRY_OWNER}/idea_dump:${TAG}"
COMPOSE_DIR="$(cd "$(dirname "$0")" && pwd)"
TARGET_DIR="/opt/app/idea_dump"

echo "=== Deploying idea_dump:${TAG} ==="

mkdir -p "${TARGET_DIR}"
cp "${COMPOSE_DIR}/compose.yml" "${TARGET_DIR}/compose.yml"

echo "Pulling ${IMAGE}..."
docker pull "${IMAGE}"

cd "${TARGET_DIR}"

echo "Running migrations..."
REGISTRY_OWNER="${REGISTRY_OWNER}" \
  IMAGE_TAG="${TAG}" \
  docker compose run --rm migrate

echo "Starting services..."
REGISTRY_OWNER="${REGISTRY_OWNER}" \
  IMAGE_TAG="${TAG}" \
  docker compose up -d

docker image prune -f

echo "=== Deploy complete ==="
