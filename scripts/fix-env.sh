#!/usr/bin/env bash
set -euo pipefail

echo "[setup:local] Creating .env from .env.example if missing..."
if [ ! -f .env ] && [ -f .env.example ]; then
  cp .env.example .env
  echo "[setup:local] Created .env"
fi

echo "[setup:local] Clearing proxy variables for current command invocation..."
unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY npm_config_http_proxy npm_config_https_proxy

echo "[setup:local] Clearing npm proxy settings..."
npm config delete proxy || true
npm config delete https-proxy || true

echo "[setup:local] Running env doctor..."
node scripts/env-doctor.js || true

echo "[setup:local] Installing dependencies..."
npm install
