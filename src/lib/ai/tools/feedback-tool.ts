import { z } from 'zod'
import { Prisma } from '@/generated/prisma'
import { getCurrentUser } from '@/lib/auth-utils'
import { prisma } from '@/lib/db'

export const feedbackTool = {
  description:
    'Search for feedback data including direct feedback and feedback campaign responses. Returns feedback that the current user has access to based on privacy settings and organizational boundaries.',
  parameters: z.object({
    personId: z
      .string()
      .optional()
      .describe('Filter feedback about a specific person by their ID'),
    personName: z
      .string()
      .optional()
      .describe(
        'Filter feedback about a specific person by their name (partial match)'
      ),
    fromPersonId: z
      .string()
      .optional()
      .describe('Filter feedback from a specific person by their ID'),
    fromPersonName: z
      .string()
      .optional()
      .describe(
        'Filter feedback from a specific person by their name (partial match)'
      ),
    kind: z
      .enum(['positive', 'constructive', 'general'])
      .optional()
      .describe('Filter by feedback kind: positive, constructive, or general'),
    isPrivate: z
      .boolean()
      .optional()
      .describe(
        'Filter by privacy level: true for private feedback, false for public feedback'
      ),
    includeCampaigns: z
      .boolean()
      .optional()
      .describe(
        'Include feedback campaign responses in search results (default: true)'
      ),
    includeDirectFeedback: z
      .boolean()
      .optional()
      .describe('Include direct feedback in search results (default: true)'),
    limit: z
      .number()
      .min(1)
      .max(100)
      .optional()
      .describe('Maximum number of results to return (default: 50)'),
  }),
  execute: async ({
    personId,
    personName,
    fromPersonId,
    fromPersonName,
    kind,
    isPrivate,
    includeCampaigns = true,
    includeDirectFeedback = true,
    limit = 50,
  }: {
    personId?: string
    personName?: string
    fromPersonId?: string
    fromPersonName?: string
    kind?: 'positive' | 'constructive' | 'general'
    isPrivate?: boolean
    includeCampaigns?: boolean
    includeDirectFeedback?: boolean
    limit?: number
  }) => {
    console.log('🔧 feedbackTool called with parameters:', {
      personId,
      personName,
      fromPersonId,
      fromPersonName,
      kind,
      isPrivate,
      includeCampaigns,
      includeDirectFeedback,
      limit,
    })

    try {
      const user = await getCurrentUser()
      if (!user.managerOSOrganizationId) {
        throw new Error(
          'User must belong to an organization to search feedback'
        )
      }

      // Get the current user's person record
      const currentPerson = await prisma.person.findFirst({
        where: {
          user: {
            id: user.managerOSUserId,
          },
        },
      })

      if (!currentPerson) {
        throw new Error('No person record found for current user')
      }

      const results: Array<{
        id: string
        type: 'direct' | 'campaign'
        content: string | Record<string, string>
        kind: 'positive' | 'constructive' | 'general'
        isPrivate: boolean
        createdAt: Date
        about: { id: string; name: string; email: string | null }
        from: { id: string; name: string; email: string | null }
        source: string
        campaignId?: string
        template?: {
          id: string
          name: string
          questions: Array<{
            id: string
            question: string
            sortOrder: number
          }>
        } | null
      }> = []

      // Search direct feedback if requested
      if (includeDirectFeedback) {
        // Build where clause for direct feedback
        const directFeedbackWhere: Prisma.FeedbackWhereInput = {
          OR: [
            { isPrivate: false }, // Public feedback
            { fromId: currentPerson.id }, // Private feedback by current user
          ],
          about: {
            organizationId: user.managerOSOrganizationId, // Ensure about person is in same org
          },
        }

        // Add person filters
        if (personId) {
          directFeedbackWhere.aboutId = personId
        } else if (personName) {
          directFeedbackWhere.about = {
            ...directFeedbackWhere.about,
            name: {
              contains: personName,
              mode: 'insensitive',
            },
          } as Prisma.PersonWhereInput
        }

        // Add from person filters
        if (fromPersonId) {
          directFeedbackWhere.fromId = fromPersonId
        } else if (fromPersonName) {
          directFeedbackWhere.from = {
            name: {
              contains: fromPersonName,
              mode: 'insensitive',
            },
            organizationId: user.managerOSOrganizationId,
          } as Prisma.PersonWhereInput
        }

        // Add kind filter
        if (kind) {
          directFeedbackWhere.kind = kind
        }

        // Add privacy filter
        if (isPrivate !== undefined) {
          directFeedbackWhere.isPrivate = isPrivate
        }

        const directFeedback = await prisma.feedback.findMany({
          where: directFeedbackWhere,
          include: {
            about: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            from: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
        })

        // Transform direct feedback to consistent format
        const transformedDirectFeedback = directFeedback.map(
          feedback =>
            ({
              id: feedback.id,
              type: 'direct' as const,
              content: feedback.body,
              kind: feedback.kind as 'positive' | 'constructive' | 'general',
              isPrivate: feedback.isPrivate,
              createdAt: feedback.createdAt,
              about: feedback.about,
              from: feedback.from,
              source: 'Direct Feedback',
            }) as const
        )

        results.push(...transformedDirectFeedback)
      }

      // Search feedback campaign responses if requested
      if (includeCampaigns) {
        // Build where clause for feedback campaigns
        const campaignWhere: Prisma.FeedbackCampaignWhereInput = {
          userId: user.managerOSUserId, // Only campaigns created by current user
          targetPerson: {
            organizationId: user.managerOSOrganizationId, // Ensure target person is in same org
          },
        }

        // Add person filters for campaigns
        if (personId) {
          campaignWhere.targetPersonId = personId
        } else if (personName) {
          campaignWhere.targetPerson = {
            ...campaignWhere.targetPerson,
            name: {
              contains: personName,
              mode: 'insensitive',
            },
          } as Prisma.PersonWhereInput
        }

        const campaigns = await prisma.feedbackCampaign.findMany({
          where: campaignWhere,
          include: {
            targetPerson: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            template: {
              include: {
                questions: {
                  orderBy: { sortOrder: 'asc' },
                },
              },
            },
            responses: {
              orderBy: { submittedAt: 'desc' },
            },
          },
          orderBy: { createdAt: 'desc' },
        })

        // Transform campaign responses to consistent format
        const transformedCampaignResponses = campaigns.flatMap(campaign =>
          campaign.responses.map(
            response =>
              ({
                id: response.id,
                type: 'campaign' as const,
                content: response.responses as Record<string, string>,
                kind: 'general' as const, // Campaign responses are generally categorized as general
                isPrivate: false, // Campaign responses are considered public within the organization
                createdAt: response.submittedAt,
                about: campaign.targetPerson,
                from: {
                  id: response.responderEmail,
                  name: response.responderEmail,
                  email: response.responderEmail,
                },
                source: `Feedback Campaign: ${campaign.name || 'Unnamed Campaign'}`,
                campaignId: campaign.id,
                template: campaign.template,
              }) as const
          )
        )

        results.push(...transformedCampaignResponses)
      }

      // Sort all results by creation date
      results.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )

      // Apply limit to combined results
      const limitedResults = results.slice(0, limit)

      return {
        feedback: limitedResults,
        total: results.length,
        limit,
        filters: {
          personId,
          personName,
          fromPersonId,
          fromPersonName,
          kind,
          isPrivate,
          includeCampaigns,
          includeDirectFeedback,
        },
      }
    } catch (error) {
      console.error('Error in feedback tool:', error)
      throw error
    }
  },
}
