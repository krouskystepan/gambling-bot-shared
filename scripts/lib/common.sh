#!/usr/bin/env bash
# Shared helpers for local linking scripts.

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

is_admin_app() {
  [ "$(basename "$1")" = "gambling-bot-admin" ]
}

LOCAL_SHARED_MARKER=".local-shared-source"

is_app_linked_to_local() {
  local app_dir="$1"
  local shared_dir="$2"
  local admin_copy_mode="${3:-}"
  if [ "$admin_copy_mode" = "1" ]; then
    node -e "
      const fs = require('fs');
      const path = require('path');
      const app = process.argv[1];
      const shared = process.argv[2];
      const marker = process.argv[3];
      const nm = path.join(app, 'node_modules', 'gambling-bot-shared');
      try {
        const sharedReal = fs.realpathSync(shared);
        const markerPath = path.join(nm, marker);
        if (!fs.existsSync(markerPath)) process.exit(1);
        const source = fs.readFileSync(markerPath, 'utf8').trim();
        process.exit(source === sharedReal ? 0 : 1);
      } catch {
        process.exit(1);
      }
    " "$app_dir" "$shared_dir" "$LOCAL_SHARED_MARKER"
    return
  fi

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

app_uses_local_shared() {
  local app_dir="$1"
  local shared_dir="$2"
  if is_admin_app "$app_dir"; then
    is_app_linked_to_local "$app_dir" "$shared_dir" 1
  else
    is_app_linked_to_local "$app_dir" "$shared_dir"
  fi
}

sync_admin_shared_copy() {
  local app_dir="$1"
  local nm="$app_dir/node_modules/gambling-bot-shared"

  ensure_shared_built
  mkdir -p "$nm"
  rsync -a --delete "$SHARED/dist/" "$nm/dist/"
  cp "$SHARED/package.json" "$nm/package.json"
  printf '%s\n' "$SHARED" >"$nm/$LOCAL_SHARED_MARKER"
}

ensure_shared_built() {
  if [ ! -f "$SHARED/dist/index.js" ]; then
    info "Building gambling-bot-shared (dist/ missing)"
    (cd "$SHARED" && pnpm build)
  fi
}

package_json_has_link_override() {
  local app_dir="$1"
  node -e "
    const pkg = require(process.argv[1]);
    const override = pkg.pnpm?.overrides?.['gambling-bot-shared'] ?? '';
    process.exit(/link:/.test(String(override)) ? 0 : 1);
  " "$app_dir/package.json" 2>/dev/null
}

restore_link_pollution_from_git() {
  local app_dir="$1"
  local restore_files=()

  if ! git -C "$app_dir" rev-parse --git-dir >/dev/null 2>&1; then
    return 0
  fi

  if [ -f "$app_dir/pnpm-lock.yaml" ] && grep -qE 'gambling-bot-shared.*link:' "$app_dir/pnpm-lock.yaml"; then
    restore_files+=("pnpm-lock.yaml")
  fi

  if [ -f "$app_dir/pnpm-workspace.yaml" ] && grep -qE 'gambling-bot-shared:\s*link:' "$app_dir/pnpm-workspace.yaml"; then
    restore_files+=("pnpm-workspace.yaml")
  fi

  if [ -f "$app_dir/package.json" ] && package_json_has_link_override "$app_dir"; then
    restore_files+=("package.json")
  fi

  if [ "${#restore_files[@]}" -eq 0 ]; then
    return 0
  fi

  info "Restoring production-safe package files after local link"
  git -C "$app_dir" checkout HEAD -- "${restore_files[@]}"
}

link_app_to_shared() {
  local app_dir="$1"
  local app_name
  app_name="$(basename "$app_dir")"
  local nm="$app_dir/node_modules/gambling-bot-shared"

  restore_link_pollution_from_git "$app_dir"

  if app_uses_local_shared "$app_dir" "$SHARED"; then
    if is_admin_app "$app_dir"; then
      sync_admin_shared_copy "$app_dir"
      info "$app_name: synced local shared copy"
    else
      info "$app_name: already linked to local shared"
    fi
    return 0
  fi

  info "Linking $app_name → $SHARED"
  mkdir -p "$app_dir/node_modules"
  rm -rf "$nm"

  if is_admin_app "$app_dir"; then
    sync_admin_shared_copy "$app_dir"
  else
    ln -s "$SHARED" "$nm"
  fi

  if ! app_uses_local_shared "$app_dir" "$SHARED"; then
    die "Failed to link $app_name to local shared"
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
  rm -rf "$app_dir/node_modules/gambling-bot-shared"

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

  if app_uses_local_shared "$app_dir" "$SHARED"; then
    if is_admin_app "$app_dir"; then
      echo "$app_name: local copy ($SHARED)"
    else
      echo "$app_name: local ($SHARED)"
    fi
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
