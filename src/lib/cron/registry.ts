/**
 * Cron job registry for managing and executing scheduled jobs
 */

import {
  CronJob,
  CronJobConfig,
  CronJobResult,
  CronJobExecutionContext,
} from './types'
import { BirthdayNotificationJob } from './jobs/birthday-notification-job'
import { ActivityMonitoringJob } from './jobs/activity-monitoring-job'
import { OverdueTasksNotificationJob } from './jobs/overdue-tasks-notification-job'
import { ToleranceRulesEvaluationJob } from './jobs/tolerance-rules-evaluation-job'

export class CronJobRegistry {
  private jobs: Map<string, CronJob> = new Map()

  constructor() {
    this.registerDefaultJobs()
  }

  /**
   * Register a cron job
   */
  register(job: CronJob): void {
    this.jobs.set(job.id, job)
  }

  /**
   * Get a registered job by ID
   */
  getJob(id: string): CronJob | undefined {
    return this.jobs.get(id)
  }

  /**
   * Get all registered jobs
   */
  getAllJobs(): CronJob[] {
    return Array.from(this.jobs.values())
  }

  /**
   * Get job configurations for all registered jobs
   */
  getAllJobConfigs(): CronJobConfig[] {
    return this.getAllJobs().map(job => ({
      id: job.id,
      name: job.name,
      description: job.description,
      schedule: job.schedule,
      enabled: true,
      config: job.getDefaultConfig(),
    }))
  }

  /**
   * Execute a specific job
   */
  async executeJob(
    jobId: string,
    context: Omit<CronJobExecutionContext, 'config'>
  ): Promise<CronJobResult> {
    const job = this.getJob(jobId)
    if (!job) {
      throw new Error(`Job with ID '${jobId}' not found`)
    }

    const config: CronJobConfig = {
      id: job.id,
      name: job.name,
      description: job.description,
      schedule: job.schedule,
      enabled: true,
      config: job.getDefaultConfig(),
    }

    const executionContext: CronJobExecutionContext = {
      ...context,
      config,
    }

    return await job.execute(executionContext)
  }

  /**
   * Execute all enabled jobs for a specific organization
   */
  async executeAllJobs(
    organizationId: string
  ): Promise<Map<string, CronJobResult>> {
    const results = new Map<string, CronJobResult>()
    const jobs = this.getAllJobs()

    for (const job of jobs) {
      try {
        const result = await this.executeJob(job.id, {
          startedAt: new Date(),
          organizationId,
        })
        results.set(job.id, result)
      } catch (error) {
        results.set(job.id, {
          success: false,
          notificationsCreated: 0,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    return results
  }

  /**
   * Register default jobs
   */
  private registerDefaultJobs(): void {
    this.register(new BirthdayNotificationJob())
    this.register(new ActivityMonitoringJob())
    this.register(new OverdueTasksNotificationJob())
    this.register(new ToleranceRulesEvaluationJob())
  }
}

// Singleton instance
export const cronJobRegistry = new CronJobRegistry()
