# Database Restore

This document explains how to restore the ManagerOS database from backup files.

## Overview

The database restore script (`scripts/restore-database.ts`) allows you to restore your database from backup files created by the backup script. It supports both compressed (`.sql.gz`) and uncompressed (`.sql`) backup files.

## Usage

### Basic Usage

```bash
# List available backups and restore most recent (with confirmation)
bun run db:restore

# Or directly
bun scripts/restore-database.ts
```

### Restore Specific Backup

```bash
# Restore a specific backup file
bun run db:restore --backup-file manageros-backup_2025-09-22_09-42-25.sql.gz --force

# Or directly
bun scripts/restore-database.ts --backup-file manageros-backup_2025-09-22_09-42-25.sql.gz --force
```

### Restore with Verbose Output

```bash
# Restore with detailed logging
bun run db:restore --force --verbose
```

## Options

- `--force, -f`: Force restore without confirmation prompt
- `--backup-file <file>`: Specify backup file to restore from
- `--backup-dir <dir>`: Backup directory (default: backups)
- `--verbose, -v`: Verbose output
- `--help, -h`: Show help message

## Safety Features

1. **Confirmation Required**: By default, the script requires the `--force` flag to prevent accidental data loss
2. **Backup Listing**: Shows available backup files with sizes and modification dates
3. **File Validation**: Checks if the specified backup file exists before attempting restore

## Examples

### List Available Backups

```bash
bun scripts/restore-database.ts
```

Output:

```
📁 Available backup files:
  1. manageros-backup_2025-09-22_09-42-25.sql.gz
     Size: 43.29 KB | Modified: 2025-09-22 09:42:38
  2. manageros-backup_2025-09-20_07-29-15.sql.gz
     Size: 42.56 KB | Modified: 2025-09-20 07:29:24
  3. manageros-backup_2025-09-20_07-27-22.sql.gz
     Size: 42.56 KB | Modified: 2025-09-20 07:27:32

⚠️  WARNING: This will completely replace your current database!
   To proceed, run with --force flag
```

### Restore Most Recent Backup

```bash
bun scripts/restore-database.ts --force
```

### Restore Specific Backup

```bash
bun scripts/restore-database.ts --backup-file manageros-backup_2025-09-20_07-29-15.sql.gz --force
```

### Restore with Verbose Output

```bash
bun scripts/restore-database.ts --force --verbose
```

## Prerequisites

1. **DATABASE_URL**: Must be set in your environment variables
2. **PostgreSQL Tools**: `psql` and `gunzip` must be available in your PATH
3. **Database Access**: Must have appropriate permissions to restore to the target database

## Error Handling

The script will:

- Validate the DATABASE_URL environment variable
- Check if the backup file exists
- Verify database connection before attempting restore
- Provide clear error messages if restore fails

## Related Commands

- `bun run db:backup`: Create a new database backup
- `bun run db:init`: Initialize the database schema
