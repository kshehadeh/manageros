# Release Workflow Process

## How Version Updates Flow Back to Main

### The Complete Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Developer merges PR to main                                  │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. GitHub Action triggers (release.yml)                         │
│    - Checks out main branch                                      │
│    - Installs dependencies with Bun                              │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. release-it executes                                           │
│    a. Reads current version from package.json (e.g., "0.3.0")   │
│    b. Bumps version based on increment type (e.g., "0.3.1")     │
│    c. Writes new version to package.json                         │
│    d. Runs hook: bunx prisma generate                            │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. Git operations (automated by release-it)                      │
│    a. git add package.json                                       │
│    b. git commit -m "chore: release v0.3.1"                      │
│    c. git tag v0.3.1                                             │
│    d. git push origin main --follow-tags                         │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. GitHub repository state AFTER workflow                        │
│    - main branch now has commit with updated package.json        │
│    - New tag v0.3.1 exists                                       │
│    - GitHub Release created with release notes                   │
└─────────────────────────────────────────────────────────────────┘
```

## Key Points

### Version Update Mechanism

1. **Direct Commit to Main**: The workflow commits the updated `package.json` directly to the `main` branch (not via PR)
2. **Automatic Merge**: No merge is needed - it's a new commit pushed on top of the current main
3. **Version Persistence**: The new version in `package.json` is now part of the repository history

### Example Timeline

```
Before PR Merge:
main: [commit A] ← package.json shows "0.3.0"

After PR Merge:
main: [commit A] → [commit B (your PR)]

After Release Workflow:
main: [commit A] → [commit B] → [commit C "chore: release v0.3.1"]
                                          ↑
                                    package.json now shows "0.3.1"
                                    tagged as "v0.3.1"
```

### No Infinite Loop

The workflow is safe from infinite loops because:

- It only triggers on `pull_request` events with type `closed`
- When release-it pushes the version commit, it's a **direct push** (not a PR)
- Therefore, the workflow doesn't trigger itself
- Extra safety: We also check that the PR title doesn't contain "chore: release"

### Authentication

The workflow uses `GITHUB_TOKEN` which:

- Is automatically provided by GitHub Actions
- Has write permissions (specified in the workflow)
- Can commit and push to the repository
- Can create releases

## Verification

After the workflow runs, you can verify:

1. **Check the commit history**:

   ```bash
   git log --oneline
   # You should see: "chore: release v0.3.1"
   ```

2. **Check the tags**:

   ```bash
   git tag
   # You should see: v0.3.1
   ```

3. **Check package.json**:

   ```bash
   cat package.json | grep version
   # Should show: "version": "0.3.1"
   ```

4. **Check GitHub Releases**:
   - Go to your repo → Releases
   - You should see a new release "Release v0.3.1"
