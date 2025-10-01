/**
 * Birthday notification job - finds upcoming birthdays of direct/indirect reports
 */

import {
  CronJob,
  CronJobResult,
  CronJobExecutionContext,
  NotificationData,
} from '../types'
import { prisma } from '@/lib/db'
import { createSystemNotification } from '../../actions/notification'
import { InputJsonValue } from '@prisma/client/runtime/library'

export class BirthdayNotificationJob extends CronJob {
  readonly id = 'birthday-notification'
  readonly name = 'Birthday Notifications'
  readonly description =
    'Notifies managers about upcoming birthdays of their direct and indirect reports'
  readonly schedule = '0 9 * * *' // Daily at 9 AM

  async execute(context: CronJobExecutionContext): Promise<CronJobResult> {
    const { organizationId } = context
    let notificationsCreated = 0
    const metadata: Record<string, InputJsonValue> = {}

    try {
      if (!organizationId) {
        throw new Error('Organization ID is required')
      }

      // Get all people who are managers (have reports) with birthdays
      const managersWithReports = await prisma.person.findMany({
        where: {
          organizationId,
          reports: {
            some: {
              birthday: {
                not: null,
              },
            },
          },
          user: {
            isNot: null,
          },
        },
        include: {
          user: true,
          reports: {
            where: {
              birthday: {
                not: null,
              },
            },
            select: {
              name: true,
              birthday: true,
            },
          },
        },
      })

      metadata.managersProcessed = managersWithReports.length

      for (const manager of managersWithReports) {
        if (!manager.user) continue

        const upcomingBirthdays = this.findUpcomingBirthdays(manager.reports)

        if (upcomingBirthdays.length > 0) {
          // Create deduplication key based on the birthdays
          const deduplicationKey =
            this.createBirthdayDeduplicationKey(upcomingBirthdays)

          // Check if we should send this notification (deduplication)
          const shouldSend = await this.shouldSendNotification(
            manager.user.id,
            organizationId,
            deduplicationKey,
            24 // Don't send duplicate birthday notifications within 24 hours
          )

          if (shouldSend) {
            const notificationData = this.createBirthdayNotification(
              manager.user.id,
              organizationId,
              upcomingBirthdays,
              deduplicationKey
            )

            await createSystemNotification(notificationData)
            notificationsCreated++
          }
        }
      }

      metadata.upcomingBirthdaysFound = notificationsCreated

      return {
        success: true,
        notificationsCreated,
        metadata,
      }
    } catch (error) {
      return {
        success: false,
        notificationsCreated,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata,
      }
    }
  }

  validateConfig(_config: Record<string, unknown>): boolean {
    // This job doesn't require any specific configuration
    return true
  }

  getDefaultConfig(): Record<string, unknown> {
    return {
      daysAhead: 7, // Notify about birthdays in the next 7 days
    }
  }

  /**
   * Find reports with upcoming birthdays
   */
  private findUpcomingBirthdays(
    reports: Array<{ birthday: Date | null; name: string }>
  ): Array<{ name: string; birthday: Date; daysUntil: number }> {
    const upcomingBirthdays: Array<{
      name: string
      birthday: Date
      daysUntil: number
    }> = []
    const today = new Date()
    const daysAhead = 7 // Could be made configurable

    for (const report of reports) {
      if (!report.birthday) continue

      const birthday = new Date(report.birthday)
      const thisYearBirthday = new Date(
        today.getFullYear(),
        birthday.getMonth(),
        birthday.getDate()
      )

      // If birthday already passed this year, check next year
      if (thisYearBirthday < today) {
        thisYearBirthday.setFullYear(today.getFullYear() + 1)
      }

      const daysUntil = Math.ceil(
        (thisYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      )

      if (daysUntil <= daysAhead) {
        upcomingBirthdays.push({
          name: report.name,
          birthday: thisYearBirthday,
          daysUntil,
        })
      }
    }

    return upcomingBirthdays
  }

  /**
   * Create deduplication key for birthday notifications
   * Key is based on the specific birthdays and their days until
   */
  private createBirthdayDeduplicationKey(
    upcomingBirthdays: Array<{
      name: string
      birthday: Date
      daysUntil: number
    }>
  ): string {
    // Sort by name to ensure consistent key generation
    const sortedBirthdays = [...upcomingBirthdays].sort((a, b) =>
      a.name.localeCompare(b.name)
    )
    const keyData = sortedBirthdays
      .map(b => `${b.name}:${b.daysUntil}`)
      .join('|')
    return `birthday:${keyData}`
  }

  /**
   * Create notification data for upcoming birthdays
   */
  private createBirthdayNotification(
    userId: string,
    organizationId: string,
    upcomingBirthdays: Array<{
      name: string
      birthday: Date
      daysUntil: number
    }>,
    deduplicationKey: string
  ): NotificationData {
    const daysUntil = upcomingBirthdays[0].daysUntil
    const isToday = daysUntil === 0
    const isTomorrow = daysUntil === 1

    let title: string
    let message: string

    if (upcomingBirthdays.length === 1) {
      const person = upcomingBirthdays[0]
      if (isToday) {
        title = 'Birthday Today! 🎉'
        message = `${person.name} has a birthday today!`
      } else if (isTomorrow) {
        title = 'Birthday Tomorrow! 🎂'
        message = `${person.name} has a birthday tomorrow!`
      } else {
        title = 'Upcoming Birthday'
        message = `${person.name} has a birthday in ${daysUntil} days (${person.birthday.toLocaleDateString()})`
      }
    } else {
      const names = upcomingBirthdays.map(p => p.name).join(', ')
      if (upcomingBirthdays.some(p => p.daysUntil === 0)) {
        title = 'Birthdays This Week! 🎉'
        message = `Multiple team members have birthdays this week: ${names}`
      } else {
        title = 'Upcoming Birthdays'
        message = `Multiple team members have birthdays in the next 7 days: ${names}`
      }
    }

    return this.createNotificationWithDeduplication(
      {
        title,
        message,
        type: 'info',
        userId,
        organizationId,
        metadata: {
          upcomingBirthdays: upcomingBirthdays.map(p => ({
            name: p.name,
            birthday: p.birthday.toISOString(),
            daysUntil: p.daysUntil,
          })),
        },
      },
      deduplicationKey
    )
  }
}
