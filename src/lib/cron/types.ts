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

export interface NotificationData {
  /** Title of the notification */
  title: string
  /** Message content */
  message: string
  /** Notification type */
  type: 'info' | 'warning' | 'success' | 'error'
  /** Target user ID */
  userId: string
  /** Organization ID */
  organizationId: string
  /** Additional metadata */
  metadata?: Record<string, unknown>
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

  /**
   * Check if a notification should be sent based on deduplication rules
   * Override this method in subclasses to implement job-specific deduplication
   * @param userId Target user ID
   * @param organizationId Organization ID
   * @param deduplicationKey Unique key for this notification type
   * @param deduplicationPeriod Hours to look back for duplicates
   * @returns Whether the notification should be sent
   */
  protected async shouldSendNotification(
    userId: string,
    organizationId: string,
    deduplicationKey: string,
    deduplicationPeriod: number = 24
  ): Promise<boolean> {
    const { prisma } = await import('@/lib/db')

    const cutoffDate = new Date()
    cutoffDate.setHours(cutoffDate.getHours() - deduplicationPeriod)

    // Get all notifications for this user and organization within the time period
    const existingNotifications = await prisma.notification.findMany({
      where: {
        userId,
        organizationId,
        createdAt: {
          gte: cutoffDate,
        },
      },
    })

    // Check if any existing notification has the same deduplication key
    for (const notification of existingNotifications) {
      const metadata = notification.metadata as Record<string, unknown> | null
      if (metadata && metadata.deduplicationKey === deduplicationKey) {
        return false
      }
    }

    return true
  }

  /**
   * Create notification data with deduplication key
   * @param notificationData Base notification data
   * @param deduplicationKey Unique key for deduplication
   * @returns Notification data with deduplication metadata
   */
  protected createNotificationWithDeduplication(
    notificationData: Omit<NotificationData, 'metadata'> & {
      metadata?: Record<string, unknown>
    },
    deduplicationKey: string
  ): NotificationData {
    return {
      ...notificationData,
      metadata: {
        ...notificationData.metadata,
        deduplicationKey,
        jobId: this.id,
      },
    }
  }
}
