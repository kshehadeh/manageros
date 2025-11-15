#!/usr/bin/env bun

import { execSync } from 'child_process'

/**
 * Database migration deployment script for ManagerOS
 * Runs `prisma migrate deploy` to apply pending migrations to a configured database
 * This is typically used in production environments to update the database schema
 */

interface DeployOptions {
  verbose?: boolean
  skipGenerators?: boolean
}

function deployMigrations(options: DeployOptions = {}) {
  const { verbose = false, skipGenerators = false } = options

  // Get database URL from environment
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required')
  }

  try {
    if (verbose) {
      console.log('🔄 Starting migration deployment...')
      console.log('   This will apply all pending migrations to the database')
    }

    // Build prisma migrate deploy command
    const commandParts = ['bunx', 'prisma', 'migrate', 'deploy']

    if (skipGenerators) {
      commandParts.push('--skip-generate')
    }

    const command = commandParts.join(' ')

    if (verbose) {
      console.log(`Executing: ${command}`)
    }

    // Execute the migration command
    execSync(command, {
      stdio: verbose ? 'inherit' : 'pipe',
      env: process.env,
    })

    console.log('✅ Migrations deployed successfully')

    return {
      success: true,
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    console.error('❌ Migration deployment failed:', error)
    throw error
  }
}

// CLI interface
function main() {
  const args = process.argv.slice(2)
  const options: DeployOptions = {
    verbose: args.includes('--verbose') || args.includes('-v'),
    skipGenerators: args.includes('--skip-generate'),
  }

  // Show help
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Database Migration Deployment Script for ManagerOS

Usage:
  bun scripts/deploy-migrations.ts [options]

Description:
  Applies pending Prisma migrations to the configured database.
  This command is safe to run multiple times and is typically used
  in production environments to update the database schema.

Options:
  --verbose, -v            Verbose output
  --skip-generate          Skip generating Prisma Client after migration
  --help, -h               Show this help message

Examples:
  # Deploy migrations with default settings
  bun scripts/deploy-migrations.ts

  # Deploy migrations with verbose output
  bun scripts/deploy-migrations.ts --verbose

  # Deploy migrations without generating Prisma Client
  bun scripts/deploy-migrations.ts --skip-generate

Environment Variables:
  DATABASE_URL            Required. Database connection string
`)
    return
  }

  try {
    deployMigrations(options)
  } catch (error) {
    console.error('Migration deployment failed:', error)
    process.exit(1)
  }
}

// Run if called directly
if (import.meta.main) {
  main()
}

export { deployMigrations }
