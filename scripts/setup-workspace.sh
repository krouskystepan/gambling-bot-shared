#!/usr/bin/env bash
# Bootstrap the full gambling-bot workspace (shared + discord + admin).
#
# Run from GitHub (creates repos in the current directory):
#   cd ~/my-workspace && curl -fsSL https://raw.githubusercontent.com/krouskystepan/gambling-bot-shared/main/scripts/setup-workspace.sh | bash
#
# Custom directory:
#   curl -fsSL .../setup-workspace.sh | bash -s -- ~/Code/gambling_bot
#   WORKSPACE_DIR=~/Code/gambling_bot bash scripts/setup-workspace.sh
#
# When already inside a checkout:
#   bash scripts/setup-workspace.sh
set -euo pipefail

GITHUB_OWNER="${GITHUB_OWNER:-krouskystepan}"
GITHUB_BRANCH="${GITHUB_BRANCH:-main}"

SHARED_NAME="gambling-bot-shared"
DISCORD_NAME="gambling-bot-discord"
ADMIN_NAME="gambling-bot-admin"

RED=$'\033[0;31m'
GREEN=$'\033[0;32m'
YELLOW=$'\033[1;33m'
NC=$'\033[0m'

info() { echo "${GREEN}→${NC} $*"; }
warn() { echo "${YELLOW}!${NC} $*" >&2; }
die() { echo "${RED}✗${NC} $*" >&2; exit 1; }

script_is_checkout() {
  [ -n "${BASH_SOURCE[0]:-}" ] \
    && [ "${BASH_SOURCE[0]}" != "bash" ] \
    && [ "${BASH_SOURCE[0]}" != "-" ] \
    && [ -f "${BASH_SOURCE[0]}" ]
}

require_command() {
  local cmd="$1"
  command -v "$cmd" >/dev/null 2>&1 || die "Missing required command: $cmd"
}

ensure_pnpm() {
  if command -v pnpm >/dev/null 2>&1; then
    return 0
  fi

  if command -v corepack >/dev/null 2>&1; then
    info "Enabling pnpm via corepack"
    corepack enable
    return 0
  fi

  die "pnpm not found. Install Node.js 22+ and run: corepack enable"
}

clone_or_update() {
  local name="$1"
  local url="$2"
  local dir="$3"

  if [ -d "$dir/.git" ]; then
    info "Updating $name"
    if ! git -C "$dir" pull --ff-only origin "$GITHUB_BRANCH"; then
      warn "$name: could not fast-forward — leaving existing checkout as-is"
    fi
    return 0
  fi

  if [ -e "$dir" ]; then
    die "$dir exists but is not a git repository"
  fi

  info "Cloning $name"
  git clone --branch "$GITHUB_BRANCH" --depth 1 "$url" "$dir"
}

install_repo() {
  local dir="$1"
  local name
  name="$(basename "$dir")"

  info "Installing dependencies in $name"
  if ! (cd "$dir" && CI=true pnpm install --frozen-lockfile); then
    warn "$name: frozen install failed — refreshing lockfile"
    (cd "$dir" && CI=true pnpm install --no-frozen-lockfile)
  fi
}

seed_env_files() {
  if [ -f "$DISCORD/.env.example" ] && [ ! -f "$DISCORD/.env" ]; then
    cp "$DISCORD/.env.example" "$DISCORD/.env"
    info "Created $DISCORD/.env from .env.example"
  fi

  if [ ! -f "$ADMIN/.env" ]; then
    cat >"$ADMIN/.env" <<'EOF'
MONGO_URI=
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
DISCORD_BOT_TOKEN=
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
EOF
    info "Created $ADMIN/.env template — fill in values before running admin"
  fi
}

print_next_steps() {
  cat <<EOF

${GREEN}Workspace ready at:${NC} $WORKSPACE

Next steps:
  1. Fill in env files:
     - $DISCORD/.env
     - $ADMIN/.env
  2. Start shared watch (when editing shared code):
     cd "$SHARED" && pnpm dev
  3. Start the bot:
     cd "$DISCORD" && pnpm dev
  4. Start the admin panel:
     cd "$ADMIN" && pnpm dev

Docs: $SHARED/docs/LOCAL_DEVELOPMENT.md
EOF
}

# --- curl / pipe bootstrap: clone shared, then re-exec from checkout ---
if ! script_is_checkout; then
  WORKSPACE="${1:-${WORKSPACE_DIR:-$(pwd)}}"
  SHARED="$WORKSPACE/$SHARED_NAME"

  mkdir -p "$WORKSPACE"

  if [ ! -f "$SHARED/scripts/setup-workspace.sh" ]; then
    clone_or_update "$SHARED_NAME" \
      "https://github.com/${GITHUB_OWNER}/${SHARED_NAME}.git" \
      "$SHARED"
  fi

  exec bash "$SHARED/scripts/setup-workspace.sh" "$WORKSPACE"
fi

# --- running from a shared checkout ---
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
source "$SCRIPT_DIR/lib/common.sh"

WORKSPACE="${1:-${WORKSPACE_DIR:-$(cd "$SCRIPT_DIR/../.." && pwd)}}"
SHARED="$WORKSPACE/$SHARED_NAME"
DISCORD="$WORKSPACE/$DISCORD_NAME"
ADMIN="$WORKSPACE/$ADMIN_NAME"

require_command git
require_command node
ensure_pnpm

node_major="$(node -p "process.versions.node.split('.')[0]")"
if [ "$node_major" -lt 20 ]; then
  warn "Node.js 22+ is recommended (found $(node -v))"
fi

mkdir -p "$WORKSPACE"

clone_or_update "$SHARED_NAME" \
  "https://github.com/${GITHUB_OWNER}/${SHARED_NAME}.git" \
  "$SHARED"
clone_or_update "$DISCORD_NAME" \
  "https://github.com/${GITHUB_OWNER}/${DISCORD_NAME}.git" \
  "$DISCORD"
clone_or_update "$ADMIN_NAME" \
  "https://github.com/${GITHUB_OWNER}/${ADMIN_NAME}.git" \
  "$ADMIN"

install_repo "$SHARED"
install_repo "$DISCORD"
install_repo "$ADMIN"

info "Building gambling-bot-shared"
(cd "$SHARED" && pnpm build)

info "Linking local shared into discord and admin"
bash "$SHARED/scripts/link-local.sh"

seed_env_files
print_next_steps
