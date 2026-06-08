#!/usr/bin/env bash
# Restore discord + admin to registry gambling-bot-shared from lockfile.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=lib/common.sh
source "$SCRIPT_DIR/lib/common.sh"
init_repo_paths "$SCRIPT_DIR"

for dir in "$DISCORD" "$ADMIN"; do
  if [ -d "$dir" ]; then
    unlink_app_from_shared "$dir"
  else
    warn "Skipping missing repo: $dir"
  fi
done

echo
info "Consumers restored to registry versions."
bash "$SCRIPT_DIR/shared-link-status.sh"
