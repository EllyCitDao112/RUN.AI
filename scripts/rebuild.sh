#!/usr/bin/env bash
set -euo pipefail

echo "[rebuild] Starting full local rebuild flow"

if [ ! -f .env ] && [ -f .env.example ]; then
  cp .env.example .env
  echo "[rebuild] Created .env from .env.example"
fi

echo "[rebuild] Checking environment"
node scripts/env-doctor.js || true

echo "[rebuild] Clearing proxy vars for this run"
unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY npm_config_http_proxy npm_config_https_proxy

echo "[rebuild] Clearing npm proxy config"
npm config delete proxy || true
npm config delete https-proxy || true

echo "[rebuild] Installing deps"
npm install

echo "[rebuild] Compiling contracts"
npm run compile

echo "[rebuild] Building frontend"
npm run build

echo "[rebuild] Done"
