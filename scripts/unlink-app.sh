#!/usr/bin/env bash
# Restore the current consumer to registry gambling-bot-shared (node_modules only).
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

unlink_app_from_shared "$APP_DIR"
