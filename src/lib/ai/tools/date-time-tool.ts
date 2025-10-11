import { z } from 'zod'

export const dateTimeTool = {
  description:
    'Get the current date and time information. Use this tool when you need to calculate date ranges like "last week", "this month", "today", etc.',
  parameters: z.object({}),
  execute: async () => {
    const now = new Date()

    // Calculate helpful date boundaries
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const thisWeekStart = new Date(today)
    thisWeekStart.setDate(today.getDate() - today.getDay()) // Sunday

    const lastWeekStart = new Date(thisWeekStart)
    lastWeekStart.setDate(thisWeekStart.getDate() - 7)
    const lastWeekEnd = new Date(thisWeekStart)
    lastWeekEnd.setMilliseconds(-1)

    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(thisMonthStart)
    lastMonthEnd.setMilliseconds(-1)

    return {
      currentDateTime: now.toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timestamps: {
        now: now.getTime(),
        today: today.getTime(),
        tomorrow: tomorrow.getTime(),
      },
      helpers: {
        today: {
          start: today.toISOString(),
          end: tomorrow.toISOString(),
        },
        thisWeek: {
          start: thisWeekStart.toISOString(),
          end: now.toISOString(),
        },
        lastWeek: {
          start: lastWeekStart.toISOString(),
          end: lastWeekEnd.toISOString(),
        },
        thisMonth: {
          start: thisMonthStart.toISOString(),
          end: now.toISOString(),
        },
        lastMonth: {
          start: lastMonthStart.toISOString(),
          end: lastMonthEnd.toISOString(),
        },
        last7Days: {
          start: new Date(
            now.getTime() - 7 * 24 * 60 * 60 * 1000
          ).toISOString(),
          end: now.toISOString(),
        },
        last30Days: {
          start: new Date(
            now.getTime() - 30 * 24 * 60 * 60 * 1000
          ).toISOString(),
          end: now.toISOString(),
        },
        nextWeek: {
          start: now.toISOString(),
          end: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
        nextMonth: {
          start: now.toISOString(),
          end: nextMonthStart.toISOString(),
        },
      },
    }
  },
}
