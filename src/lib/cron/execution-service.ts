/**
 * Service for tracking cron job executions
 */

import { prisma } from '@/lib/db'
import { InputJsonValue } from '@prisma/client/runtime/library'

export interface CronJobExecutionData {
  jobId: string
  jobName: string
  organizationId?: string
  metadata?: Record<string, InputJsonValue>
}

export class CronJobExecutionService {
  /**
   * Start tracking a cron job execution
   */
  static async startExecution(data: CronJobExecutionData) {
    return await prisma.cronJobExecution.create({
      data: {
        jobId: data.jobId,
        jobName: data.jobName,
        organizationId: data.organizationId,
        metadata: data.metadata,
        status: 'running',
      },
    })
  }

  /**
   * Complete a cron job execution
   */
  static async completeExecution(
    executionId: string,
    notificationsCreated: number,
    metadata?: Record<string, InputJsonValue>
  ) {
    return await prisma.cronJobExecution.update({
      where: { id: executionId },
      data: {
        status: 'completed',
        completedAt: new Date(),
        notificationsCreated,
        metadata: metadata ? { ...metadata } : undefined,
      },
    })
  }

  /**
   * Mark a cron job execution as failed
   */
  static async failExecution(
    executionId: string,
    error: string,
    metadata?: Record<string, InputJsonValue>
  ) {
    return await prisma.cronJobExecution.update({
      where: { id: executionId },
      data: {
        status: 'failed',
        completedAt: new Date(),
        error,
        metadata: metadata ? { ...metadata } : undefined,
      },
    })
  }

  /**
   * Get recent cron job executions
   */
  static async getRecentExecutions(
    organizationId?: string,
    limit: number = 50
  ) {
    return await prisma.cronJobExecution.findMany({
      where: organizationId ? { organizationId } : {},
      orderBy: { startedAt: 'desc' },
      take: limit,
      include: {
        organization: {
          select: { id: true },
        },
      },
    })
  }

  /**
   * Get execution statistics
   */
  static async getExecutionStats(
    organizationId?: string,
    daysBack: number = 30
  ) {
    const since = new Date()
    since.setDate(since.getDate() - daysBack)

    const where = organizationId
      ? { organizationId, startedAt: { gte: since } }
      : { startedAt: { gte: since } }

    const [total, completed, failed, totalNotifications] = await Promise.all([
      prisma.cronJobExecution.count({ where }),
      prisma.cronJobExecution.count({
        where: { ...where, status: 'completed' },
      }),
      prisma.cronJobExecution.count({ where: { ...where, status: 'failed' } }),
      prisma.cronJobExecution.aggregate({
        where,
        _sum: { notificationsCreated: true },
      }),
    ])

    return {
      total,
      completed,
      failed,
      successRate: total > 0 ? (completed / total) * 100 : 0,
      totalNotifications: totalNotifications._sum.notificationsCreated || 0,
    }
  }

  /**
   * Clean up old execution records
   */
  static async cleanupOldExecutions(daysToKeep: number = 90) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

    const result = await prisma.cronJobExecution.deleteMany({
      where: {
        startedAt: { lt: cutoffDate },
      },
    })

    return result.count
  }
}
