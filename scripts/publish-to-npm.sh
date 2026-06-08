#!/usr/bin/env bash
# Publish gambling-bot-shared to npm, then point discord + admin at the registry.
#
# Run from anywhere:
#   ./scripts/publish-to-npm.sh          (inside gambling-bot-shared)
#   ./gambling-bot-shared/scripts/publish-to-npm.sh   (from gambling_bot parent)
#
# Options:
#   --sync-only   Skip publish; sync discord/admin to the version in shared/package.json
#
# Override sibling repo paths:
#   DISCORD_REPO=/path/to/discord ADMIN_REPO=/path/to/admin ./scripts/publish-to-npm.sh
#
# Prefer: pnpm release (full pipeline) or pnpm release --no-bump
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=lib/common.sh
source "$SCRIPT_DIR/lib/common.sh"
# shellcheck source=lib/publish-common.sh
source "$SCRIPT_DIR/lib/publish-common.sh"
init_repo_paths "$SCRIPT_DIR"

SYNC_ONLY=false

for arg in "$@"; do
  case "$arg" in
    --sync-only) SYNC_ONLY=true ;;
    -h | --help)
      echo "Usage: $0 [--sync-only]"
      echo "Prefer: pnpm release or pnpm release --no-bump"
      exit 0
      ;;
    *) die "Unknown argument: $arg (try --help)" ;;
  esac
done

main() {
  [ -f "$SHARED/package.json" ] || die "Shared package not found at $SHARED"

  for dir in "$DISCORD" "$ADMIN"; do
    [ -d "$dir" ] || die "Expected repo missing: $dir (set DISCORD_REPO / ADMIN_REPO to override)"
  done

  local version
  version="$(read_version)"

  if [ "$SYNC_ONLY" = true ]; then
    info "Sync-only: using gambling-bot-shared@$version from package.json"
    sync_apps "$version"
    echo
    info "Done. discord + admin depend on ^$version."
    exit 0
  fi

  info "Building gambling-bot-shared@$version"
  (cd "$SHARED" && pnpm build)

  ensure_npm_auth

  info "Publishing gambling-bot-shared@$version to npm"
  local publish_status=0
  publish_shared || publish_status=$?

  if [ "$publish_status" -eq 2 ]; then
    warn "Version $version is already on npm — skipping publish"
  elif [ "$publish_status" -ne 0 ]; then
    exit 1
  fi

  sync_apps "$version"

  echo
  info "Done. gambling-bot-shared@$version is on npm."
  info "discord + admin now depend on ^$version (vendor/ removed, lockfiles refreshed)."
  warn "Prefer 'pnpm release' for the full pipeline. Commit updated files when ready."
}

main "$@"
