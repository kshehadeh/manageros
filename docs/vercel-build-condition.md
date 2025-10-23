# Vercel Build Condition Script

This script controls when Vercel builds and deploys your application based on branch and commit message conditions.

## How it works

The script will build/deploy if either of these conditions are met:

1. **Not the main branch** - Any branch other than `main` (e.g., PR branches, feature branches)
2. **Main branch with release commit** - Only if the commit message starts with `chore: release`

## Usage

The script is automatically used by Vercel through the `vercel.json` configuration:

```json
{
  "buildCommand": "./vercel-build-condition.sh && bun run build"
}
```

## Environment Variables

The script uses these Vercel environment variables:

- `VERCEL_GIT_COMMIT_REF` - The branch name
- `VERCEL_GIT_COMMIT_MESSAGE` - The commit message

If these aren't available (e.g., during local testing), it falls back to git commands.

## Examples

### ✅ Will build/deploy

- Branch: `feature/new-feature` (any non-main branch)
- Branch: `main`, Commit: `chore: release v1.2.3`
- Branch: `main`, Commit: `chore: release`

### ❌ Will NOT build/deploy

- Branch: `main`, Commit: `fix: bug in user auth`
- Branch: `main`, Commit: `feat: add new dashboard`
- Branch: `main`, Commit: `docs: update README`

## Testing locally

You can test the script locally:

```bash
# Test with a non-main branch
VERCEL_GIT_COMMIT_REF=feature/test ./vercel-build-condition.sh

# Test with main branch and release commit
VERCEL_GIT_COMMIT_REF=main VERCEL_GIT_COMMIT_MESSAGE="chore: release v1.0.0" ./vercel-build-condition.sh

# Test with main branch and non-release commit
VERCEL_GIT_COMMIT_REF=main VERCEL_GIT_COMMIT_MESSAGE="fix: bug" ./vercel-build-condition.sh
```

## Exit codes

- `0` - Build should proceed
- `1` - Build should be skipped
