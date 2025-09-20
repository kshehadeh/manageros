# Database Backup

ManagerOS includes a comprehensive database backup system that allows you to create timestamped backups of your PostgreSQL database.

## Quick Start

### Basic Backup

```bash
bun run db:backup
```

### Verbose Backup (shows detailed output)

```bash
bun run db:backup:verbose
```

## Features

- **Automatic Timestamping**: Each backup includes a timestamp in the filename
- **Compression**: Backups are compressed by default using gzip
- **Clean Output**: Includes `--clean` and `--if-exists` flags for clean restores
- **Create Database**: Includes `--create` flag to recreate the database
- **Verbose Logging**: Optional detailed output for troubleshooting

## Backup Location

All backups are stored in the `backups/` directory with the following naming convention:

```
manageros-backup_YYYY-MM-DD_HH-mm-ss.sql.gz
```

Example: `manageros-backup_2024-01-15_14-30-25.sql.gz`

## Advanced Usage

### Custom Output Directory

```bash
tsx scripts/backup-database.ts --output-dir /path/to/custom/backups
```

### Custom Filename

```bash
tsx scripts/backup-database.ts --filename my-custom-backup
```

### Disable Compression

```bash
tsx scripts/backup-database.ts --no-compress
```

### Verbose Output

```bash
tsx scripts/backup-database.ts --verbose
```

## Environment Requirements

The backup script requires the following environment variables:

- `DATABASE_URL`: PostgreSQL connection string

### Examples

**Local PostgreSQL:**

```bash
DATABASE_URL="postgresql://username:password@localhost:5432/manageros"
```

**Supabase:**

```bash
DATABASE_URL="postgresql://postgres:[password]@aws-1-us-east-2.pooler.supabase.com:6543/postgres"
```

**Note:** The script automatically detects Supabase connections and handles authentication appropriately.

## Restoring from Backup

To restore from a backup:

1. **Uncompress the backup** (if compressed):

   ```bash
   gunzip manageros-backup_2024-01-15_14-30-25.sql.gz
   ```

2. **Restore the database**:

   ```bash
   psql -U username -h localhost -d manageros < manageros-backup_2024-01-15_14-30-25.sql
   ```

   Or create a new database and restore:

   ```bash
   createdb -U username new_manageros_db
   psql -U username -h localhost -d new_manageros_db < manageros-backup_2024-01-15_14-30-25.sql
   ```

## Automated Backups

### Cron Job Example

To set up automated daily backups at 2 AM:

```bash
# Edit crontab
crontab -e

# Add this line (adjust path as needed)
0 2 * * * cd /path/to/manageros && bun run db:backup
```

### GitHub Actions Example

```yaml
name: Database Backup
on:
  schedule:
    - cron: '0 2 * * *' # Daily at 2 AM UTC
  workflow_dispatch: # Manual trigger

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      - name: Setup PostgreSQL
        run: |
          sudo apt-get update
          sudo apt-get install -y postgresql-client
      - name: Create Backup
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: bun run db:backup
      - name: Upload Backup
        uses: actions/upload-artifact@v3
        with:
          name: database-backup-${{ github.run_number }}
          path: backups/
```

## Backup Contents

The backup includes:

- Complete database schema
- All data from all tables
- Database creation commands
- Clean drop commands (for safe restoration)
- Proper foreign key constraints

## Security Notes

- Backup files contain sensitive data and should be stored securely
- The `backups/` directory is gitignored to prevent accidental commits
- Consider encrypting backups for additional security
- Regularly test backup restoration procedures

## Troubleshooting

### Common Issues

1. **Permission Denied**: Ensure the user has access to the database
2. **Connection Failed**: Verify DATABASE_URL is correct
3. **Disk Space**: Ensure sufficient disk space for backups
4. **PostgreSQL Client**: Ensure `pg_dump` is installed
5. **Supabase Authentication**: If using Supabase, ensure your DATABASE_URL includes the correct password and uses the pooler URL

### Debug Mode

Use verbose mode to see detailed output:

```bash
bun run db:backup:verbose
```

This will show:

- Database connection details
- Backup progress
- File size information
- Any error messages
