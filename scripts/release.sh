#!/usr/bin/env bash
# Release gambling-bot-shared to npm (shared repo only).
#
# Usage:
#   pnpm release              # patch bump (default)
#   pnpm release minor
#   pnpm release major
#   pnpm release --no-bump    # publish current version
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=lib/common.sh
source "$SCRIPT_DIR/lib/common.sh"
# shellcheck source=lib/publish-common.sh
source "$SCRIPT_DIR/lib/publish-common.sh"
init_repo_paths "$SCRIPT_DIR"

BUMP=patch
NO_BUMP=false

for arg in "$@"; do
  case "$arg" in
    --no-bump) NO_BUMP=true ;;
    patch | minor | major) BUMP="$arg" ;;
    -h | --help)
      echo "Usage: $0 [patch|minor|major] [--no-bump]"
      exit 0
      ;;
    *) die "Unknown argument: $arg (try --help)" ;;
  esac
done

[ -f "$SHARED/package.json" ] || die "Shared package not found at $SHARED"

info "Pre-flight: building gambling-bot-shared"
(cd "$SHARED" && pnpm build)

ensure_npm_auth

if [ "$NO_BUMP" = false ]; then
  info "Bumping version ($BUMP)"
  (cd "$SHARED" && npm version "$BUMP" --no-git-tag-version)
else
  info "Skipping version bump (--no-bump)"
fi

version="$(read_version)"
info "Releasing gambling-bot-shared@$version"

info "Publishing gambling-bot-shared@$version to npm"
publish_status=0
publish_shared || publish_status=$?

if [ "$publish_status" -eq 2 ]; then
  warn "Version $version is already on npm — skipping publish"
elif [ "$publish_status" -ne 0 ]; then
  exit 1
fi

commit_msg="chore: release gambling-bot-shared@$version"

echo
info "Release complete: gambling-bot-shared@$version"
echo
info "Commit the version bump in this repo when ready:"
echo "  git add package.json && git commit -m \"$commit_msg\""
echo
info "To update discord + admin separately: pnpm publish-and-bump-projects"
