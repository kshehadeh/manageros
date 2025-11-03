import 'server-only'

import { cache } from 'react'
import { prisma } from '@/lib/db'

export const getOneOnOnesForPerson = cache(
  async (
    personId: string,
    options?: {
      limit?: number
      includeManager?: boolean
      includeReport?: boolean
      dateAfter?: Date
      dateBefore?: Date
    }
  ) => {
    const where: Record<string, unknown> = {
      OR: [{ managerId: personId }, { reportId: personId }],
    }

    if (options?.dateAfter || options?.dateBefore) {
      where.scheduledAt = {
        ...((where.scheduledAt as Record<string, unknown>) || {}),
        ...(options?.dateAfter ? { gte: options.dateAfter } : {}),
        ...(options?.dateBefore ? { lte: options.dateBefore } : {}),
      }
    }

    const include: Record<string, unknown> = {}
    if (options?.includeManager || options?.includeReport) {
      if (options.includeManager) {
        include.manager = {
          select: {
            id: true,
            name: true,
            email: true,
          },
        }
      }
      if (options.includeReport) {
        include.report = {
          select: {
            id: true,
            name: true,
            email: true,
          },
        }
      }
    }

    return prisma.oneOnOne.findMany({
      where,
      include: Object.keys(include).length > 0 ? include : undefined,
      orderBy: { scheduledAt: 'desc' },
      take: options?.limit,
    })
  }
)

export const getOneOnOnesForManagerAndReports = cache(
  async (
    managerId: string,
    reportIds: string[],
    options?: {
      dateAfter?: Date
      dateBefore?: Date
      includeScheduledAt?: boolean
    }
  ) => {
    const where: Record<string, unknown> = {
      OR: [
        { managerId, reportId: { in: reportIds } },
        { managerId: { in: reportIds }, reportId: managerId },
      ],
    }

    if (options?.dateAfter || options?.dateBefore) {
      where.scheduledAt = {
        ...((where.scheduledAt as Record<string, unknown>) || {}),
        ...(options?.dateAfter ? { gte: options.dateAfter } : {}),
        ...(options?.dateBefore ? { lte: options.dateBefore } : {}),
      }
    }

    return prisma.oneOnOne.findMany({
      where,
      select: {
        managerId: true,
        reportId: true,
        scheduledAt: options?.includeScheduledAt !== false,
      },
      orderBy: { scheduledAt: 'desc' },
    })
  }
)

export const getUpcomingOneOnOnesForPerson = cache(
  async (
    personId: string,
    dateAfter: Date,
    dateBefore: Date,
    options?: {
      limit?: number
      includeManager?: boolean
      includeReport?: boolean
    }
  ) => {
    const include: Record<string, unknown> = {}
    if (options?.includeManager) {
      include.manager = {
        select: {
          name: true,
        },
      }
    }
    if (options?.includeReport) {
      include.report = {
        select: {
          name: true,
        },
      }
    }

    return prisma.oneOnOne.findMany({
      where: {
        OR: [{ managerId: personId }, { reportId: personId }],
        scheduledAt: {
          gte: dateAfter,
          lte: dateBefore,
        },
      },
      include: Object.keys(include).length > 0 ? include : undefined,
      orderBy: {
        scheduledAt: 'asc',
      },
      take: options?.limit,
    })
  }
)
