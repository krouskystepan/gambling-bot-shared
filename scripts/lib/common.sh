#!/usr/bin/env bash
# Shared helpers for local linking and release scripts.

RED=$'\033[0;31m'
GREEN=$'\033[0;32m'
YELLOW=$'\033[1;33m'
NC=$'\033[0m'

info() { echo "${GREEN}→${NC} $*"; }
warn() { echo "${YELLOW}!${NC} $*"; }
die() { echo "${RED}✗${NC} $*" >&2; exit 1; }

init_repo_paths() {
  local script_dir="$1"
  SHARED="$(cd "$script_dir/.." && pwd)"
  PARENT="$(cd "$SHARED/.." && pwd)"
  DISCORD="${DISCORD_REPO:-$PARENT/gambling-bot-discord}"
  ADMIN="${ADMIN_REPO:-$PARENT/gambling-bot-admin}"
}

read_version() {
  node -p "require('$SHARED/package.json').version"
}

is_app_linked_to_local() {
  local app_dir="$1"
  local shared_dir="$2"
  node -e "
    const fs = require('fs');
    const path = require('path');
    const app = process.argv[1];
    const shared = process.argv[2];
    const nm = path.join(app, 'node_modules', 'gambling-bot-shared');
    try {
      const resolved = fs.realpathSync(nm);
      const sharedReal = fs.realpathSync(shared);
      process.exit(resolved === sharedReal ? 0 : 1);
    } catch {
      process.exit(1);
    }
  " "$app_dir" "$shared_dir"
}

ensure_shared_built() {
  if [ ! -f "$SHARED/dist/index.js" ]; then
    info "Building gambling-bot-shared (dist/ missing)"
    (cd "$SHARED" && pnpm build)
  fi
}

link_app_to_shared() {
  local app_dir="$1"
  local app_name
  app_name="$(basename "$app_dir")"

  if is_app_linked_to_local "$app_dir" "$SHARED"; then
    info "$app_name: already linked to local shared"
    return 0
  fi

  ensure_shared_built
  info "Linking $app_name → $SHARED"
  (cd "$app_dir" && CI=true pnpm link "$SHARED")
}

restore_link_pollution_from_git() {
  local app_dir="$1"

  if ! git -C "$app_dir" rev-parse --git-dir >/dev/null 2>&1; then
    return 0
  fi

  if [ -f "$app_dir/pnpm-lock.yaml" ] && grep -qE 'gambling-bot-shared.*link:' "$app_dir/pnpm-lock.yaml"; then
    git -C "$app_dir" checkout HEAD -- pnpm-lock.yaml
  fi

  if [ -f "$app_dir/pnpm-workspace.yaml" ] && grep -qE 'gambling-bot-shared:\s*link:' "$app_dir/pnpm-workspace.yaml"; then
    git -C "$app_dir" checkout HEAD -- pnpm-workspace.yaml
  fi
}

unlink_app_from_shared() {
  local app_dir="$1"
  local app_name
  app_name="$(basename "$app_dir")"

  if ! [ -d "$app_dir/node_modules" ]; then
    warn "$app_name: node_modules missing — skipping unlink"
    return 0
  fi

  info "Unlinking $app_name from local shared"
  set +e
  (cd "$app_dir" && CI=true pnpm unlink gambling-bot-shared)
  set -e

  restore_link_pollution_from_git "$app_dir"

  set +e
  (cd "$app_dir" && CI=true pnpm install --frozen-lockfile)
  local install_status=$?
  set -e

  if [ "$install_status" -ne 0 ]; then
    warn "$app_name: frozen install failed — retrying with lockfile refresh"
    (cd "$app_dir" && CI=true pnpm install --no-frozen-lockfile)
  fi

  info "$app_name: restored registry version"
}

report_app_link_status() {
  local app_dir="$1"
  local app_name
  app_name="$(basename "$app_dir")"

  if [ ! -d "$app_dir" ]; then
    echo "$app_name: repo not found at $app_dir"
    return
  fi

  if [ ! -d "$app_dir/node_modules/gambling-bot-shared" ]; then
    echo "$app_name: not installed"
    return
  fi

  if is_app_linked_to_local "$app_dir" "$SHARED"; then
    echo "$app_name: local ($SHARED)"
  else
    local resolved
    resolved="$(node -e "
      const fs = require('fs');
      const path = require('path');
      try {
        console.log(fs.realpathSync(path.join(process.argv[1], 'node_modules', 'gambling-bot-shared')));
      } catch {
        console.log('unknown');
      }
    " "$app_dir")"
    echo "$app_name: registry ($resolved)"
  fi
}
