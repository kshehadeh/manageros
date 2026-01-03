'use server'

import { prisma } from '@/lib/db'
import {
  feedbackCampaignSchema,
  type FeedbackCampaignFormData,
} from '@/lib/validations'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/auth-utils'
import {
  generateInviteLinkToken,
  generateInviteLinkUrl,
} from '@/lib/utils/invite-link'
import { checkIfManagerOrSelf } from '../utils/people-utils'
import { generateText } from '@/lib/ai'
import {
  checkOrganizationLimit,
  getOrganizationCounts,
} from '@/lib/subscription-utils'
import { sendEmail } from '@/lib/email-resend'
import { FeedbackCampaignInviteEmail } from '@/emails/FeedbackCampaignInviteEmail'
import { FeedbackCampaignReminderEmail } from '@/emails/FeedbackCampaignReminderEmail'
import { format, differenceInDays } from 'date-fns'
import { fetchJiraAssignedTickets } from './jira'
import { fetchGithubPullRequests } from './github'
import { resolveFeedback360Exceptions } from '@/lib/tolerance-rules/resolve-exceptions'

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
    'feedbackcampaigns',
    counts?.feedbackcampaigns ?? 0
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

  // Auto-resolve any active feedback360 exceptions for this person
  await resolveFeedback360Exceptions(
    user.managerOSOrganizationId,
    validatedData.targetPersonId
  )

  revalidatePath(`/people/${validatedData.targetPersonId}`)
  revalidatePath('/exceptions')
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
          role: true,
          jobRole: {
            select: {
              title: true,
            },
          },
          organizationId: true,
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

  // If campaign found, fetch stats for the target person
  if (campaign?.targetPerson) {
    // Get initiatives count
    const initiativesCount = await prisma.initiative.count({
      where: {
        organizationId: campaign.targetPerson.organizationId,
        owners: {
          some: { personId: campaign.targetPerson.id },
        },
      },
    })

    // Get Jira tickets count (try to fetch, but don't fail if no integration)
    let jiraTicketsCount = 0
    try {
      const jiraResult = await fetchJiraAssignedTickets(
        campaign.targetPerson.id,
        30
      )
      if (jiraResult.success) {
        jiraTicketsCount = jiraResult.tickets.length
      }
    } catch (error) {
      // Continue without Jira data
      console.warn('Failed to fetch Jira tickets:', error)
    }

    // Get open PRs count (try to fetch, but don't fail if no integration)
    let openPrsCount = 0
    try {
      const githubResult = await fetchGithubPullRequests(
        campaign.targetPerson.id,
        30
      )
      if (
        githubResult.success &&
        'pullRequests' in githubResult &&
        githubResult.pullRequests
      ) {
        openPrsCount = githubResult.pullRequests.filter(
          pr => pr.state === 'open'
        ).length
      }
    } catch (error) {
      // Continue without GitHub data
      console.warn('Failed to fetch GitHub PRs:', error)
    }

    return {
      ...campaign,
      targetPerson: {
        ...campaign.targetPerson,
        stats: {
          initiativesCount,
          jiraTicketsCount,
          openPrsCount,
        },
      },
    }
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

export async function sendFeedbackCampaignInvites(campaignId: string) {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId) {
    throw new Error(
      'User must belong to an organization to send feedback campaign invites'
    )
  }

  // Get the campaign with all necessary data
  const campaign = await prisma.feedbackCampaign.findFirst({
    where: {
      id: campaignId,
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
      template: {
        select: {
          id: true,
          name: true,
        },
      },
      responses: {
        select: {
          responderEmail: true,
        },
      },
    },
  })

  if (!campaign) {
    throw new Error('Campaign not found or access denied')
  }

  // Only allow sending if campaign is in draft or active status
  if (campaign.status !== 'draft' && campaign.status !== 'active') {
    throw new Error('Can only send invites for draft or active campaigns')
  }

  if (!campaign.inviteLink) {
    throw new Error('Campaign invite link is missing')
  }

  // Check if invites have already been sent
  const existingNotifications = await prisma.notificationRecord.findMany({
    where: {
      campaignId: campaign.id,
      type: 'EMAIL',
    },
  })

  // Filter for invite emails in JavaScript since Prisma JSON filtering is complex
  const inviteNotifications = existingNotifications.filter(
    n =>
      n.metadata &&
      typeof n.metadata === 'object' &&
      'emailType' in n.metadata &&
      n.metadata.emailType === 'invite'
  )

  if (inviteNotifications.length > 0) {
    throw new Error('Invites have already been sent for this campaign')
  }

  const inviteUrl = generateInviteLinkUrl(campaign.inviteLink)
  const startDateFormatted = format(campaign.startDate, 'MMM d, yyyy')
  const endDateFormatted = format(campaign.endDate, 'MMM d, yyyy')

  const results = []
  const errors = []

  // Send email to each invitee
  for (const email of campaign.inviteEmails) {
    try {
      const result = await sendEmail({
        to: email,
        subject: `Feedback Request: ${campaign.targetPerson.name}`,
        react: FeedbackCampaignInviteEmail({
          campaignName: campaign.name || undefined,
          targetPersonName: campaign.targetPerson.name,
          inviteLink: inviteUrl,
          startDate: startDateFormatted,
          endDate: endDateFormatted,
          creatorName: campaign.user.name || undefined,
        }),
      })

      // Create notification record
      await prisma.notificationRecord.create({
        data: {
          type: 'EMAIL',
          campaignId: campaign.id,
          recipientEmail: email,
          subject: `Feedback Request: ${campaign.targetPerson.name}`,
          metadata: {
            emailType: 'invite',
            messageId: result.messageId,
          },
        },
      })

      results.push({ email, success: true, messageId: result.messageId })
    } catch (error) {
      console.error(`Failed to send invite email to ${email}:`, error)
      errors.push({
        email,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  if (errors.length > 0 && results.length === 0) {
    throw new Error(
      `Failed to send all invites: ${errors.map(e => e.error).join(', ')}`
    )
  }

  revalidatePath(
    `/people/${campaign.targetPersonId}/feedback-campaigns/${campaign.id}`
  )
  revalidatePath(`/people/${campaign.targetPersonId}`)

  return {
    success: true,
    sent: results.length,
    failed: errors.length,
    results,
    errors: errors.length > 0 ? errors : undefined,
  }
}

export async function sendFeedbackCampaignReminder(campaignId: string) {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId) {
    throw new Error(
      'User must belong to an organization to send feedback campaign reminders'
    )
  }

  // Get the campaign with all necessary data
  const campaign = await prisma.feedbackCampaign.findFirst({
    where: {
      id: campaignId,
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
      template: {
        select: {
          id: true,
          name: true,
        },
      },
      responses: {
        select: {
          responderEmail: true,
        },
      },
    },
  })

  if (!campaign) {
    throw new Error('Campaign not found or access denied')
  }

  // Only allow sending reminders for active campaigns
  if (campaign.status !== 'active') {
    throw new Error('Can only send reminders for active campaigns')
  }

  if (!campaign.inviteLink) {
    throw new Error('Campaign invite link is missing')
  }

  // Get emails that have already responded
  const respondedEmails = new Set(campaign.responses.map(r => r.responderEmail))

  // Get emails that need reminders (invited but haven't responded)
  const emailsNeedingReminders = campaign.inviteEmails.filter(
    email => !respondedEmails.has(email)
  )

  if (emailsNeedingReminders.length === 0) {
    throw new Error('All invitees have already responded')
  }

  const inviteUrl = generateInviteLinkUrl(campaign.inviteLink)
  const startDateFormatted = format(campaign.startDate, 'MMM d, yyyy')
  const endDateFormatted = format(campaign.endDate, 'MMM d, yyyy')
  const daysRemaining = differenceInDays(campaign.endDate, new Date())

  const results = []
  const errors = []

  // Send reminder email to each non-responder
  for (const email of emailsNeedingReminders) {
    try {
      const result = await sendEmail({
        to: email,
        subject: `Reminder: Feedback Request for ${campaign.targetPerson.name}`,
        react: FeedbackCampaignReminderEmail({
          campaignName: campaign.name || undefined,
          targetPersonName: campaign.targetPerson.name,
          inviteLink: inviteUrl,
          startDate: startDateFormatted,
          endDate: endDateFormatted,
          creatorName: campaign.user.name || undefined,
          daysRemaining: daysRemaining > 0 ? daysRemaining : undefined,
        }),
      })

      // Create notification record
      await prisma.notificationRecord.create({
        data: {
          type: 'EMAIL',
          campaignId: campaign.id,
          recipientEmail: email,
          subject: `Reminder: Feedback Request for ${campaign.targetPerson.name}`,
          metadata: {
            emailType: 'reminder',
            messageId: result.messageId,
          },
        },
      })

      results.push({ email, success: true, messageId: result.messageId })
    } catch (error) {
      console.error(`Failed to send reminder email to ${email}:`, error)
      errors.push({
        email,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  if (errors.length > 0 && results.length === 0) {
    throw new Error(
      `Failed to send all reminders: ${errors.map(e => e.error).join(', ')}`
    )
  }

  revalidatePath(
    `/people/${campaign.targetPersonId}/feedback-campaigns/${campaign.id}`
  )
  revalidatePath(`/people/${campaign.targetPersonId}`)

  return {
    success: true,
    sent: results.length,
    failed: errors.length,
    results,
    errors: errors.length > 0 ? errors : undefined,
  }
}
