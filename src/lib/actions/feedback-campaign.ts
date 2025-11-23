'use server'

import { prisma } from '@/lib/db'
import {
  feedbackCampaignSchema,
  feedbackResponseSchema,
  type FeedbackCampaignFormData,
  type FeedbackResponseFormData,
} from '@/lib/validations'
import { revalidatePath } from 'next/cache'
import { getCurrentUser, getActionPermission } from '@/lib/auth-utils'
import { generateInviteLinkToken } from '@/lib/utils/invite-link'
import { checkIfManagerOrSelf } from '../utils/people-utils'
import { generateText } from '@/lib/ai'
import {
  checkOrganizationLimit,
  getOrganizationCounts,
} from '@/lib/subscription-utils'

export async function createFeedbackCampaign(
  formData: FeedbackCampaignFormData
) {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId) {
    throw new Error(
      'User must belong to an organization to create feedback campaigns'
    )
  }

  // Validate the form data
  const validatedData = feedbackCampaignSchema.parse(formData)

  // Get the current user's person record
  const currentPerson = await prisma.person.findFirst({
    where: {
      id: user.managerOSPersonId || '',
    },
  })

  if (!currentPerson) {
    throw new Error('No person record found for current user')
  }

  // Verify the target person belongs to the same organization
  const targetPerson = await prisma.person.findFirst({
    where: {
      id: validatedData.targetPersonId,
      organizationId: user.managerOSOrganizationId,
    },
  })

  if (!targetPerson) {
    throw new Error('Target person not found or access denied')
  }

  // Check if the current user is a manager (direct or indirect) of the target person
  const isManager = await checkIfManagerOrSelf(
    currentPerson.id,
    targetPerson.id
  )

  if (!isManager) {
    throw new Error(
      'You must be a manager of the target person to create a feedback campaign'
    )
  }

  // Check organization limits before creating
  const counts = await getOrganizationCounts(user.managerOSOrganizationId)
  const limitCheck = await checkOrganizationLimit(
    user.managerOSOrganizationId,
    'feedbackCampaigns',
    counts.feedbackCampaigns
  )

  if (!limitCheck) {
    throw new Error('Feedback campaigns limit exceeded')
  }

  // Generate a unique invite link token
  const inviteLinkToken = generateInviteLinkToken()

  // Create the feedback campaign
  const campaign = await prisma.feedbackCampaign.create({
    data: {
      name: validatedData.name,
      userId: user.managerOSUserId || '',
      targetPersonId: validatedData.targetPersonId,
      templateId: validatedData.templateId,
      startDate: new Date(validatedData.startDate),
      endDate: new Date(validatedData.endDate),
      inviteEmails: validatedData.inviteEmails,
      inviteLink: inviteLinkToken,
      status: 'draft',
    },
    include: {
      targetPerson: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      user: {
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
    },
  })

  revalidatePath(`/people/${validatedData.targetPersonId}`)
  return campaign
}

export async function updateFeedbackCampaign(
  id: string,
  formData: FeedbackCampaignFormData
) {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId) {
    throw new Error(
      'User must belong to an organization to update feedback campaigns'
    )
  }

  // Validate the form data
  const validatedData = feedbackCampaignSchema.parse(formData)

  // Get the current user's person record
  const currentPerson = await prisma.person.findFirst({
    where: {
      user: {
        id: user.managerOSUserId || '',
      },
    },
  })

  if (!currentPerson) {
    throw new Error('No person record found for current user')
  }

  // Check if the campaign exists and belongs to the current user
  const existingCampaign = await prisma.feedbackCampaign.findFirst({
    where: {
      id,
      userId: user.managerOSUserId || '',
    },
    include: {
      targetPerson: true,
    },
  })

  if (!existingCampaign) {
    throw new Error('Campaign not found or access denied')
  }

  // Verify the target person belongs to the same organization
  const targetPerson = await prisma.person.findFirst({
    where: {
      id: validatedData.targetPersonId,
      organizationId: user.managerOSOrganizationId,
    },
  })

  if (!targetPerson) {
    throw new Error('Target person not found or access denied')
  }

  // Check if the current user is a manager (direct or indirect) of the target person
  const isManager = await checkIfManagerOrSelf(
    currentPerson.id,
    targetPerson.id
  )

  if (!isManager) {
    throw new Error(
      'You must be a manager of the target person to update this feedback campaign'
    )
  }

  // Update the campaign
  const campaign = await prisma.feedbackCampaign.update({
    where: { id },
    data: {
      name: validatedData.name,
      targetPersonId: validatedData.targetPersonId,
      templateId: validatedData.templateId,
      startDate: new Date(validatedData.startDate),
      endDate: new Date(validatedData.endDate),
      inviteEmails: validatedData.inviteEmails,
    },
    include: {
      targetPerson: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      user: {
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
    },
  })

  revalidatePath(`/people/${validatedData.targetPersonId}`)
  return campaign
}

export async function deleteFeedbackCampaign(id: string) {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId) {
    throw new Error(
      'User must belong to an organization to delete feedback campaigns'
    )
  }

  // Check if the campaign exists and belongs to the current user
  const existingCampaign = await prisma.feedbackCampaign.findFirst({
    where: {
      id,
      userId: user.managerOSUserId || '',
    },
    include: {
      targetPerson: true,
    },
  })

  if (!existingCampaign) {
    throw new Error('Campaign not found or access denied')
  }

  // Delete the campaign (this will cascade delete responses)
  await prisma.feedbackCampaign.delete({
    where: { id },
  })

  revalidatePath(`/people/${existingCampaign.targetPersonId}`)
}

export async function getFeedbackCampaignsForPerson(personId: string) {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId) {
    throw new Error(
      'User must belong to an organization to view feedback campaigns'
    )
  }

  // Get the current user's person record
  const currentPerson = await prisma.person.findFirst({
    where: {
      user: {
        id: user.managerOSUserId || '',
      },
    },
  })

  if (!currentPerson) {
    throw new Error('No person record found for current user')
  }

  // Verify the person belongs to the same organization
  const person = await prisma.person.findFirst({
    where: {
      id: personId,
      organizationId: user.managerOSOrganizationId,
    },
  })

  if (!person) {
    throw new Error('Person not found or access denied')
  }

  // Check if the current user is a manager (direct or indirect) of the person
  const isManager = await checkIfManagerOrSelf(currentPerson.id, personId)

  if (!isManager) {
    throw new Error(
      'You must be a manager of this person to view their feedback campaigns'
    )
  }

  // Get campaigns for the person created by the current user
  const campaigns = await prisma.feedbackCampaign.findMany({
    where: {
      targetPersonId: personId,
      userId: user.managerOSUserId || '',
    },
    include: {
      targetPerson: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      responses: {
        select: {
          id: true,
          responderEmail: true,
          submittedAt: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return campaigns
}

export async function getFeedbackCampaignById(id: string) {
  const user = await getCurrentUser()

  const hasPermission = await getActionPermission(
    user,
    'feedback-campaign.view',
    id
  )

  if (!hasPermission) {
    throw new Error('You do not have permission to view this feedback campaign')
  }

  const campaign = await prisma.feedbackCampaign.findFirst({
    where: {
      id,
    },
    include: {
      targetPerson: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      responses: {
        select: {
          id: true,
          responderEmail: true,
          submittedAt: true,
          responses: true,
        },
      },
    },
  })

  return campaign
}

export async function submitFeedbackResponse(
  formData: FeedbackResponseFormData
) {
  // Validate the form data
  const validatedData = feedbackResponseSchema.parse(formData)

  // Get the campaign
  const campaign = await prisma.feedbackCampaign.findUnique({
    where: { id: validatedData.campaignId },
    include: {
      targetPerson: true,
    },
  })

  if (!campaign) {
    throw new Error('Campaign not found')
  }

  // Check if the campaign is active
  const now = new Date()
  if (
    campaign.status !== 'active' ||
    now < campaign.startDate ||
    now > campaign.endDate
  ) {
    throw new Error(
      'This feedback campaign is not currently accepting responses'
    )
  }

  // Check if the responder email is in the invite list
  if (!campaign.inviteEmails.includes(validatedData.responderEmail)) {
    throw new Error('Your email is not authorized to respond to this campaign')
  }

  // Check if this email has already responded
  const existingResponse = await prisma.feedbackResponse.findUnique({
    where: {
      // eslint-disable-next-line camelcase
      campaignId_responderEmail: {
        campaignId: validatedData.campaignId,
        responderEmail: validatedData.responderEmail,
      },
    },
  })

  if (existingResponse) {
    throw new Error('You have already submitted feedback for this campaign')
  }

  // Create the response
  const response = await prisma.feedbackResponse.create({
    data: {
      campaignId: validatedData.campaignId,
      responderEmail: validatedData.responderEmail,
      responses: validatedData.responses,
    },
  })

  return response
}

export async function submitFeedbackResponseByInviteLink(
  inviteLink: string,
  responderEmail: string,
  responses: Record<string, string | number>
) {
  // Get the campaign by invite link
  const campaign = await getFeedbackCampaignByInviteLink(inviteLink)

  if (!campaign) {
    return null
  }

  // Check if the responder email is in the invite list
  if (!campaign.inviteEmails.includes(responderEmail)) {
    throw new Error('Your email is not authorized to respond to this campaign')
  }

  // Check if this email has already responded
  const existingResponse = await prisma.feedbackResponse.findUnique({
    where: {
      // eslint-disable-next-line camelcase
      campaignId_responderEmail: {
        campaignId: campaign.id,
        responderEmail,
      },
    },
  })

  if (existingResponse) {
    throw new Error('You have already submitted feedback for this campaign')
  }

  // Create the response
  const response = await prisma.feedbackResponse.create({
    data: {
      campaignId: campaign.id,
      responderEmail,
      responses,
    },
  })

  return response
}

export async function updateCampaignStatus(
  id: string,
  status: 'draft' | 'active' | 'completed' | 'cancelled'
) {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId) {
    throw new Error(
      'User must belong to an organization to update campaign status'
    )
  }

  // Check if the campaign exists and belongs to the current user
  const existingCampaign = await prisma.feedbackCampaign.findFirst({
    where: {
      id,
      userId: user.managerOSUserId || '',
    },
  })

  if (!existingCampaign) {
    throw new Error('Campaign not found or access denied')
  }

  // Update the campaign status
  const campaign = await prisma.feedbackCampaign.update({
    where: { id },
    data: { status },
    include: {
      targetPerson: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  })

  revalidatePath(`/people/${campaign.targetPersonId}`)
  return campaign
}

export async function getFeedbackCampaignByInviteLink(inviteLink: string) {
  const campaign = await prisma.feedbackCampaign.findFirst({
    where: {
      inviteLink,
      status: 'active', // Only allow access to active campaigns
    },
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
    },
  })

  return campaign
}

export async function getFeedbackCampaignResponses(campaignId: string) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  // Get the campaign with responses
  const campaign = await prisma.feedbackCampaign.findFirst({
    where: {
      id: campaignId,
      userId: user.managerOSUserId || '', // Only allow the campaign creator to view responses
    },
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
  })

  return campaign
}

export async function getAllFeedbackCampaignsForOrganization() {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization')
  }

  // Get the current user's person record
  const currentPerson = await prisma.person.findFirst({
    where: {
      user: {
        id: user.managerOSUserId || '',
      },
    },
  })

  if (!currentPerson) {
    throw new Error('No person record found for current user')
  }

  // Get all campaigns in the organization created by the current user where the current user is a manager of the target person
  const campaigns = await prisma.feedbackCampaign.findMany({
    where: {
      userId: user.managerOSUserId || '',
      targetPerson: {
        organizationId: user.managerOSOrganizationId,
      },
    },
    include: {
      targetPerson: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
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
    },
    orderBy: { createdAt: 'desc' },
  })

  // Filter campaigns to only include those where the current user is a manager of the target person
  const filteredCampaigns = []
  for (const campaign of campaigns) {
    const isManager = await checkIfManagerOrSelf(
      currentPerson.id,
      campaign.targetPersonId
    )
    if (isManager) {
      filteredCampaigns.push(campaign)
    }
  }

  return filteredCampaigns
}

export interface GenerateFeedbackCampaignSummaryResponse {
  success: boolean
  summary: string
}

export async function generateFeedbackCampaignSummary(
  campaignId: string
): Promise<GenerateFeedbackCampaignSummaryResponse> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization')
  }

  // Get the campaign with responses and template
  const campaign = await prisma.feedbackCampaign.findFirst({
    where: {
      id: campaignId,
      userId: user.managerOSUserId || '', // Only allow the campaign creator to generate summaries
    },
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
  })

  if (!campaign) {
    throw new Error(
      'Campaign not found or you do not have permission to generate summaries'
    )
  }

  // Check if there are any responses
  if (campaign.responses.length === 0) {
    throw new Error('No feedback responses available to summarize')
  }

  // Build structured data for AI
  const summaryData = {
    campaign: {
      name: campaign.name || `${campaign.targetPerson.name} Feedback Campaign`,
      targetPerson: campaign.targetPerson.name,
      startDate: campaign.startDate.toISOString(),
      endDate: campaign.endDate.toISOString(),
      totalResponses: campaign.responses.length,
      totalInvites: campaign.inviteEmails.length,
    },
    template: campaign.template
      ? {
          name: campaign.template.name,
          description: campaign.template.description,
          questions: campaign.template.questions.map(q => ({
            id: q.id,
            question: q.question,
            type: q.type,
            required: q.required,
          })),
        }
      : null,
    responses: campaign.responses.map(response => ({
      responderEmail: response.responderEmail,
      submittedAt: response.submittedAt.toISOString(),
      answers: response.responses as Record<string, unknown>,
    })),
  }

  // Generate AI summary
  const system = `You are an engieering manager of the person being reviewed creating summaries of feedback campaign responses.
Write in a professional but conversational tone. Focus on synthesizing themes and patterns across multiple responses.
Create a clear, structured summary that:
- Identifies common themes and patterns across responses
- Highlights both strengths and areas for improvement
- Provides specific examples when relevant
- Maintains anonymity by not mentioning specific responder emails
- Organizes information logically (e.g., strengths, areas for growth, key themes)
Be concise, specific, and actionable. Do not fabricate information not provided in the data.  Keep the response to 2-3 paragraphs.`

  const prompt = `Create a professional summary of feedback received for ${campaign.targetPerson.name} based on the following feedback campaign data:

${JSON.stringify(summaryData, null, 2)}

Guidelines:
- Start with a brief overview of the campaign (target person, dates, response rate)
- Identify and group common themes and patterns across responses
- Highlight both strengths and areas for improvement
- Use specific examples from the responses when relevant
- Maintain anonymity - do not mention specific responder emails
- Organize the summary logically (e.g., strengths first, then areas for growth, then key themes)
- Keep it professional, factual, and well-structured
- Keep the response to 2-3 paragraphs`

  const summary = await generateText({
    system,
    prompt,
    temperature: 0.3,
    maxTokens: 800,
  })

  return {
    success: true,
    summary,
  }
}
