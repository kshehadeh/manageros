/**
 * Task reminder Web Push job - sends push notifications for due task reminders.
 * Runs per organization: ensures delivery records exist, then sends Web Push for each due delivery.
 */

import { CronJob, CronJobResult, CronJobExecutionContext } from '../types'
import {
  ensureDeliveryRecordsForOrganization,
  getDueNowDeliveriesForOrganization,
  markDeliveryPushSent,
} from '@/lib/data/task-reminders'
import { sendPushNotification } from '@/lib/web-push'
import { prisma } from '@/lib/db'
import type { Prisma } from '@/generated/prisma'

type InputJsonValue = Prisma.InputJsonValue

export class TaskReminderPushJob extends CronJob {
  readonly id = 'task-reminder-push'
  readonly name = 'Task Reminder Push'
  readonly description =
    'Sends Web Push notifications for task reminders that are due'
  readonly schedule = '*/5 * * * *' // Every 5 minutes

  async execute(context: CronJobExecutionContext): Promise<CronJobResult> {
    const { organizationId } = context
    let notificationsCreated = 0
    const metadata: Record<string, InputJsonValue> = {}

    try {
      if (!organizationId) {
        throw new Error('Organization ID is required')
      }

      if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
        return {
          success: true,
          notificationsCreated: 0,
          metadata: { skip: 'VAPID keys not configured' },
        }
      }

      await ensureDeliveryRecordsForOrganization(organizationId)
      const deliveries =
        await getDueNowDeliveriesForOrganization(organizationId)

      const subscriptionsByUser = new Map<
        string,
        Array<{ endpoint: string; auth: string; p256dh: string }>
      >()
      const userIds = [...new Set(deliveries.map(d => d.userId))]
      if (userIds.length > 0) {
        const subs = await prisma.pushSubscription.findMany({
          where: { userId: { in: userIds } },
        })
        for (const s of subs) {
          const list = subscriptionsByUser.get(s.userId) ?? []
          list.push({ endpoint: s.endpoint, auth: s.auth, p256dh: s.p256dh })
          subscriptionsByUser.set(s.userId, list)
        }
      }

      for (const delivery of deliveries) {
        const subs = subscriptionsByUser.get(delivery.userId)
        if (!subs?.length) continue
        const payload = {
          type: 'task-reminder' as const,
          deliveryId: delivery.id,
          taskId: delivery.taskId,
          taskTitle: delivery.task.title ?? 'Task due',
          taskDueDate: new Date(delivery.taskDueDate).toISOString(),
        }
        let sent = false
        for (const sub of subs) {
          try {
            const ok = await sendPushNotification(sub, payload)
            if (ok) {
              sent = true
              break
            }
          } catch {
            // Continue to next subscription
          }
        }
        if (sent) {
          await markDeliveryPushSent(delivery.id)
          notificationsCreated++
        }
      }

      metadata.deliveriesProcessed = deliveries.length
      metadata.notificationsSent = notificationsCreated

      return {
        success: true,
        notificationsCreated,
        metadata,
      }
    } catch (error) {
      return {
        success: false,
        notificationsCreated: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata,
      }
    }
  }

  validateConfig(_config: Record<string, unknown>): boolean {
    return true
  }

  getDefaultConfig(): Record<string, unknown> {
    return {}
  }
}
