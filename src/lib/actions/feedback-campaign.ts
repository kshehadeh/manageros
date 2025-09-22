'use server'

import { prisma } from '@/lib/db'
import {
  feedbackCampaignSchema,
  feedbackResponseSchema,
  type FeedbackCampaignFormData,
  type FeedbackResponseFormData,
} from '@/lib/validations'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/auth-utils'
import { generateInviteLinkToken } from '@/lib/utils/invite-link'

export async function createFeedbackCampaign(
  formData: FeedbackCampaignFormData
) {
  const user = await getCurrentUser()

  if (!user.organizationId) {
    throw new Error(
      'User must belong to an organization to create feedback campaigns'
    )
  }

  // Validate the form data
  const validatedData = feedbackCampaignSchema.parse(formData)

  // Get the current user's person record
  const currentPerson = await prisma.person.findFirst({
    where: {
      user: {
        id: user.id,
      },
    },
  })

  if (!currentPerson) {
    throw new Error('No person record found for current user')
  }

  // Verify the target person belongs to the same organization
  const targetPerson = await prisma.person.findFirst({
    where: {
      id: validatedData.targetPersonId,
      organizationId: user.organizationId,
    },
  })

  if (!targetPerson) {
    throw new Error('Target person not found or access denied')
  }

  // Check if the current user is a manager (direct or indirect) of the target person
  const isManager = await isDirectOrIndirectManager(
    currentPerson.id,
    targetPerson.id
  )

  if (!isManager) {
    throw new Error(
      'You must be a manager of the target person to create a feedback campaign'
    )
  }

  // Generate a unique invite link token
  const inviteLinkToken = generateInviteLinkToken()

  // Create the feedback campaign
  const campaign = await prisma.feedbackCampaign.create({
    data: {
      name: validatedData.name,
      userId: user.id,
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

  if (!user.organizationId) {
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
        id: user.id,
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
      userId: user.id,
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
      organizationId: user.organizationId,
    },
  })

  if (!targetPerson) {
    throw new Error('Target person not found or access denied')
  }

  // Check if the current user is a manager (direct or indirect) of the target person
  const isManager = await isDirectOrIndirectManager(
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

  if (!user.organizationId) {
    throw new Error(
      'User must belong to an organization to delete feedback campaigns'
    )
  }

  // Check if the campaign exists and belongs to the current user
  const existingCampaign = await prisma.feedbackCampaign.findFirst({
    where: {
      id,
      userId: user.id,
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

  if (!user.organizationId) {
    throw new Error(
      'User must belong to an organization to view feedback campaigns'
    )
  }

  // Get the current user's person record
  const currentPerson = await prisma.person.findFirst({
    where: {
      user: {
        id: user.id,
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
      organizationId: user.organizationId,
    },
  })

  if (!person) {
    throw new Error('Person not found or access denied')
  }

  // Check if the current user is a manager (direct or indirect) of the person
  const isManager = await isDirectOrIndirectManager(currentPerson.id, personId)

  if (!isManager) {
    throw new Error(
      'You must be a manager of this person to view their feedback campaigns'
    )
  }

  // Get campaigns for the person
  const campaigns = await prisma.feedbackCampaign.findMany({
    where: {
      targetPersonId: personId,
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

  if (!user.organizationId) {
    throw new Error(
      'User must belong to an organization to view feedback campaigns'
    )
  }

  // Get the current user's person record
  const currentPerson = await prisma.person.findFirst({
    where: {
      user: {
        id: user.id,
      },
    },
  })

  if (!currentPerson) {
    throw new Error('No person record found for current user')
  }

  // Get the campaign
  const campaign = await prisma.feedbackCampaign.findFirst({
    where: {
      id,
      // Ensure the campaign is for someone in the same organization
      targetPerson: {
        organizationId: user.organizationId,
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

  if (!campaign) {
    throw new Error('Campaign not found or access denied')
  }

  // Check if the current user is a manager (direct or indirect) of the target person
  const isManager = await isDirectOrIndirectManager(
    currentPerson.id,
    campaign.targetPersonId
  )

  if (!isManager) {
    throw new Error(
      'You must be a manager of this person to view their feedback campaigns'
    )
  }

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

  if (!user.organizationId) {
    throw new Error(
      'User must belong to an organization to update campaign status'
    )
  }

  // Check if the campaign exists and belongs to the current user
  const existingCampaign = await prisma.feedbackCampaign.findFirst({
    where: {
      id,
      userId: user.id,
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

// Helper function to check if a person is a direct or indirect manager of another person
async function isDirectOrIndirectManager(
  managerId: string,
  reportId: string
): Promise<boolean> {
  // First check if it's a direct manager relationship
  const directReport = await prisma.person.findFirst({
    where: {
      id: reportId,
      managerId: managerId,
    },
  })

  if (directReport) {
    return true
  }

  // If not direct, check if it's an indirect relationship by traversing up the hierarchy
  let currentPerson = await prisma.person.findUnique({
    where: { id: reportId },
    select: { managerId: true },
  })

  while (currentPerson?.managerId) {
    if (currentPerson.managerId === managerId) {
      return true
    }

    currentPerson = await prisma.person.findUnique({
      where: { id: currentPerson.managerId },
      select: { managerId: true },
    })
  }

  return false
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

  if (!campaign) {
    throw new Error('Invalid or expired invite link')
  }

  // Check if the campaign is currently active (within date range)
  const now = new Date()
  if (now < campaign.startDate || now > campaign.endDate) {
    throw new Error('This feedback campaign is not currently active')
  }

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
      userId: user.id, // Only allow the campaign creator to view responses
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
      'Campaign not found or you do not have permission to view responses'
    )
  }

  return campaign
}

export async function getActiveFeedbackCampaignsForUser() {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  if (!user.organizationId) {
    throw new Error('User must belong to an organization')
  }

  // Get active campaigns created by the current user
  const campaigns = await prisma.feedbackCampaign.findMany({
    where: {
      userId: user.id,
      status: 'active',
      startDate: {
        lte: new Date(),
      },
      endDate: {
        gte: new Date(),
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
    orderBy: { endDate: 'asc' },
  })

  return campaigns
}
