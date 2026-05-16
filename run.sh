#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-dev}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="${ROOT_DIR}/frontend"

if [[ ! -d "${ROOT_DIR}/frontend" || ! -d "${ROOT_DIR}/api" ]]; then
  echo "Missing required folders: frontend/, api/"
  exit 1
fi

if [[ ! -f "${ROOT_DIR}/package.json" ]]; then
  echo "Missing ${ROOT_DIR}/package.json"
  exit 1
fi

load_env_files() {
  local mode="$1"
  source_if_exists() {
    local file="$1"
    if [[ -f "${file}" ]]; then
      source "${file}"
    fi
  }

  set -a
  if [[ "${mode}" == "dev" ]]; then
    source_if_exists "${ROOT_DIR}/frontend/.env.local"
    source_if_exists "${ROOT_DIR}/api/.env.local"
  else
    # Prod env files are optional for local preview; fall back to .env.local when missing.
    if [[ -f "${ROOT_DIR}/frontend/.env.prod" ]]; then source "${ROOT_DIR}/frontend/.env.prod"; else source_if_exists "${ROOT_DIR}/frontend/.env.local"; fi
    if [[ -f "${ROOT_DIR}/api/.env.prod" ]]; then source "${ROOT_DIR}/api/.env.prod"; else source_if_exists "${ROOT_DIR}/api/.env.local"; fi
  fi
  set +a
}

ensure_auth_secret() {
  local mode="$1"
  if [[ -n "${AUTH_SECRET:-}" ]]; then
    return
  fi

  if [[ "${mode}" == "dev" ]]; then
    export AUTH_SECRET="local-dev-auth-secret-change-me"
    echo "AUTH_SECRET was not set. Using local dev fallback."
    return
  fi

  echo "AUTH_SECRET is required for prod mode."
  exit 1
}

run_dev() {
  echo "Running dev (single origin: frontend + api)"
  load_env_files dev
  ensure_auth_secret dev
  node "${ROOT_DIR}/scripts/init-local-db.js"
  node "${ROOT_DIR}/scripts/set-runtime.mjs" nodejs >/dev/null
  cd "${FRONTEND_DIR}"
  exec npx next dev -p 3000 -H 127.0.0.1
}

run_prod() {
  echo "Running prod preview (single origin: frontend + api)"
  load_env_files prod
  ensure_auth_secret prod
  node "${ROOT_DIR}/scripts/set-runtime.mjs" nodejs >/dev/null
  cd "${FRONTEND_DIR}"
  npx next build
  exec npx next start -p 3000 -H 127.0.0.1
}

case "${MODE}" in
  dev)
    run_dev
    ;;
  prod)
    run_prod
    ;;
  *)
    echo "Usage: bash run.sh <dev|prod>"
    exit 1
    ;;
esac
