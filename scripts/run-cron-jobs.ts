#!/usr/bin/env bun

/**
 * Cron job runner script
 * Executes scheduled jobs for notifications and other automated tasks
 */

import { cronJobRegistry } from '../src/lib/cron/registry'
import { CronJobExecutionService } from '../src/lib/cron/execution-service'
import { prisma } from '../src/lib/db'
import { CronJobResult } from '../src/lib/cron/types'
import { InputJsonValue } from '@prisma/client/runtime/library'

interface RunOptions {
  /** Specific job ID to run (if not provided, runs all jobs) */
  jobId?: string
  /** Specific organization ID to process (if not provided, processes all organizations) */
  organizationId?: string
  /** Dry run mode - don't actually create notifications */
  dryRun?: boolean
  /** Verbose output */
  verbose?: boolean
}

async function main() {
  const args = process.argv.slice(2)
  const options: RunOptions = {
    dryRun: false,
    verbose: false,
  }

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    switch (arg) {
      case '--job':
        options.jobId = args[++i]
        break
      case '--org':
        options.organizationId = args[++i]
        break
      case '--dry-run':
        options.dryRun = true
        break
      case '--verbose':
        options.verbose = true
        break
      case '--help':
        printHelp()
        process.exit(0)
        break
      default:
        console.error(`Unknown argument: ${arg}`)
        printHelp()
        process.exit(1)
    }
  }

  try {
    if (options.verbose) {
      console.log('Starting cron job execution...')
      console.log('Options:', options)
    }

    if (options.jobId) {
      await runSpecificJob(options)
    } else {
      await runAllJobs(options)
    }

    console.log('Cron job execution completed successfully')
  } catch (error) {
    console.error('Error during cron job execution:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

async function runSpecificJob(options: RunOptions) {
  const { jobId, organizationId, verbose } = options

  if (!jobId) {
    throw new Error('Job ID is required when using --job option')
  }

  const job = cronJobRegistry.getJob(jobId)
  if (!job) {
    throw new Error(`Job with ID '${jobId}' not found`)
  }

  if (verbose) {
    console.log(`Running job: ${job.name} (${job.id})`)
  }

  if (organizationId) {
    // Run for specific organization
    await runJobForOrganization(
      jobId,
      job.name,
      organizationId,
      verbose || false
    )
  } else {
    // Run for all organizations
    const organizations = await prisma.organization.findMany({
      select: { id: true, clerkOrganizationId: true },
    })

    for (const org of organizations) {
      if (verbose) {
        console.log(
          `Processing organization: ${org.clerkOrganizationId} (${org.id})`
        )
      }

      await runJobForOrganization(jobId, job.name, org.id, verbose || false)
    }
  }
}

async function runAllJobs(options: RunOptions) {
  const { organizationId, verbose } = options

  if (organizationId) {
    // Run all jobs for specific organization
    if (verbose) {
      console.log(`Running all jobs for organization: ${organizationId}`)
    }

    const jobs = cronJobRegistry.getAllJobs()
    for (const job of jobs) {
      await runJobForOrganization(
        job.id,
        job.name,
        organizationId,
        verbose || false
      )
    }
  } else {
    // Run all jobs for all organizations
    const organizations = await prisma.organization.findMany({
      select: { id: true, clerkOrganizationId: true },
    })

    for (const org of organizations) {
      if (verbose) {
        console.log(
          `Processing organization: ${org.clerkOrganizationId} (${org.id})`
        )
      }

      const jobs = cronJobRegistry.getAllJobs()
      for (const job of jobs) {
        await runJobForOrganization(job.id, job.name, org.id, verbose || false)
      }
    }
  }
}

async function runJobForOrganization(
  jobId: string,
  jobName: string,
  organizationId: string,
  verbose: boolean
) {
  const execution = await CronJobExecutionService.startExecution({
    jobId,
    jobName,
    organizationId,
  })

  try {
    const result = await cronJobRegistry.executeJob(jobId, {
      startedAt: new Date(),
      organizationId,
    })

    await CronJobExecutionService.completeExecution(
      execution.id,
      result.notificationsCreated,
      result.metadata as Record<string, InputJsonValue>
    )

    logJobResult(`${jobId}@${organizationId}`, result, verbose)
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'

    await CronJobExecutionService.failExecution(execution.id, errorMessage, {
      error: errorMessage,
    })

    logJobResult(
      `${jobId}@${organizationId}`,
      {
        success: false,
        notificationsCreated: 0,
        error: errorMessage,
      },
      verbose
    )
  }
}

function logJobResult(jobId: string, result: CronJobResult, verbose: boolean) {
  const status = result.success ? '✅' : '❌'
  const notifications = result.notificationsCreated || 0

  console.log(`${status} ${jobId}: ${notifications} notifications created`)

  if (verbose && result.metadata) {
    console.log(`  Metadata:`, result.metadata)
  }

  if (result.error) {
    console.log(`  Error: ${result.error}`)
  }
}

function printHelp() {
  console.log(`
Usage: bun scripts/run-cron-jobs.ts [options]

Options:
  --job <jobId>        Run specific job by ID
  --org <orgId>        Run for specific organization only
  --dry-run           Don't actually create notifications (not implemented yet)
  --verbose           Show detailed output
  --help              Show this help message

Examples:
  # Run all jobs for all organizations
  bun scripts/run-cron-jobs.ts

  # Run specific job for all organizations
  bun scripts/run-cron-jobs.ts --job birthday-notification

  # Run all jobs for specific organization
  bun scripts/run-cron-jobs.ts --org org123

  # Run specific job for specific organization
  bun scripts/run-cron-jobs.ts --job activity-monitoring --org org123

Available jobs:
${cronJobRegistry
  .getAllJobs()
  .map(job => `  - ${job.id}: ${job.name}`)
  .join('\n')}
`)
}

main()
