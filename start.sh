#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

echo "=========================================================="
echo "           iPort — iMessage Relay & API                   "
echo "=========================================================="

# Check node
if ! command -v node >/dev/null 2>&1; then
  echo "Error: Node.js is not installed."
  echo "Please install Node.js (https://nodejs.org) to run iPort."
  exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo " Warning: Node.js 18+ is recommended (detected $(node -v))."
fi

# Quick Full Disk Access probe
FDA_STATUS="Checking..."
if sqlite3 "$HOME/Library/Messages/chat.db" "SELECT count(*) FROM message LIMIT 1;" >/dev/null 2>&1; then
  FDA_STATUS="Granted (Full Disk Access active)"
else
  FDA_STATUS="Not Granted (Running in Demo/Simulation Mode)"
fi

echo "  Platform:   $(sw_vers -productName 2>/dev/null || uname -s) $(sw_vers -productVersion 2>/dev/null || uname -r)"
echo "  Full Disk:  $FDA_STATUS"
echo "=========================================================="
echo ""

MODE_ARG="$1"

# --- MODE 1: Headless API Only ---
if [ "$MODE_ARG" = "api" ] || [ "$MODE_ARG" = "--api" ]; then
  echo " Mode: Headless API Server (Strict JSON / SSE, no frontend assets)"
  echo ""
  exec node server/index.js --api "${@:2}"

# --- MODE 2: Development Mode (Backend + Vite HMR) ---
elif [ "$MODE_ARG" = "dev" ] || [ "$MODE_ARG" = "--dev" ]; then
  echo " Mode: Development (Unified Backend API + Vite HMR)"
  echo "   Backend:     http://localhost:3000/api"
  echo "   Vite Dev:    http://localhost:5173"
  echo "   (Press Ctrl+C to terminate both)"
  echo ""

  trap 'echo -e "\n Stopping iPort..."; kill $(jobs -p) 2>/dev/null || true; exit 0' EXIT INT TERM

  node --watch server/index.js &
  ./node_modules/.bin/vite &
  wait

# --- MODE 3: Full-Stack (Web Client + API together) ---
else
  echo " Mode: Full-Stack (Web Client + Headless API unified on single port)"

  # Auto-build frontend if dist does not exist or rebuild requested
  if [ ! -d "dist" ] || [ "$MODE_ARG" = "build" ] || [ "$MODE_ARG" = "--rebuild" ]; then
    echo " Compiling frontend assets..."
    npm run build
    echo ""
  fi

  echo " Launching unified server..."
  exec node server/index.js --full "$@"
fi
