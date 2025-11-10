# Staging Workflow and Database Migration Management

## Overview

ManagerOS uses a staging-based development workflow where all development work happens in the `staging` branch. This workflow ensures that version increments and database migrations are properly managed before being deployed to production.

## Development Workflow

### Branch Strategy

- **`staging`**: Primary development branch where all feature work happens
- **`main`**: Production branch that receives merges from `staging`
- **Feature branches**: Optional, can be created from `staging` for larger features

### Development Process

1. **Create Feature Branch** (optional):

   ```bash
   git checkout staging
   git pull origin staging
   git checkout -b feature/my-feature
   ```

2. **Make Changes**: Implement your feature, including any necessary database schema changes

3. **Create Database Migrations**:

   ```bash
   # After modifying prisma/schema.prisma
   bunx prisma migrate dev --name descriptive_migration_name
   ```

   This will:
   - Create a new migration file in `prisma/migrations/`
   - Apply the migration to your local dev database
   - Update the Prisma client

4. **Version Bump** (when adding features):

   ```bash
   # Bump version as you add features
   bun run version:patch   # For bug fixes and minor changes
   bun run version:minor   # For new features
   bun run version:major   # For breaking changes
   ```

   **Note**: Version bumps happen during development in staging, not during release.

5. **Commit and Push**:

   ```bash
   git add .
   git commit -m "feat: add new feature"
   git push origin feature/my-feature  # or staging if working directly
   ```

6. **Merge to Staging**: Create a PR to merge your feature branch into `staging`, or push directly to `staging` if working there.

## Version Management

### Version Bumping in Staging

Versions are incremented during development in the `staging` branch, not during the release process. This allows you to track version changes as features are added.

**When to bump versions:**

- **Patch** (`bun run version:patch`): Bug fixes, minor improvements
- **Minor** (`bun run version:minor`): New features, backward-compatible changes
- **Major** (`bun run version:major`): Breaking changes, major refactors

**Example workflow:**

```bash
# Working on a new feature
git checkout staging
# ... make changes ...
bun run version:minor  # Bump version for new feature
git add .
git commit -m "feat: add user dashboard (v1.2.0)"
git push origin staging
```

### Version in Production

When `staging` is merged to `main`, the version is already incremented. The release workflow will create a release tag and GitHub release, but the version bump has already happened in staging.

## Database Migrations

### Creating Migrations

All database migrations are created in the `staging` branch using Prisma's migration system:

```bash
# 1. Modify prisma/schema.prisma with your changes
# 2. Create and apply migration
bunx prisma migrate dev --name add_user_preferences

# This creates:
# - prisma/migrations/YYYYMMDDHHMMSS_add_user_preferences/migration.sql
# - Updates your local dev database
```

### Migration Files

- All migration files are committed to version control in `prisma/migrations/`
- Migration files are included in both staging and production builds
- Migrations are applied in order based on their timestamp

### Staging/Dev Database

- **Environment**: Staging uses the development database
- **Configuration**: Set via `DATABASE_URL` environment variable in staging environment
- **Migrations**: Applied during development using `prisma migrate dev`

### Production Database

- **Environment**: Production uses the production database
- **Configuration**: Set via `DATABASE_URL` environment variable in production environment
- **Migrations**: Automatically applied during Vercel build using `prisma migrate deploy`

## Production Deployment

### Automatic Migration Application

When code is deployed to production (via Vercel), the build process automatically:

1. Generates Prisma client: `bunx prisma generate`
2. Applies pending migrations: `bunx prisma migrate deploy`
3. Builds the application: `next build --turbo`

**Important**: `prisma migrate deploy` is production-safe:

- Only applies migrations that haven't been applied yet
- Safe to run multiple times
- Designed specifically for production environments
- Will not create new migrations or modify existing ones

### Deployment Flow

```
┌─────────────────────────────────────────────────────────┐
│ 1. Development in staging branch                       │
│    - Create migrations with prisma migrate dev         │
│    - Bump version as features are added                │
│    - Commit migration files and code                   │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ 2. Merge staging → main                                 │
│    - Migration files included in merge                 │
│    - Version already bumped in staging                  │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ 3. GitHub Action triggers release                       │
│    - Creates release tag                                 │
│    - Creates GitHub release                             │
│    - Pushes to main with "chore: release" commit        │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ 4. Vercel builds production                             │
│    - bunx prisma generate                                │
│    - bunx prisma migrate deploy (applies migrations)    │
│    - next build --turbo                                  │
└─────────────────────────────────────────────────────────┘
```

## Best Practices

### Migration Best Practices

1. **Always create migrations in staging**: Never create migrations directly in production
2. **Test migrations locally**: Ensure migrations work correctly in your dev environment
3. **Review migration files**: Check the generated SQL in `prisma/migrations/` before committing
4. **Descriptive names**: Use clear, descriptive names for migrations
5. **One feature per migration**: Keep migrations focused on a single change when possible

### Version Bumping Best Practices

1. **Bump as you develop**: Increment version when adding features, not just at release time
2. **Use appropriate increment**: Choose patch/minor/major based on the type of change
3. **Commit version with feature**: Include version bump in the same commit as the feature
4. **Document breaking changes**: If using major version, document what breaks

### Workflow Best Practices

1. **Keep staging up to date**: Regularly sync with main to avoid conflicts
2. **Test before merging**: Ensure all migrations work and tests pass before merging to main
3. **Monitor production builds**: Watch Vercel build logs to ensure migrations apply successfully
4. **Backup before major migrations**: Consider backing up production database before large schema changes

## Troubleshooting

### Migration Issues

**Problem**: Migration fails during production build

**Solution**:

- Check Vercel build logs for specific error
- Verify migration SQL is correct
- Ensure database connection is properly configured
- Test migration locally first

**Problem**: Migration already applied error

**Solution**: This is normal - `prisma migrate deploy` will skip already-applied migrations. No action needed.

### Version Conflicts

**Problem**: Version already bumped when merging to main

**Solution**: This is expected behavior. The release workflow will handle the already-bumped version correctly.

## Environment Configuration

### Staging Environment

- **Database**: Development database (configured in Vercel staging environment)
- **Clerk**: Development Clerk instance
- **Purpose**: Testing and development

### Production Environment

- **Database**: Production database (configured in Vercel production environment)
- **Clerk**: Production Clerk instance
- **Purpose**: Live application

Both environments use the same codebase and migration files, but connect to different databases configured via environment variables.
