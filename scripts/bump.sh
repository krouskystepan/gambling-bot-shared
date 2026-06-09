#!/usr/bin/env bash
# Bump version in package.json. npm publish runs automatically on merge to main (GitHub Actions).
#
# Usage:
#   pnpm bump              # patch (default)
#   pnpm bump minor
#   pnpm bump major
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=lib/common.sh
source "$SCRIPT_DIR/lib/common.sh"
init_repo_paths "$SCRIPT_DIR"

BUMP=patch

for arg in "$@"; do
  case "$arg" in
    patch | minor | major) BUMP="$arg" ;;
    -h | --help)
      echo "Usage: $0 [patch|minor|major]"
      echo
      echo "Bumps package.json only. Commit and merge to main to publish via CI."
      exit 0
      ;;
    *) die "Unknown argument: $arg (try --help)" ;;
  esac
done

[ -f "$SHARED/package.json" ] || die "Shared package not found at $SHARED"

info "Bumping version ($BUMP)"
(cd "$SHARED" && npm version "$BUMP" --no-git-tag-version)

version="$(read_version)"
commit_msg="chore: release gambling-bot-shared@$version"

echo
info "Bumped to gambling-bot-shared@$version"
echo
info "Commit and merge to main — CI will publish to npm:"
echo "  git add package.json && git commit -m \"$commit_msg\""
