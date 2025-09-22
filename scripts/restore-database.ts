#!/usr/bin/env bun

import { execSync } from 'child_process'
import { existsSync, readdirSync, statSync } from 'fs'
import { join, basename } from 'path'
import { format } from 'date-fns'

/**
 * Database restore script for ManagerOS
 * Restores database from backup files created by backup-database.ts
 */

interface RestoreOptions {
  backupFile?: string
  backupDir?: string
  verbose?: boolean
  force?: boolean
}

function parseDatabaseUrl(databaseUrl: string) {
  try {
    const url = new URL(databaseUrl)
    return {
      host: url.hostname,
      port: url.port || '5432',
      database: url.pathname.slice(1), // Remove leading slash
      username: url.username,
      password: url.password,
    }
  } catch (error) {
    throw new Error(`Invalid DATABASE_URL: ${error}`)
  }
}

function listAvailableBackups(backupDir: string) {
  if (!existsSync(backupDir)) {
    return []
  }

  const files = readdirSync(backupDir)
    .filter(file => file.endsWith('.sql.gz') || file.endsWith('.sql'))
    .map(file => {
      const filePath = join(backupDir, file)
      const stats = statSync(filePath)
      return {
        filename: file,
        path: filePath,
        size: stats.size,
        modified: stats.mtime,
        sizeFormatted: formatBytes(stats.size),
      }
    })
    .sort((a, b) => b.modified.getTime() - a.modified.getTime()) // Most recent first

  return files
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function restoreDatabase(options: RestoreOptions = {}) {
  const {
    backupFile,
    backupDir = 'backups',
    verbose = false,
    force = false,
  } = options

  // Get database URL from environment
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required')
  }

  // Parse database connection details
  const dbConfig = parseDatabaseUrl(databaseUrl)

  if (verbose) {
    console.log(`Database: ${dbConfig.database}`)
    console.log(`Host: ${dbConfig.host}:${dbConfig.port}`)
    console.log(`Username: ${dbConfig.username}`)
  }

  let selectedBackup: string

  if (backupFile) {
    // Use specified backup file
    const fullPath = backupFile.startsWith('/')
      ? backupFile
      : join(backupDir, backupFile)
    if (!existsSync(fullPath)) {
      throw new Error(`Backup file not found: ${fullPath}`)
    }
    selectedBackup = fullPath
  } else {
    // List available backups and let user choose
    const backups = listAvailableBackups(backupDir)
    if (backups.length === 0) {
      throw new Error(`No backup files found in ${backupDir}`)
    }

    console.log('\n📁 Available backup files:')
    backups.forEach((backup, index) => {
      const dateStr = format(backup.modified, 'yyyy-MM-dd HH:mm:ss')
      console.log(`  ${index + 1}. ${backup.filename}`)
      console.log(`     Size: ${backup.sizeFormatted} | Modified: ${dateStr}`)
    })

    // For now, use the most recent backup
    selectedBackup = backups[0].path
    console.log(`\n🔄 Using most recent backup: ${basename(selectedBackup)}`)
  }

  if (!force) {
    console.log(
      '\n⚠️  WARNING: This will completely replace your current database!'
    )
    console.log(`   Backup file: ${basename(selectedBackup)}`)
    console.log(`   Database: ${dbConfig.database}`)
    console.log('\n   To proceed, run with --force flag')
    console.log('   Example: bun scripts/restore-database.ts --force')
    return
  }

  try {
    if (verbose) {
      console.log(`\n🔄 Starting database restore from: ${selectedBackup}`)
    }

    // Create a temporary environment with all PostgreSQL variables
    const env = {
      ...process.env,
      PGPASSWORD: dbConfig.password,
      PGHOST: dbConfig.host,
      PGPORT: dbConfig.port,
      PGUSER: dbConfig.username,
      PGDATABASE: dbConfig.database,
    }

    if (verbose) {
      console.log('Environment variables:')
      console.log(`PGHOST=${env.PGHOST}`)
      console.log(`PGPORT=${env.PGPORT}`)
      console.log(`PGUSER=${env.PGUSER}`)
      console.log(`PGDATABASE=${env.PGDATABASE}`)
      console.log(`PGPASSWORD=${env.PGPASSWORD ? '***' : 'NOT SET'}`)
    }

    // Determine if the backup is compressed
    const isCompressed = selectedBackup.endsWith('.gz')

    let command: string
    if (isCompressed) {
      command = `gunzip -c "${selectedBackup}" | psql`
    } else {
      command = `psql < "${selectedBackup}"`
    }

    if (verbose) {
      console.log(`Executing: ${command}`)
    }

    // Execute the restore command
    execSync(command, {
      stdio: verbose ? 'inherit' : 'pipe',
      env: env,
    })

    console.log(
      `✅ Database restored successfully from: ${basename(selectedBackup)}`
    )

    // Get file size for confirmation
    const stats = statSync(selectedBackup)
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2)
    console.log(`📁 Restored from backup size: ${fileSizeMB} MB`)

    return {
      success: true,
      backupFile: selectedBackup,
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    console.error('❌ Database restore failed:', error)
    throw error
  }
}

// CLI interface
function main() {
  const args = process.argv.slice(2)
  const options: RestoreOptions = {
    verbose: args.includes('--verbose') || args.includes('-v'),
    force: args.includes('--force') || args.includes('-f'),
    backupFile: undefined,
    backupDir: 'backups',
  }

  // Parse backup file
  const backupFileIndex = args.indexOf('--backup-file')
  if (backupFileIndex !== -1 && args[backupFileIndex + 1]) {
    options.backupFile = args[backupFileIndex + 1]
  }

  // Parse backup directory
  const backupDirIndex = args.indexOf('--backup-dir')
  if (backupDirIndex !== -1 && args[backupDirIndex + 1]) {
    options.backupDir = args[backupDirIndex + 1]
  }

  // Show help
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Database Restore Script for ManagerOS

Usage:
  bun scripts/restore-database.ts [options]

Options:
  --force, -f              Force restore without confirmation prompt
  --backup-file <file>     Specify backup file to restore from
  --backup-dir <dir>       Backup directory (default: backups)
  --verbose, -v            Verbose output
  --help, -h               Show this help message

Examples:
  # List available backups and restore most recent (with confirmation)
  bun scripts/restore-database.ts

  # Restore specific backup file
  bun scripts/restore-database.ts --backup-file manageros-backup_2025-09-22_09-42-25.sql.gz --force

  # Restore with verbose output
  bun scripts/restore-database.ts --force --verbose
`)
    return
  }

  try {
    restoreDatabase(options)
  } catch (error) {
    console.error('Restore failed:', error)
    process.exit(1)
  }
}

// Run if called directly
if (import.meta.main) {
  main()
}

export { restoreDatabase }
