import { NextRequest, NextResponse } from 'next/server'
import { cronJobRegistry } from '@/lib/cron/registry'
import { CronJobExecutionService } from '@/lib/cron/execution-service'
import { prisma } from '@/lib/db'
import type { Prisma } from '@/generated/prisma'

type InputJsonValue = Prisma.InputJsonValue

/**
 * Vercel Cron Job API Route for Notification Runner
 *
 * This endpoint is triggered by Vercel cron jobs to run notification
 * generation tasks. It supports running all jobs or specific jobs
 * based on query parameters.
 *
 * Security: Requires CRON_SECRET environment variable for authentication
 *
 * Usage:
 * - GET /api/cron/notifications - Run all notification jobs
 * - GET /api/cron/notifications?job=birthday-notification - Run specific job
 * - GET /api/cron/notifications?org=org123 - Run for specific organization
 */

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const authHeader = searchParams.get('authorization')

  try {
    // Verify cron secret for security

    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret) {
      console.error('CRON_SECRET environment variable not set')
      return NextResponse.json(
        { error: 'Cron secret not configured' },
        { status: 500 }
      )
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.error('Invalid cron secret provided')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse query parameters
    const jobId = searchParams.get('job')
    const organizationId = searchParams.get('org')
    const verbose = searchParams.get('verbose') === 'true'

    console.log('Starting cron job execution via API', {
      jobId: jobId || 'all',
      organizationId: organizationId || 'all',
      timestamp: new Date().toISOString(),
    })

    const results: Array<{
      jobId: string
      jobName: string
      organizationId: string
      success: boolean
      notificationsCreated: number
      error?: string
    }> = []

    if (jobId) {
      // Run specific job
      const job = cronJobRegistry.getJob(jobId)
      if (!job) {
        return NextResponse.json(
          { error: `Job with ID '${jobId}' not found` },
          { status: 400 }
        )
      }

      if (organizationId) {
        // Run for specific organization
        const result = await runJobForOrganization(
          jobId,
          job.name,
          organizationId,
          verbose
        )
        results.push(result)
      } else {
        // Run for all organizations
        const organizations = await prisma.organization.findMany({
          select: { id: true, clerkOrganizationId: true },
        })

        for (const org of organizations) {
          const result = await runJobForOrganization(
            jobId,
            job.name,
            org.id,
            verbose
          )
          results.push(result)
        }
      }
    } else {
      // Run all jobs
      const organizations = organizationId
        ? [{ id: organizationId, name: 'Specific Organization' }]
        : await prisma.organization.findMany({
            select: { id: true, clerkOrganizationId: true },
          })

      const jobs = cronJobRegistry.getAllJobs()

      for (const org of organizations) {
        for (const job of jobs) {
          const result = await runJobForOrganization(
            job.id,
            job.name,
            org.id,
            verbose
          )
          results.push(result)
        }
      }
    }

    // Calculate summary statistics
    const totalNotifications = results.reduce(
      (sum, result) => sum + result.notificationsCreated,
      0
    )
    const successfulJobs = results.filter(result => result.success).length
    const failedJobs = results.filter(result => !result.success).length

    const summary = {
      totalJobs: results.length,
      successfulJobs,
      failedJobs,
      totalNotifications,
      results,
    }

    console.log('Cron job execution completed', summary)

    return NextResponse.json({
      success: true,
      message: 'Cron jobs executed successfully',
      summary,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error during cron job execution:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

/**
 * Execute a specific job for a specific organization
 */
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

    if (verbose) {
      console.log(
        `✅ ${jobId}@${organizationId}: ${result.notificationsCreated} notifications created`
      )
      if (result.metadata) {
        console.log(`  Metadata:`, result.metadata)
      }
    }

    return {
      jobId,
      jobName,
      organizationId,
      success: true,
      notificationsCreated: result.notificationsCreated,
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'

    await CronJobExecutionService.failExecution(execution.id, errorMessage, {
      error: errorMessage,
    })

    if (verbose) {
      console.log(`❌ ${jobId}@${organizationId}: ${errorMessage}`)
    }

    return {
      jobId,
      jobName,
      organizationId,
      success: false,
      notificationsCreated: 0,
      error: errorMessage,
    }
  }
}
