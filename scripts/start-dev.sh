#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "Starting YatraAI full-stack dev environment..."

if ! command -v npm >/dev/null 2>&1; then
  echo "[ERROR] npm is not installed. Install Node.js first."
  exit 1
fi

if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

if [[ "$OSTYPE" == "darwin"* ]]; then
  osascript <<OSA
 tell application "Terminal"
   activate
   do script "cd '$ROOT_DIR' && npm run dev:api"
   do script "cd '$ROOT_DIR' && npm run dev"
 end tell
OSA
else
  gnome-terminal -- bash -lc "cd '$ROOT_DIR' && npm run dev:api; exec bash" \
    || xterm -e "cd '$ROOT_DIR' && npm run dev:api; bash" &
  gnome-terminal -- bash -lc "cd '$ROOT_DIR' && npm run dev; exec bash" \
    || xterm -e "cd '$ROOT_DIR' && npm run dev; bash" &
fi

echo "API:      http://localhost:8787"
echo "Frontend: http://localhost:5173"
echo "Demo login: sinchana@example.com / password123"
