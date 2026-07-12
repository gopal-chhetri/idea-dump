#!/usr/bin/env bash
set -euo pipefail

echo "=== VPS Setup: idea_dump ==="

# Install Docker if missing
if ! command -v docker &>/dev/null; then
  echo "Installing Docker..."
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker "${USER}"
  echo "Docker installed. You may need to log out and back in for group changes."
fi

# Create target directory
sudo mkdir -p /opt/app/idea_dump
sudo chown "${USER}:${USER}" /opt/app/idea_dump

# Create traefik network if missing
docker network inspect traefik-network &>/dev/null || \
  docker network create traefik-network

echo "=== VPS setup complete ==="
echo ""
echo "Next steps:"
echo "  1. Install Infisical CLI: https://infisical.com/docs/cli/installation"
echo "  2. Authenticate: infisical login"
echo "  3. Run deploy: infisical run -- ./deployments/production/deploy.sh <tag>"
