#!/usr/bin/env bash
# Auto-link local shared when a consumer runs pnpm dev (predev hook).
# No-op on CI, single-repo clones, or when already linked.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=lib/common.sh
source "$SCRIPT_DIR/lib/common.sh"
init_repo_paths "$SCRIPT_DIR"

APP_DIR="$(pwd)"

if [ ! -f "$APP_DIR/package.json" ]; then
  exit 0
fi

uses_shared="$(node -e "
  try {
    const pkg = require(process.argv[1]);
    process.exit(pkg.dependencies?.['gambling-bot-shared'] ? 0 : 1);
  } catch {
    process.exit(1);
  }
" "$APP_DIR/package.json")" || exit 0

if [ ! -f "$SHARED/package.json" ]; then
  exit 0
fi

if is_app_linked_to_local "$APP_DIR" "$SHARED"; then
  exit 0
fi

link_app_to_shared "$APP_DIR"
