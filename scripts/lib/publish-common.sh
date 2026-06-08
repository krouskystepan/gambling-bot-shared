#!/usr/bin/env bash
# npm publish + consumer sync helpers (sourced by publish-to-npm.sh and release.sh).

ensure_npm_auth() {
  if npm whoami >/dev/null 2>&1; then
    info "Logged in to npm as $(npm whoami)"
    return
  fi

  warn "Not logged in to npm — starting interactive login"
  npm login || die "npm login failed"

  if ! npm whoami >/dev/null 2>&1; then
    die "Still not authenticated after npm login"
  fi
  info "Logged in to npm as $(npm whoami)"
}

is_duplicate_version_error() {
  grep -qiE 'cannot publish over the previously published versions|You cannot publish over the previously published versions' <<<"$1"
}

is_auth_error() {
  grep -qiE 'ENEEDAUTH|401 Unauthorized|must be logged in|Not authorized' <<<"$1"
}

is_otp_error() {
  grep -qiE 'EOTP|one-time password|requires a one-time password' <<<"$1"
}

publish_interactive() {
  warn "npm needs interactive input (2FA OTP) — follow the prompts"
  set +e
  (cd "$SHARED" && npm publish)
  local exit_code=$?
  set -e
  return "$exit_code"
}

version_listed_on_npm() {
  local version="$1"
  npm view gambling-bot-shared versions --json 2>/dev/null \
    | node -e "
      const target = process.argv[1];
      const list = JSON.parse(require('fs').readFileSync(0, 'utf8'));
      process.exit(list.includes(target) ? 0 : 1);
    " "$version"
}

pnpm_can_install() {
  local version="$1"
  local tmp
  tmp="$(mktemp -d)"
  (
    cd "$tmp"
    echo "{\"dependencies\":{\"gambling-bot-shared\":\"^${version}\"}}" > package.json
    pnpm install --ignore-scripts --no-frozen-lockfile >/dev/null 2>&1
  )
  local status=$?
  rm -rf "$tmp"
  return "$status"
}

wait_for_registry() {
  local version="$1"
  local attempt=1
  local max_attempts=40

  info "Waiting until pnpm can install gambling-bot-shared@^$version..."
  while [ "$attempt" -le "$max_attempts" ]; do
    if version_listed_on_npm "$version" && pnpm_can_install "$version"; then
      info "Registry ready: gambling-bot-shared@$version"
      return 0
    fi

    warn "Propagation delay ($attempt/$max_attempts) — npm metadata not ready for pnpm yet"
    sleep 3
    attempt=$((attempt + 1))
  done

  die "gambling-bot-shared@$version not installable via pnpm after $((max_attempts * 3))s. Try again in a minute."
}

publish_shared() {
  local output exit_code
  set +e
  output="$(cd "$SHARED" && npm publish 2>&1)"
  exit_code=$?

  if [ "$exit_code" -eq 0 ]; then
    echo "$output"
    return 0
  fi

  if is_otp_error "$output"; then
    echo "$output" >&2
    publish_interactive
    return $?
  fi

  if is_auth_error "$output"; then
    warn "Publish failed — npm auth required"
    npm login || die "npm login failed"
    output="$(cd "$SHARED" && npm publish 2>&1)"
    exit_code=$?
    if [ "$exit_code" -eq 0 ]; then
      echo "$output"
      return 0
    fi
    if is_otp_error "$output"; then
      echo "$output" >&2
      publish_interactive
      return $?
    fi
  fi

  if is_duplicate_version_error "$output"; then
    echo "$output" >&2
    return 2
  fi

  echo "$output" >&2
  return 1
}

update_app() {
  local app_dir="$1"
  local version="$2"
  local app_name
  app_name="$(basename "$app_dir")"

  [ -f "$app_dir/package.json" ] || die "$app_name: package.json not found at $app_dir"

  info "Updating $app_name to gambling-bot-shared@^$version"

  rm -rf "$app_dir/vendor"

  node -e "
    const fs = require('fs');
    const p = '$app_dir/package.json';
    const j = JSON.parse(fs.readFileSync(p, 'utf8'));
    j.dependencies['gambling-bot-shared'] = '^$version';
    fs.writeFileSync(p, JSON.stringify(j, null, 2) + '\n');
  "

  local attempt=1
  local max_attempts=20
  while [ "$attempt" -le "$max_attempts" ]; do
    set +e
    (cd "$app_dir" && pnpm install --no-frozen-lockfile)
    local install_status=$?
    set -e

    if [ "$install_status" -eq 0 ]; then
      info "$app_name: lockfile updated"
      return 0
    fi

    warn "$app_name: pnpm install failed ($attempt/$max_attempts), retrying in 5s..."
    sleep 5
    attempt=$((attempt + 1))
  done

  die "$app_name: pnpm install failed for gambling-bot-shared@^$version"
}

sync_apps() {
  local version="$1"
  wait_for_registry "$version"
  info "Updating discord and admin"
  update_app "$DISCORD" "$version"
  update_app "$ADMIN" "$version"
}
