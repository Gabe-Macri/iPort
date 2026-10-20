#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

echo "=========================================================="
echo "           💬 iPort — iMessage Web Relay                 "
echo "=========================================================="

# Check node
if ! command -v node >/dev/null 2>&1; then
  echo "❌ Error: Node.js is not installed."
  echo "Please install Node.js (https://nodejs.org) to run iPort."
  exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "⚠️ Warning: Node.js 18+ is recommended (detected $(node -v))."
fi

# Quick Full Disk Access probe
FDA_STATUS="Checking..."
if sqlite3 "$HOME/Library/Messages/chat.db" "SELECT count(*) FROM message LIMIT 1;" >/dev/null 2>&1; then
  FDA_STATUS="✅ Granted (Full Disk Access active)"
else
  FDA_STATUS="⚠️ Not Granted (iPort will run with Demo/Setup Mode until enabled)"
fi

echo "  macOS Status:  $(sw_vers -productName) $(sw_vers -productVersion)"
echo "  Full Disk:     $FDA_STATUS"
echo "=========================================================="
echo ""

# Start server
node server/index.js
