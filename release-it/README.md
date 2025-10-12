# Release Management

This directory is reserved for release-it related configurations and documentation.

## Automated Releases

The project uses [release-it](https://github.com/release-it/release-it) for automated version management and releases.

### How It Works

1. **Automatic Releases**: When a PR is merged to `main`, a GitHub Action automatically:
   - Bumps the version (patch by default)
   - Updates `package.json`
   - Generates Prisma client
   - Creates a git commit and tag
   - Pushes the changes
   - Creates a GitHub release

2. **Configuration**: See `.release-it.json` in the project root for configuration

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

- Pull request merged to `main`

The workflow uses the `GITHUB_TOKEN` secret automatically provided by GitHub to:

- Create commits and tags
- Create GitHub releases

### Version Strategy

- **Patch** (default): Bug fixes and minor changes
- **Minor**: New features that are backward compatible
- **Major**: Breaking changes

### Customization

To change the default version increment, modify the `increment` field in `.release-it.json`:

```json
{
  "increment": "patch" // or "minor" or "major"
}
```
