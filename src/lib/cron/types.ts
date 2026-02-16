/**
 * Types for the extensible cron job system
 */

import type { Prisma } from '@/generated/prisma'

type InputJsonValue = Prisma.InputJsonValue

export interface CronJobConfig {
  /** Unique identifier for the job */
  id: string
  /** Human-readable name */
  name: string
  /** Description of what the job does */
  description: string
  /** Cron expression for scheduling */
  schedule: string
  /** Whether the job is enabled */
  enabled: boolean
  /** Job-specific configuration */
  config?: Record<string, unknown>
}

export interface CronJobResult {
  /** Whether the job executed successfully */
  success: boolean
  /** Number of notifications created */
  notificationsCreated: number
  /** Any error message if execution failed */
  error?: string
  /** Additional metadata about the execution */
  metadata?: Record<string, InputJsonValue>
}

export interface CronJobExecutionContext {
  /** The job configuration */
  config: CronJobConfig
  /** When the job started executing */
  startedAt: Date
  /** Organization ID to process (if applicable) */
  organizationId?: string
}

export abstract class CronJob {
  abstract readonly id: string
  abstract readonly name: string
  abstract readonly description: string
  abstract readonly schedule: string

  /**
   * Execute the cron job
   * @param context Execution context
   * @returns Result of the job execution
   */
  abstract execute(_context: CronJobExecutionContext): Promise<CronJobResult>

  /**
   * Validate the job configuration
   * @param config Job configuration
   * @returns Whether the configuration is valid
   */
  abstract validateConfig(_config: Record<string, unknown>): boolean

  /**
   * Get default configuration for this job
   * @returns Default configuration
   */
  abstract getDefaultConfig(): Record<string, unknown>
}
