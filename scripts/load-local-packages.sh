#!/usr/bin/env bash
set -euo pipefail

VENDOR_DIR="vendor/npm"

if [ ! -d "$VENDOR_DIR" ]; then
  echo "[local-packages] Missing $VENDOR_DIR"
  echo "Create it and place package tarballs (*.tgz) copied from a machine that can access npm."
  echo "Example: npm pack vite@5.4.10 && mv vite-5.4.10.tgz $VENDOR_DIR/"
  exit 1
fi

mapfile -t TARBALLS < <(find "$VENDOR_DIR" -maxdepth 1 -type f -name '*.tgz' | sort)
if [ "${#TARBALLS[@]}" -eq 0 ]; then
  echo "[local-packages] No tarballs found in $VENDOR_DIR"
  exit 1
fi

echo "[local-packages] Installing local tarballs"
npm install "${TARBALLS[@]}"

echo "[local-packages] Attempting offline dependency resolution from npm cache"
npm install --offline || true

echo "[local-packages] Done. If unresolved dependencies remain, add more tarballs and re-run."
