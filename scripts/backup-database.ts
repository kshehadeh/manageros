#!/usr/bin/env bun

import { execSync } from 'child_process'
import { existsSync, mkdirSync } from 'fs'
import { statSync } from 'fs'
import { join } from 'path'
import { format } from 'date-fns'

/**
 * Database backup script for ManagerOS
 * Creates data-only backups of the public schema (table contents without schema)
 * Handles Supabase connections properly
 */

interface BackupOptions {
  outputDir?: string
  filename?: string
  compress?: boolean
  verbose?: boolean
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

function createBackup(options: BackupOptions = {}) {
  const {
    outputDir = 'backups',
    filename,
    compress = true,
    verbose = false,
  } = options

  // Get database URL from environment
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required')
  }

  // Parse database connection details
  const dbConfig = parseDatabaseUrl(databaseUrl)

  // Create backups directory if it doesn't exist
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true })
    if (verbose) {
      console.log(`Created backup directory: ${outputDir}`)
    }
  }

  // Generate filename with timestamp
  const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss')
  const baseFilename = filename || `manageros-backup_${timestamp}`
  const extension = compress ? 'sql.gz' : 'sql'
  const fullFilename = `${baseFilename}.${extension}`

  const outputPath = join(outputDir, fullFilename)

  try {
    if (verbose) {
      console.log(`Starting data-only backup of public schema...`)
      console.log(`Database: ${dbConfig.database}`)
      console.log(`Host: ${dbConfig.host}:${dbConfig.port}`)
      console.log(`Username: ${dbConfig.username}`)
      console.log(`Output: ${outputPath}`)
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

    // Build pg_dump command (data-only, public schema only)
    const pgDumpCommand = [
      'pg_dump',
      '--verbose',
      '--data-only',
      '--schema=public',
      '--format=plain',
    ].join(' ')

    // Execute pg_dump with compression if requested
    if (compress) {
      const command = `${pgDumpCommand} | gzip > "${outputPath}"`
      if (verbose) {
        console.log(`Executing: ${command}`)
      }
      execSync(command, {
        stdio: verbose ? 'inherit' : 'pipe',
        env: env,
      })
    } else {
      const command = `${pgDumpCommand} > "${outputPath}"`
      if (verbose) {
        console.log(`Executing: ${command}`)
      }
      execSync(command, {
        stdio: verbose ? 'inherit' : 'pipe',
        env: env,
      })
    }

    console.log(`✅ Database backup created successfully: ${outputPath}`)

    // Get file size for confirmation
    const stats = statSync(outputPath)
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2)
    console.log(`📁 Backup size: ${fileSizeMB} MB`)

    return {
      success: true,
      filePath: outputPath,
      filename: fullFilename,
      size: stats.size,
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    console.error('❌ Database backup failed:', error)
    throw error
  }
}

// CLI interface
function main() {
  const args = process.argv.slice(2)
  const options: BackupOptions = {
    verbose: args.includes('--verbose') || args.includes('-v'),
    compress: !args.includes('--no-compress'),
    outputDir: undefined,
    filename: undefined,
  }

  // Parse custom output directory
  const outputDirIndex = args.indexOf('--output-dir')
  if (outputDirIndex !== -1 && args[outputDirIndex + 1]) {
    options.outputDir = args[outputDirIndex + 1]
  }

  // Parse custom filename
  const filenameIndex = args.indexOf('--filename')
  if (filenameIndex !== -1 && args[filenameIndex + 1]) {
    options.filename = args[filenameIndex + 1]
  }

  try {
    createBackup(options)
  } catch (error) {
    console.error('Backup failed:', error)
    process.exit(1)
  }
}

// Run if called directly
if (import.meta.main) {
  main()
}

export { createBackup }
