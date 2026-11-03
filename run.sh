#!/usr/bin/env bash
# Start FileAtlas on a fixed port, freeing it first if something already holds it.
# Usage: ./run.sh            (dev)       ./run.sh prod   (build + production)
# Env:   PORT (default 4757)  FILEATLAS_PATHS  FILEATLAS_DEPTH  FILEATLAS_MAX_FILES
set -euo pipefail
cd "$(dirname "$0")"
export PORT="${PORT:-4757}"

pids=$(lsof -ti "tcp:$PORT" -sTCP:LISTEN || true)
if [ -n "$pids" ]; then
  echo "Port $PORT in use (pid $pids) - killing"
  kill $pids 2>/dev/null || true
  sleep 1
  pids=$(lsof -ti "tcp:$PORT" -sTCP:LISTEN || true)
  [ -n "$pids" ] && kill -9 $pids
fi

[ -d node_modules ] || npm install

echo "FileAtlas -> http://127.0.0.1:$PORT   (standalone: /fileatlas.html)"
if [ "${1:-}" = "prod" ]; then npm run build && exec npm start; else exec npm run dev; fi
