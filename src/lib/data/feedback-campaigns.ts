import 'server-only'

import { cache } from 'react'
import { prisma } from '@/lib/db'

export const getActiveFeedbackCampaignsForUser = cache(
  async (
    userId: string,
    organizationId: string,
    options?: {
      limit?: number
      targetPersonIds?: string[]
      endDateAfter?: Date
      endDateBefore?: Date
      includeTargetPerson?: boolean
      includeTemplate?: boolean
      includeResponseCount?: boolean
    }
  ) => {
    const where: Record<string, unknown> = {
      userId,
      status: 'active',
      targetPerson: {
        organizationId,
      },
    }

    if (options?.targetPersonIds && options.targetPersonIds.length > 0) {
      where.targetPersonId = { in: options.targetPersonIds }
    }

    if (options?.endDateAfter || options?.endDateBefore) {
      where.endDate = {
        ...((where.endDate as Record<string, unknown>) || {}),
        ...(options?.endDateAfter ? { gte: options.endDateAfter } : {}),
        ...(options?.endDateBefore ? { lte: options.endDateBefore } : {}),
      }
    }

    const include: Record<string, unknown> = {}
    if (options?.includeTargetPerson) {
      include.targetPerson = {
        select: {
          id: true,
          name: true,
          email: true,
        },
      }
    }
    if (options?.includeTemplate) {
      include.template = {
        select: {
          id: true,
          name: true,
          description: true,
        },
      }
    }
    if (options?.includeResponseCount) {
      include._count = {
        select: {
          responses: true,
        },
      }
    }

    return prisma.feedbackCampaign.findMany({
      where,
      include: Object.keys(include).length > 0 ? include : undefined,
      orderBy: options?.endDateAfter
        ? { endDate: 'asc' }
        : { createdAt: 'desc' },
      take: options?.limit,
    })
  }
)

export const getFeedbackCampaignsForPerson = cache(
  async (
    targetPersonId: string,
    userId: string,
    options?: {
      includeTargetPerson?: boolean
      includeUser?: boolean
      includeTemplate?: boolean
      includeResponses?: boolean
    }
  ) => {
    const include: Record<string, unknown> = {}
    if (options?.includeTargetPerson) {
      include.targetPerson = {
        select: {
          id: true,
          name: true,
          email: true,
        },
      }
    }
    if (options?.includeUser) {
      include.user = {
        select: {
          id: true,
          name: true,
          email: true,
        },
      }
    }
    if (options?.includeTemplate) {
      include.template = {
        select: {
          id: true,
          name: true,
          description: true,
        },
      }
    }
    if (options?.includeResponses) {
      include.responses = {
        select: {
          id: true,
          responderEmail: true,
          submittedAt: true,
        },
      }
    }

    return prisma.feedbackCampaign.findMany({
      where: {
        targetPersonId,
        userId,
      },
      include: Object.keys(include).length > 0 ? include : undefined,
      orderBy: { createdAt: 'desc' },
    })
  }
)

export const getFeedbackResponseCountsByCampaign = cache(
  async (campaignIds: string[]) => {
    if (campaignIds.length === 0) {
      return []
    }

    return prisma.feedbackResponse.groupBy({
      by: ['campaignId'],
      where: {
        campaignId: { in: campaignIds },
      },
      _count: true,
    })
  }
)

export const getFeedbackCampaignById = cache(
  async (
    campaignId: string,
    userId: string,
    options?: {
      includeTargetPerson?: boolean
      includeTemplate?: boolean
    }
  ) => {
    const include: Record<string, unknown> = {}
    if (options?.includeTargetPerson) {
      include.targetPerson = {
        select: {
          id: true,
          name: true,
          email: true,
        },
      }
    }
    if (options?.includeTemplate) {
      include.template = {
        select: {
          id: true,
          name: true,
          description: true,
        },
      }
    }

    return prisma.feedbackCampaign.findFirst({
      where: {
        id: campaignId,
        userId,
      },
      include: Object.keys(include).length > 0 ? include : undefined,
    })
  }
)

export const getActiveAndDraftFeedbackCampaignsForPerson = cache(
  async (personId: string, organizationId: string, currentUserId: string) => {
    return prisma.feedbackCampaign.findMany({
      where: {
        status: {
          in: ['active', 'draft'],
        },
        userId: currentUserId,
        targetPersonId: personId,
        targetPerson: {
          organizationId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        template: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        responses: {
          select: {
            id: true,
            responderEmail: true,
            submittedAt: true,
          },
        },
        targetPerson: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  }
)
