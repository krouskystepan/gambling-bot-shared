#!/usr/bin/env bash
# Report whether consumers use local shared or the npm registry.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=lib/common.sh
source "$SCRIPT_DIR/lib/common.sh"
init_repo_paths "$SCRIPT_DIR"

info "gambling-bot-shared link status:"
report_app_link_status "$DISCORD"
report_app_link_status "$ADMIN"
