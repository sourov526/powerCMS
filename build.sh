#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-dev}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [[ ! -f "${ROOT_DIR}/package.json" ]]; then
  echo "Missing ${ROOT_DIR}/package.json"
  exit 1
fi

load_env_files() {
  local mode="$1"
  set -a

  # Scope env files (no root env usage)
  if [[ "${mode}" == "dev" ]]; then
    source "${ROOT_DIR}/frontend/.env.local"
    source "${ROOT_DIR}/api/.env.local"
  else
    source "${ROOT_DIR}/frontend/.env.prod"
    source "${ROOT_DIR}/api/.env.prod"
  fi

  set +a
}

case "${MODE}" in
  dev)
    echo "Building (frontend) in dev mode..."
    load_env_files "dev"
    (cd "${ROOT_DIR}" && npm run build)
    ;;
  prod)
    echo "Building (frontend) in prod mode..."
    load_env_files "prod"
    (cd "${ROOT_DIR}" && npm run build)
    ;;
  *)
    echo "Usage: bash build.sh <dev|prod>"
    exit 1
    ;;
esac
