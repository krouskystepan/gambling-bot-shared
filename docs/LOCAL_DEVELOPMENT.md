# Local development

The three repos are expected as siblings in the same parent folder:

```
gambling_bot/
├── gambling-bot-shared/
├── gambling-bot-discord/
└── gambling-bot-admin/
```

## Daily workflow (no manual link/unlink)

1. When editing shared code, run `pnpm dev` in this repo (TypeScript watch → `dist/`).
2. Run `pnpm dev` in discord and/or admin as usual — a `predev` hook auto-links local shared when the sibling repo exists.
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

```bash
pnpm release              # patch bump + publish
pnpm release minor        # minor bump
pnpm release --no-bump    # publish current version without bumping
```

The release script (shared repo only):

1. Builds `dist/`
2. Bumps version in `package.json` (unless `--no-bump`)
3. Publishes to npm
4. Prints a suggested `git commit` for this repo

It does not touch discord or admin. Uncommitted files in other repos are fine.

## Sync consumers after release

When you are ready to point discord and admin at the new npm version:

```bash
pnpm publish-and-bump-projects   # publish (if needed) + sync discord/admin lockfiles
# or, if already on npm:
bash scripts/publish-to-npm.sh --sync-only
```
