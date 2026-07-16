#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js 20 or newer is required." >&2
  exit 1
fi

if [ ! -f "$BACKEND_DIR/.env" ]; then
  cp "$BACKEND_DIR/env.example" "$BACKEND_DIR/.env"
  echo "Created backend/.env from env.example. Add your local PostgreSQL password, then run this script again."
  exit 1
fi

cd "$BACKEND_DIR"
npm install
npm run db:init

echo "Database creation, migrations, and portfolio seed data are complete."
