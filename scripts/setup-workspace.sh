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
SETUP_UPDATE="${SETUP_UPDATE:-}"

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
log_step() { echo "${GREEN}→${NC} [$1] $2"; }
log_skip() { echo "${YELLOW}⊙${NC} SKIP: $*"; }
log_done() { echo "${GREEN}✓${NC} $*"; }

if [ -f "${BASH_SOURCE[0]:-}" ] && [ "${BASH_SOURCE[0]}" != "bash" ] && [ "${BASH_SOURCE[0]}" != "-" ]; then
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  WORKSPACE="${1:-${WORKSPACE_DIR:-$(cd "$SCRIPT_DIR/../.." && pwd)}}"
else
  SCRIPT_DIR=""
  WORKSPACE="${1:-${WORKSPACE_DIR:-$(pwd)}}"
fi

WORKSPACE="$(cd "$WORKSPACE" && pwd)"
WORKSPACE="$(node -e "console.log(require('fs').realpathSync(process.argv[1]))" "$WORKSPACE")"
SHARED="$WORKSPACE/$SHARED_NAME"
DISCORD="$WORKSPACE/$DISCORD_NAME"
ADMIN="$WORKSPACE/$ADMIN_NAME"

SUMMARY_CLONED=()
SUMMARY_UPDATED=()
SUMMARY_SKIPPED=()
SUMMARY_CREATED=()

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

clone_or_setup_repo() {
  local name="$1"
  local url="$2"
  local dir="$3"

  if [ ! -d "$dir" ]; then
    info "Cloning $name"
    git clone --branch "$GITHUB_BRANCH" --depth 1 "$url" "$dir"
    log_done "$name: cloned"
    SUMMARY_CLONED+=("$name")
    return 0
  fi

  if [ ! -d "$dir/.git" ]; then
    die "$dir exists but is not a git repository"
  fi

  local should_update=""
  if [ -n "$SETUP_UPDATE" ]; then
    case "$SETUP_UPDATE" in
      yes | y | Y) should_update="yes" ;;
      no | n | N) should_update="no" ;;
      *) die "Invalid SETUP_UPDATE=$SETUP_UPDATE (use yes or no)" ;;
    esac
  elif [ -t 0 ]; then
    echo ""
    echo "$name already exists at $dir"
    read -r -p "Update to latest origin/$GITHUB_BRANCH? [y/N] " reply
    case "$reply" in
      y | Y | yes | Yes) should_update="yes" ;;
      *) should_update="no" ;;
    esac
  else
    should_update="no"
  fi

  if [ "$should_update" = "yes" ]; then
    info "Updating $name"
    if git -C "$dir" fetch origin "$GITHUB_BRANCH" \
      && git -C "$dir" pull --ff-only origin "$GITHUB_BRANCH"; then
      log_done "$name: updated"
      SUMMARY_UPDATED+=("$name")
    else
      warn "$name: could not fast-forward - leaving existing checkout as-is"
    fi
  else
    log_skip "$name: using existing checkout"
    SUMMARY_SKIPPED+=("$name (checkout)")
  fi
}

install_repo_if_needed() {
  local dir="$1"
  local name
  name="$(basename "$dir")"

  if [ -d "$dir/node_modules" ] \
    && (cd "$dir" && CI=true pnpm install --frozen-lockfile --prefer-offline >/dev/null 2>&1); then
    log_skip "$name: dependencies up to date"
    SUMMARY_SKIPPED+=("$name (deps)")
    return 0
  fi

  info "Installing dependencies in $name"
  if ! (cd "$dir" && CI=true pnpm install --frozen-lockfile); then
    warn "$name: frozen install failed - refreshing lockfile"
    (cd "$dir" && CI=true pnpm install --no-frozen-lockfile)
  fi
  log_done "$name: dependencies installed"
}

seed_env_files() {
  if [ -f "$DISCORD/.env" ]; then
    log_skip "$DISCORD/.env already exists"
  elif [ -f "$DISCORD/.env.example" ]; then
    cp "$DISCORD/.env.example" "$DISCORD/.env"
    log_done "Created $DISCORD/.env from .env.example"
    SUMMARY_CREATED+=("gambling-bot-discord/.env")
  fi

  if [ -f "$ADMIN/.env" ]; then
    log_skip "$ADMIN/.env already exists"
  else
    cat >"$ADMIN/.env" <<'EOF'
MONGO_URI=
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
DISCORD_BOT_TOKEN=
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
EOF
    log_done "Created $ADMIN/.env template - fill in values before running admin"
    SUMMARY_CREATED+=("gambling-bot-admin/.env")
  fi
}

link_consumer_if_needed() {
  local app_dir="$1"
  local app_name
  app_name="$(basename "$app_dir")"

  if app_uses_local_shared "$app_dir" "$SHARED"; then
    if is_admin_app "$app_dir"; then
      sync_admin_shared_copy "$app_dir"
      log_skip "$app_name: already linked (synced copy)"
    else
      log_skip "$app_name: already linked"
    fi
    SUMMARY_SKIPPED+=("$app_name (link)")
    return 0
  fi

  link_app_to_shared "$app_dir"
  log_done "$app_name: linked to local shared"
}

summary_line() {
  local label="$1"
  shift

  if [ "$#" -eq 0 ]; then
    echo "  $label: (none)"
  else
    echo "  $label:  $*"
  fi
}

print_summary() {
  echo ""
  echo "Summary"
  summary_line "cloned" ${SUMMARY_CLONED[@]+"${SUMMARY_CLONED[@]}"}
  summary_line "updated" ${SUMMARY_UPDATED[@]+"${SUMMARY_UPDATED[@]}"}
  summary_line "skipped" ${SUMMARY_SKIPPED[@]+"${SUMMARY_SKIPPED[@]}"}
  summary_line "created" ${SUMMARY_CREATED[@]+"${SUMMARY_CREATED[@]}"}
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

log_step "1/6" "Checking prerequisites"
require_command git
require_command node
ensure_pnpm

node_major="$(node -p "process.versions.node.split('.')[0]")"
if [ "$node_major" -lt 20 ]; then
  warn "Node.js 22+ is recommended (found $(node -v))"
fi

mkdir -p "$WORKSPACE"

log_step "2/6" "Fetching repositories"
clone_or_setup_repo "$SHARED_NAME" \
  "https://github.com/${GITHUB_OWNER}/${SHARED_NAME}.git" \
  "$SHARED"
clone_or_setup_repo "$DISCORD_NAME" \
  "https://github.com/${GITHUB_OWNER}/${DISCORD_NAME}.git" \
  "$DISCORD"
clone_or_setup_repo "$ADMIN_NAME" \
  "https://github.com/${GITHUB_OWNER}/${ADMIN_NAME}.git" \
  "$ADMIN"

log_step "3/6" "Installing dependencies"
install_repo_if_needed "$SHARED"
install_repo_if_needed "$DISCORD"
install_repo_if_needed "$ADMIN"

log_step "4/6" "Building gambling-bot-shared"
COMMON_SH="$SHARED/scripts/lib/common.sh"
if [ -n "$SCRIPT_DIR" ] && [ -f "$SCRIPT_DIR/lib/common.sh" ]; then
  COMMON_SH="$SCRIPT_DIR/lib/common.sh"
fi
# shellcheck source=lib/common.sh
source "$COMMON_SH"
ensure_shared_built

log_step "5/6" "Linking local shared into discord and admin"
link_consumer_if_needed "$DISCORD"
link_consumer_if_needed "$ADMIN"

log_step "6/6" "Seeding environment files"
seed_env_files

print_summary
print_next_steps
