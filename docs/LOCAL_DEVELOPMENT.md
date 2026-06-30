# Local development

## Bootstrap the whole workspace

From GitHub (clones all three repos as siblings, installs deps, builds shared, links consumers):

```bash
curl -fsSL https://raw.githubusercontent.com/krouskystepan/gambling-bot-shared/main/scripts/setup-workspace.sh | bash
```

Run from the folder where you want the three repos as siblings (defaults to the current directory):

```bash
cd ~/Code/gambling_bot
curl -fsSL https://raw.githubusercontent.com/krouskystepan/gambling-bot-shared/main/scripts/setup-workspace.sh | bash
```

Custom directory:

```bash
curl -fsSL https://raw.githubusercontent.com/krouskystepan/gambling-bot-shared/main/scripts/setup-workspace.sh | bash -s -- ~/Code/gambling_bot
```

When you already have `gambling-bot-shared` checked out:

```bash
pnpm setup-workspace
# or: bash scripts/setup-workspace.sh ~/Code/gambling_bot
```

Defaults: current directory, branch `main`, owner `krouskystepan`. Override with `WORKSPACE_DIR`, `GITHUB_BRANCH`, or `GITHUB_OWNER`.

## Layout

The three repos are expected as siblings in the same parent folder:

```
gambling_bot/
├── gambling-bot-shared/
├── gambling-bot-discord/
└── gambling-bot-admin/
```

## Daily workflow (no manual link/unlink)

1. When editing shared code, run `pnpm dev` in this repo (TypeScript watch → `dist/`).
2. Run `pnpm dev` in discord and/or admin as usual - a `predev` hook auto-links local shared when the sibling repo exists.
3. Commit changes in any repo normally. Linking only affects `node_modules`, not `package.json` or lockfiles.

If `pnpm install` replaces the symlink, the next `pnpm dev` re-links automatically.

Consumer repos set `excludeLinksFromLockfile: true` in `pnpm-workspace.yaml` so `pnpm link` does not write `link:` entries into lockfiles.

## Debugging

```bash
pnpm link-status          # show whether consumers use local or registry
pnpm link-local           # link both consumers explicitly
pnpm unlink-local         # restore registry versions in both consumers
```

In a single consumer repo:

```bash
pnpm shared:status
pnpm shared:link
pnpm shared:unlink
```

## Release shared to npm

Publishing is automatic when a version bump merges to `main` (see `.github/workflows/release.yml`).

1. Bump the version locally:

```bash
pnpm bump              # patch (default)
pnpm bump minor
pnpm bump major
```

2. Commit `package.json`, open a PR, and merge to `main`.
3. GitHub Actions runs checks, builds, and publishes to npm if that version is not on the registry yet.

Requires an `NPM_TOKEN` repository secret (npm automation token).

After CI publishes, bump `gambling-bot-shared` in discord and admin in separate PRs when you are ready to consume the new version.
