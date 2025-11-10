# Release Management

This directory is reserved for release-it related configurations and documentation.

## Staging-Based Workflow

ManagerOS uses a staging-based development workflow where:

- **Version bumps happen in `staging`**: Versions are incremented during development using `bun run version:patch/minor/major`
- **Releases happen on merge to `main`**: When `staging` is merged to `main`, the version is already bumped
- **Release workflow creates tags**: The GitHub Action creates release tags and GitHub releases, but doesn't bump versions (they're already bumped in staging)

## Automated Releases

The project uses [release-it](https://github.com/release-it/release-it) for automated release management.

### How It Works

1. **Development in Staging**:
   - Work happens in the `staging` branch
   - Versions are bumped during development as features are added
   - Database migrations are created and committed

2. **Automatic Releases**: When a PR from `staging` is merged to `main`, a GitHub Action automatically:
   - Creates a release tag (version is already set from staging)
   - Generates Prisma client
   - Creates a git commit starting with `chore: release`
   - Pushes the changes
   - Creates a GitHub release

3. **Production Deployment**:
   - Vercel builds production when it sees the `chore: release` commit
   - During build, `prisma migrate deploy` automatically applies pending migrations
   - Application is deployed with the new version and schema changes

4. **Configuration**: See `.release-it.json` in the project root for configuration

### Manual Releases

You can also create releases manually:

```bash
# Create a patch release (0.3.0 -> 0.3.1)
bun run release

# For specific version types, you can use the version scripts:
bun run version:patch  # 0.3.0 -> 0.3.1
bun run version:minor  # 0.3.0 -> 0.4.0
bun run version:major  # 0.3.0 -> 1.0.0
```

### GitHub Action Workflow

The release workflow (`.github/workflows/release.yml`) triggers on:

- Pull request merged to `main` (typically from `staging`)

The workflow uses the `GITHUB_TOKEN` secret automatically provided by GitHub to:

- Create commits and tags
- Create GitHub releases

**Note**: The workflow does not bump versions - versions are already bumped in the `staging` branch during development. The workflow creates the release tag and GitHub release for the version that's already in `package.json`.

### Version Strategy

Versions are bumped during development in the `staging` branch:

- **Patch** (`bun run version:patch`): Bug fixes and minor changes
- **Minor** (`bun run version:minor`): New features that are backward compatible
- **Major** (`bun run version:major`): Breaking changes

The release workflow uses the version that's already in `package.json` from staging, so choose the appropriate increment type when bumping in staging.

### Configuration

The release-it configuration (`.release-it.json`) is set with `"increment": false` to use the version that's already in `package.json` from the staging branch, rather than auto-bumping. This aligns with the staging-based workflow where versions are bumped during development.

**Note**: If you need to manually create a release with a version bump (e.g., for hotfixes), you can temporarily modify the `increment` field or use the version scripts before running the release command.
