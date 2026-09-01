#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
VENV_DIR="$ROOT_DIR/cloud_ecs/.venv"

cd "$ROOT_DIR"

if [ ! -d "$VENV_DIR" ]; then
  python3 -m venv "$VENV_DIR"
fi

source "$VENV_DIR/bin/activate"
pip install -r cloud_ecs/requirements.txt
mkdir -p cloud_ecs/data

exec uvicorn cloud_ecs.app.main:app --host 0.0.0.0 --port 8000
