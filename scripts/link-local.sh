#!/usr/bin/env bash
# Link local gambling-bot-shared into discord + admin (node_modules only).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=lib/common.sh
source "$SCRIPT_DIR/lib/common.sh"
init_repo_paths "$SCRIPT_DIR"

[ -f "$SHARED/package.json" ] || die "Shared package not found at $SHARED"

for dir in "$DISCORD" "$ADMIN"; do
  [ -d "$dir" ] || die "Expected repo missing: $dir (set DISCORD_REPO / ADMIN_REPO to override)"
done

info "Building gambling-bot-shared"
(cd "$SHARED" && pnpm build)

for dir in "$DISCORD" "$ADMIN"; do
  link_app_to_shared "$dir"
done

echo
info "Linked. Run 'pnpm dev' in shared for watch rebuilds."
bash "$SCRIPT_DIR/shared-link-status.sh"
