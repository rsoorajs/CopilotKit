#!/usr/bin/env bash
# Shared variables and helper functions for the showcase CLI.
# Sourced by bin/showcase — not meant to be executed directly.

# ── Paths ────────────────────────────────────────────────────────────────────

SHOWCASE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
COMPOSE_FILE="$SHOWCASE_ROOT/docker-compose.local.yml"
COMPOSE_CMD="docker compose -f $COMPOSE_FILE"
ENV_FILE="$SHOWCASE_ROOT/.env"
PORTS_FILE="$SHOWCASE_ROOT/shared/local-ports.json"
AIMOCK_COMPOSE="$SHOWCASE_ROOT/tests/docker-compose.integrations.yml"

# ── Output helpers ───────────────────────────────────────────────────────────

die() {
  printf '\033[1;31m✗ %s\033[0m\n' "$1" >&2
  exit 1
}

info() {
  printf '\033[0;36m▸ %s\033[0m\n' "$1"
}

warn() {
  printf '\033[1;33m⚠ %s\033[0m\n' "$1" >&2
}

success() {
  printf '\033[0;32m✓ %s\033[0m\n' "$1"
}

# ── Validation helpers ───────────────────────────────────────────────────────

need_slug() {
  [ -n "${1:-}" ] || die "slug required"
}

require_env() {
  [ -f "$ENV_FILE" ] || die "Missing $ENV_FILE. Copy showcase/.env.example to showcase/.env and fill in keys."
}

# ── Docker / Compose helpers ─────────────────────────────────────────────────

stage_shared() {
  # Dereference tools/ and shared-tools/ symlinks into real copies so Docker
  # COPY can follow them (Docker build contexts can't traverse symlinks that
  # point outside the context).
  for pkg_dir in "$SHOWCASE_ROOT"/integrations/*/; do
    for link_name in tools shared-tools; do
      local link_path="$pkg_dir/$link_name"
      if [ -L "$link_path" ]; then
        local target
        target="$(readlink "$link_path")"
        # Resolve relative symlink targets against the link's directory
        if [[ "$target" != /* ]]; then
          target="$(cd "$(dirname "$link_path")" && cd "$(dirname "$target")" && pwd)/$(basename "$target")"
        fi
        if [ -d "$target" ]; then
          rm "$link_path"
          rsync -a "$target/" "$link_path/"
        fi
      fi
    done
  done
}

restore_symlinks() {
  # Restore tools/ and shared-tools/ symlinks replaced by stage_shared.
  (cd "$SHOWCASE_ROOT" && git checkout -- integrations/*/tools integrations/*/shared-tools 2>/dev/null || true)
}

slug_to_container() {
  echo "showcase-${1}"
}

slug_to_port() {
  local slug="${1:?slug required}"
  if command -v jq &>/dev/null; then
    jq -r --arg s "$slug" '.[$s] // empty' "$PORTS_FILE"
  else
    # Fallback: simple grep/sed if jq is not available
    grep "\"$slug\"" "$PORTS_FILE" | sed 's/[^0-9]//g'
  fi
}

is_service_healthy() {
  local slug="${1:?slug required}"
  local container
  container="$(slug_to_container "$slug")"
  local health
  health="$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "missing")"
  [ "$health" = "healthy" ]
}

wait_healthy() {
  local slug="${1:?slug required}"
  local timeout="${2:-30}"
  local elapsed=0
  info "Waiting for $slug to become healthy (timeout ${timeout}s)..."
  while ! is_service_healthy "$slug"; do
    if [ "$elapsed" -ge "$timeout" ]; then
      die "$slug did not become healthy within ${timeout}s"
    fi
    sleep 2
    elapsed=$((elapsed + 2))
  done
  success "$slug is healthy (${elapsed}s)"
}
