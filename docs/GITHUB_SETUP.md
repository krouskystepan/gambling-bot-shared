# GitHub setup

This covers how to enforce quality checks before code reaches `main`. The checks themselves live in each repo’s `.github/workflows/ci.yml`. **Blocking broken merges is configured on GitHub**, not in git alone.

## How it works

1. Open a pull request targeting `main`.
2. GitHub Actions runs the **Checks** workflow.
3. Branch protection on `main` refuses to merge until **Checks** is green.
4. Optional: block direct pushes to `main` so every change goes through a PR.

Local git cannot enforce this for the remote. Your machine can still commit to a local `main` branch; GitHub stops bad code from landing on `origin/main`.

## CI workflows (per repo)

| Repository | Workflow file | What runs on PRs to `main` |
| --- | --- | --- |
| `gambling-bot-discord` | `.github/workflows/ci.yml` | Coverage, format, lint, types, build, tests |
| `gambling-bot-admin` | `.github/workflows/ci.yml` | Format, lint, types, build |
| `gambling-bot-shared` | `.github/workflows/ci.yml` | Format, lint, types, build |

The required status check name on GitHub is **`Checks`** (the job name in each workflow).

Admin’s build step needs placeholder env vars in CI because NextAuth config is evaluated at build time and there is no committed `.env`. Those values are dummy strings used only on the runner.

## One-time GitHub setup (each repo)

Repeat for **discord**, **admin**, and **shared**:

### 1. Merge CI first

Merge (or push) a branch that contains `.github/workflows/ci.yml` so the workflow exists on `main`. Until it has run at least once on a PR, **Checks** may not appear in the branch protection UI.

### 2. Add branch protection for `main`

On GitHub: **Repository → Settings → Branches → Add branch protection rule** (or **Rules → Rulesets** if you use the newer rulesets UI).

Recommended settings:

| Setting | Value |
| --- | --- |
| Branch name pattern | `main` |
| Require a pull request before merging | On |
| Require approvals | Off (solo) or 1+ (team) |
| Require status checks to pass before merging | On |
| Required status check | **`Checks`** |
| Require branches to be up to date before merging | On |
| Do not allow bypassing the above settings | On (recommended) |

To stop direct pushes to `main` (force everything through PRs):

- Classic rules: enable **Restrict who can push to matching branches** and leave the list empty (or only allow a deploy bot if you have one).
- Rulesets: enable **Block force pushes** and restrict push access so normal development uses feature branches + PRs.

### 3. Verify

1. Push a branch with a deliberate lint/format failure.
2. Open a PR to `main`.
3. Confirm **Checks** fails and the **Merge** button stays blocked.
4. Fix the branch; confirm **Checks** passes and merge is allowed.

## Local checks before pushing

Run the same commands locally to avoid waiting on CI:

| Repository | Command |
| --- | --- |
| `gambling-bot-discord` | `pnpm check` (format, lint, types, tests) |
| `gambling-bot-admin` | `pnpm check` (format, lint, types) |
| `gambling-bot-shared` | `pnpm check` (format, lint, types) |

## Optional: configure via GitHub CLI

If you use [`gh`](https://cli.github.com/), you can apply classic branch protection after **`Checks`** has run once on a PR:

```bash
OWNER=krouskystepan
REPO=gambling-bot-discord   # repeat for gambling-bot-admin and gambling-bot-shared

gh api \
  --method PUT \
  "/repos/${OWNER}/${REPO}/branches/main/protection" \
  -H "Accept: application/vnd.github+json" \
  -f required_status_checks='{"strict":true,"contexts":["Checks"]}' \
  -f enforce_admins=true \
  -f required_pull_request_reviews='null' \
  -f restrictions='null'
```

Adjust `required_pull_request_reviews` if you want required approvals. Restrictions can limit who may push directly to `main`.

## Repositories

- https://github.com/krouskystepan/gambling-bot-discord
- https://github.com/krouskystepan/gambling-bot-admin
- https://github.com/krouskystepan/gambling-bot-shared
