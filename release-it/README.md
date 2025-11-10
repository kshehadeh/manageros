# Release Management

This directory is reserved for release-it related configurations and documentation.

## Staging-Based Workflow

ManagerOS uses a staging-based development workflow with automatic version determination:

- **Commit-based versioning**: Version bumps are automatically determined by release-it based on commit messages using the Conventional Commits specification
- **Releases happen on merge to `main`**: When `staging` is merged to `main`, release-it analyzes commits since the last tag and determines the appropriate version bump
- **Conventional Commits**: Use commit message prefixes (`feat:`, `fix:`, `BREAKING CHANGE:`) to control version increments

## Automated Releases

The project uses [release-it](https://github.com/release-it/release-it) for automated release management.

### How It Works

1. **Development in Staging**:
   - Work happens in the `staging` branch
   - Use conventional commit messages (`feat:`, `fix:`, etc.) to describe changes
   - Database migrations are created and committed

2. **Automatic Releases**: When a PR from `staging` is merged to `main`, a GitHub Action automatically:
   - Analyzes commits since the last release tag
   - Determines version bump based on commit types (feat → minor, fix → patch, BREAKING CHANGE → major)
   - Bumps version in `package.json` accordingly
   - Generates Prisma client
   - Creates a git commit starting with `chore: release`
   - Creates a release tag and GitHub release
   - Generates a changelog from conventional commits

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

**Note**: The workflow automatically determines version bumps based on commit messages. No manual version bumping is required in staging.

### Version Strategy (Automatic)

Version increments are automatically determined by analyzing commit messages since the last release:

- **Major** (`BREAKING CHANGE:` or `!` in commit): Breaking changes that require a major version bump
  - Example: `feat!: remove deprecated API` or `feat: new API

BREAKING CHANGE: old API removed`

- **Minor** (`feat:`): New features that are backward compatible
  - Example: `feat: add user dashboard`

- **Patch** (`fix:` or other types): Bug fixes and other changes
  - Example: `fix: resolve date picker issue` or `chore: update dependencies`

The highest increment type found in the commits determines the version bump. For example, if you have both `feat:` and `fix:` commits, it will bump the minor version.

### Manual Version Override

If you need to manually control the version bump, you can still use:

```bash
bun run version:patch   # Force patch bump
bun run version:minor   # Force minor bump
bun run version:major  # Force major bump
```

However, with conventional commits, this is typically not necessary.

### Configuration

The release-it configuration (`.release-it.json`) uses the `@release-it/conventional-changelog` plugin to automatically determine version bumps based on commit messages. The plugin:

- Analyzes commits since the last release tag
- Follows the Conventional Commits specification (Angular preset)
- Generates a `CHANGELOG.md` file automatically
- Determines the appropriate version increment (major/minor/patch)

**Commit Message Format**: Use conventional commit prefixes in your commit messages:

- `feat:` - New features (minor version bump)
- `fix:` - Bug fixes (patch version bump)
- `BREAKING CHANGE:` or `!` - Breaking changes (major version bump)
- `chore:`, `docs:`, `style:`, `refactor:`, `perf:`, `test:` - Other changes (patch version bump)
