#!/usr/bin/env bash
set -euo pipefail

ROOT=$(git rev-parse --show-toplevel)
cd "$ROOT"

DATASTORE_PATH=${AZFIN_DATA_ROOT:-./datastore}

info() {
  printf '[INFO] %s\n' "$1"
}

error() {
  printf '[ERROR] %s\n' "$1" >&2
}

echo "Preflight checks at $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
info "Working tree: $(pwd)"

if [ ! -d "$DATASTORE_PATH" ]; then
  info "Creating datastore path at $DATASTORE_PATH"
  mkdir -p "$DATASTORE_PATH"
fi

for sub in mysql mysql/data uploads nginx-logs; do
  TARGET="$DATASTORE_PATH/$sub"
  if [ ! -d "$TARGET" ]; then
    info "Ensuring $TARGET exists"
    mkdir -p "$TARGET"
  fi
done

if ! command -v docker >/dev/null 2>&1; then
  error "docker CLI is not installed or not on PATH"
  exit 1
fi

info "Docker CLI detected: $(docker --version | head -n 1)"

if ! docker compose version >/dev/null 2>&1; then
  error "docker compose plugin is not available (required for stack deploys)"
  exit 1
fi

if ! docker network inspect edge >/dev/null 2>&1; then
  error "Docker network 'edge' is missing."
  error "Create it via 'docker network create edge' (or let Traefik/Portainer provide it) before starting the stack."
  exit 1
fi

info "Docker network 'edge' is present."
info "Preflight checks passed."
