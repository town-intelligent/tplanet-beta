#!/bin/bash
# TPlanet Deploy - Setup Script
# Clone all application repos into apps/ directory

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APPS_DIR="$SCRIPT_DIR/apps"

echo "=== TPlanet Deploy Setup ==="

# Create apps directory if not exists
mkdir -p "$APPS_DIR"
cd "$APPS_DIR"

# Clone repos if not already present
clone_if_missing() {
    local name=$1
    local url=$2

    if [ -d "$name" ]; then
        echo "✓ $name already exists, skipping..."
    else
        echo "→ Cloning $name..."
        git clone "$url"
    fi
}

clone_if_missing "tplanet-AI" "git@github.com:town-intelligent-beta/tplanet-AI.git"
clone_if_missing "tplanet-daemon" "git@github.com:town-intelligent/tplanet-daemon.git"
clone_if_missing "LLMTwins" "git@github.com:towNingtek/LLMTwins.git"
clone_if_missing "ollama-gateway" "git@github.com:towNingtek/ollama-gateway.git"

echo ""
echo "=== Setup Complete ==="
echo "Apps directory: $APPS_DIR"
ls -la "$APPS_DIR"
echo ""
echo "Next steps:"
echo "  docker compose -f docker-compose.yml -f docker-compose.beta.yml up -d"
