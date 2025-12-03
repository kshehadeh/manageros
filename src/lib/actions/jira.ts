'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/auth-utils'
import { encrypt } from '@/lib/encryption'
import { JiraApiService } from '@/lib/jira-api'
import type { Prisma } from '@prisma/client'

export async function saveJiraCredentials(formData: {
  jiraUsername: string
  jiraApiKey: string
  jiraBaseUrl: string
}) {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization to configure Jira')
  }

  // Validate Jira URL format
  try {
    new URL(formData.jiraBaseUrl)
  } catch {
    throw new Error('Invalid Jira base URL format')
  }

  // Test the connection before saving
  const jiraService = new JiraApiService({
    username: formData.jiraUsername,
    apiKey: formData.jiraApiKey,
    baseUrl: formData.jiraBaseUrl,
  })

  try {
    await jiraService.testConnection()
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? error.message
        : 'Failed to connect to Jira. Please check your credentials and URL.'
    )
  }

  // Encrypt the API key
  const encryptedApiKey = encrypt(formData.jiraApiKey)

  // Upsert the credentials
  await prisma.userJiraCredentials.upsert({
    where: { userId: user.managerOSUserId || '' },
    create: {
      userId: user.managerOSUserId || '',
      jiraUsername: formData.jiraUsername,
      encryptedApiKey,
      jiraBaseUrl: formData.jiraBaseUrl,
    },
    update: {
      jiraUsername: formData.jiraUsername,
      encryptedApiKey,
      jiraBaseUrl: formData.jiraBaseUrl,
    },
  })

  revalidatePath('/settings')
  return { success: true }
}

export async function getJiraCredentials() {
  const user = await getCurrentUser()

  const credentials = await prisma.userJiraCredentials.findUnique({
    where: { userId: user.managerOSUserId || '' },
  })

  if (!credentials) {
    return null
  }

  return {
    jiraUsername: credentials.jiraUsername,
    jiraBaseUrl: credentials.jiraBaseUrl,
    // Don't return the encrypted API key for security
  }
}

export async function getJiraBaseUrl() {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId) {
    return null
  }

  // Get the organization-level Jira integration
  const orgIntegration = await prisma.integration.findFirst({
    where: {
      organizationId: user.managerOSOrganizationId,
      integrationType: 'jira',
      scope: 'organization',
      isEnabled: true,
    },
    orderBy: { createdAt: 'asc' },
  })

  if (!orgIntegration) {
    return null
  }

  // Get Jira base URL from integration credentials
  const credentials = orgIntegration.encryptedCredentials as {
    jiraBaseUrl?: string
  }

  return credentials?.jiraBaseUrl || null
}

export async function deleteJiraCredentials() {
  const user = await getCurrentUser()

  await prisma.userJiraCredentials.delete({
    where: { userId: user.managerOSUserId || '' },
  })

  revalidatePath('/settings')
  return { success: true }
}

export async function linkPersonToJiraAccount(
  personId: string,
  jiraEmail: string
) {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization')
  }

  // Verify person belongs to user's organization
  const person = await prisma.person.findFirst({
    where: {
      id: personId,
      organizationId: user.managerOSOrganizationId,
    },
  })

  if (!person) {
    throw new Error('Person not found or access denied')
  }

  // Get the first organization-level Jira integration
  const orgIntegration = await prisma.integration.findFirst({
    where: {
      organizationId: user.managerOSOrganizationId,
      integrationType: 'jira',
      scope: 'organization',
      isEnabled: true,
    },
    orderBy: { createdAt: 'asc' }, // Use the first one created
  })

  if (!orgIntegration) {
    throw new Error(
      'Organization Jira integration not configured. Please contact your administrator.'
    )
  }

  // Get integration instance
  const { getIntegration } = await import(
    '@/lib/integrations/integration-factory'
  )
  const integrationInstance = await getIntegration(orgIntegration.id)

  if (!integrationInstance) {
    throw new Error('Failed to create integration instance')
  }

  // Search for Jira user by email using the integration
  if (integrationInstance.getType() !== 'jira') {
    throw new Error('Invalid integration type')
  }

  // Use the integration's searchEntities method to find users
  const searchResults = await integrationInstance.searchEntities({
    query: jiraEmail,
  })

  if (searchResults.length === 0) {
    throw new Error(`No active Jira user found with email: ${jiraEmail}`)
  }

  if (searchResults.length > 1) {
    throw new Error(`Multiple Jira users found with email: ${jiraEmail}`)
  }

  const jiraUserResult = searchResults[0]
  const jiraAccountId = jiraUserResult.id
  const jiraEmailAddress = jiraUserResult.description || jiraEmail
  const jiraDisplayName = jiraUserResult.title || jiraEmail

  // Get Jira base URL from integration metadata or credentials
  const credentials = orgIntegration.encryptedCredentials as {
    jiraBaseUrl?: string
  }
  const jiraBaseUrl = credentials?.jiraBaseUrl || ''

  // Check if link already exists
  const existingLink = await prisma.entityIntegrationLink.findFirst({
    where: {
      entityType: 'Person',
      entityId: personId,
      integrationId: orgIntegration.id,
      externalEntityId: jiraAccountId,
    },
  })

  if (existingLink) {
    // Update existing link
    await prisma.entityIntegrationLink.update({
      where: { id: existingLink.id },
      data: {
        metadata: {
          jiraEmail: jiraEmailAddress,
          jiraDisplayName: jiraDisplayName,
        } as unknown as Prisma.InputJsonValue,
      },
    })
  } else {
    // Create new link
    await prisma.entityIntegrationLink.create({
      data: {
        organizationId: user.managerOSOrganizationId,
        entityType: 'Person',
        entityId: personId,
        integrationId: orgIntegration.id,
        externalEntityId: jiraAccountId,
        externalEntityUrl:
          jiraUserResult.url || `${jiraBaseUrl}/people/${jiraAccountId}`,
        metadata: {
          jiraEmail: jiraEmailAddress,
          jiraDisplayName: jiraDisplayName,
        } as unknown as Prisma.InputJsonValue,
      },
    })
  }

  // Also update the old PersonJiraAccount table for backward compatibility
  await prisma.personJiraAccount.upsert({
    where: { personId },
    create: {
      personId,
      jiraAccountId: jiraAccountId,
      jiraEmail: jiraEmailAddress,
      jiraDisplayName: jiraDisplayName,
    },
    update: {
      jiraAccountId: jiraAccountId,
      jiraEmail: jiraEmailAddress,
      jiraDisplayName: jiraDisplayName,
    },
  })

  revalidatePath(`/people/${personId}`)
  return { success: true }
}

export async function unlinkPersonFromJiraAccount(personId: string) {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization')
  }

  // Verify person belongs to user's organization
  const person = await prisma.person.findFirst({
    where: {
      id: personId,
      organizationId: user.managerOSOrganizationId,
    },
  })

  if (!person) {
    throw new Error('Person not found or access denied')
  }

  await prisma.personJiraAccount.delete({
    where: { personId },
  })

  revalidatePath(`/people/${personId}`)
  return { success: true }
}

export async function fetchJiraAssignedTickets(
  personId: string,
  daysBack: number = 30
): Promise<
  | {
      success: true
      tickets: Array<{
        id: string
        jiraIssueKey: string
        issueTitle: string
        issueType: string
        status: string
        priority?: string
        projectKey: string
        projectName: string
        lastUpdated: string
        created: string
      }>
    }
  | { success: false; error: string }
> {
  const user = await getCurrentUser()
  try {
    if (!user.managerOSOrganizationId) {
      return { success: false, error: 'User must belong to an organization' }
    }

    // Verify person belongs to user's organization
    const person = await prisma.person.findFirst({
      where: {
        id: personId,
        organizationId: user.managerOSOrganizationId,
      },
      include: {
        jiraAccount: true,
      },
    })

    if (!person) {
      return { success: false, error: 'Person not found or access denied' }
    }

    // Get the first organization-level Jira integration
    const orgIntegration = await prisma.integration.findFirst({
      where: {
        organizationId: user.managerOSOrganizationId,
        integrationType: 'jira',
        scope: 'organization',
        isEnabled: true,
      },
      orderBy: { createdAt: 'asc' },
    })

    if (!orgIntegration) {
      return {
        success: false,
        error:
          'Organization Jira integration not configured. Please contact your administrator.',
      }
    }

    // Get Jira account ID from EntityIntegrationLink or fall back to PersonJiraAccount
    let jiraAccountId: string | null = null

    const integrationLink = await prisma.entityIntegrationLink.findFirst({
      where: {
        entityType: 'Person',
        entityId: personId,
        integrationId: orgIntegration.id,
      },
    })

    if (integrationLink) {
      jiraAccountId = integrationLink.externalEntityId
    } else if (person.jiraAccount) {
      // Fall back to old PersonJiraAccount for backward compatibility
      jiraAccountId = person.jiraAccount.jiraAccountId
    }

    if (!jiraAccountId) {
      return { success: false, error: 'Person is not linked to a Jira account' }
    }

    // Get integration instance
    const { getIntegration } = await import(
      '@/lib/integrations/integration-factory'
    )
    const integrationInstance = await getIntegration(orgIntegration.id)

    if (!integrationInstance || integrationInstance.getType() !== 'jira') {
      return {
        success: false,
        error: 'Failed to create Jira integration instance',
      }
    }

    const jiraIntegration =
      integrationInstance as import('@/lib/integrations/jira').JiraIntegration

    // Calculate date range
    const toDate = new Date()
    const fromDate = new Date()
    fromDate.setDate(fromDate.getDate() - daysBack)

    const fromDateStr = fromDate.toISOString().split('T')[0]
    const toDateStr = toDate.toISOString().split('T')[0]

    // Fetch assigned tickets from Jira using the integration
    const assignedTickets = await jiraIntegration.getUserTickets(
      jiraAccountId,
      fromDateStr,
      toDateStr
    )

    // Transform tickets for UI consumption
    const ticketData = assignedTickets.map(ticket => ({
      id: ticket.issue.id,
      jiraIssueKey: ticket.issue.key,
      issueTitle: ticket.issue.fields.summary,
      issueType: ticket.issue.fields.issuetype.name,
      status: ticket.issue.fields.status.name,
      priority: ticket.issue.fields.priority?.name,
      projectKey: ticket.issue.fields.project.key,
      projectName: ticket.issue.fields.project.name,
      lastUpdated: ticket.lastUpdated,
      created: ticket.created,
    }))

    return { success: true, tickets: ticketData }
  } catch (error) {
    console.error('Failed to fetch Jira assigned tickets:', error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to fetch Jira tickets',
    }
  }
}

export async function fetchJiraMetrics(
  personId: string,
  daysBack: number = 30
): Promise<
  | {
      success: true
      metrics: {
        completed: number
        inProgress: number
        notStarted: number
        total: number
      }
    }
  | { success: false; error: string }
> {
  try {
    const user = await getCurrentUser()

    if (!user.managerOSOrganizationId) {
      return { success: false, error: 'User must belong to an organization' }
    }

    // Verify person belongs to user's organization
    const person = await prisma.person.findFirst({
      where: {
        id: personId,
        organizationId: user.managerOSOrganizationId,
      },
      include: {
        jiraAccount: true,
      },
    })

    if (!person) {
      return { success: false, error: 'Person not found or access denied' }
    }

    // Get the first organization-level Jira integration
    const orgIntegration = await prisma.integration.findFirst({
      where: {
        organizationId: user.managerOSOrganizationId,
        integrationType: 'jira',
        scope: 'organization',
        isEnabled: true,
      },
      orderBy: { createdAt: 'asc' },
    })

    if (!orgIntegration) {
      return {
        success: false,
        error:
          'Organization Jira integration not configured. Please contact your administrator.',
      }
    }

    // Get Jira account ID from EntityIntegrationLink or fall back to PersonJiraAccount
    let jiraAccountId: string | null = null

    const integrationLink = await prisma.entityIntegrationLink.findFirst({
      where: {
        entityType: 'Person',
        entityId: personId,
        integrationId: orgIntegration.id,
      },
    })

    if (integrationLink) {
      jiraAccountId = integrationLink.externalEntityId
    } else if (person.jiraAccount) {
      // Fall back to old PersonJiraAccount for backward compatibility
      jiraAccountId = person.jiraAccount.jiraAccountId
    }

    if (!jiraAccountId) {
      return { success: false, error: 'Person is not linked to a Jira account' }
    }

    // Get integration instance
    const { getIntegration } = await import(
      '@/lib/integrations/integration-factory'
    )
    const integrationInstance = await getIntegration(orgIntegration.id)

    if (!integrationInstance || integrationInstance.getType() !== 'jira') {
      return {
        success: false,
        error: 'Failed to create Jira integration instance',
      }
    }

    const jiraIntegration =
      integrationInstance as import('@/lib/integrations/jira').JiraIntegration

    // Calculate date range for last 30 days
    const toDate = new Date()
    const fromDate = new Date()
    fromDate.setDate(fromDate.getDate() - daysBack)

    const fromDateStr = fromDate.toISOString().split('T')[0]
    const toDateStr = toDate.toISOString().split('T')[0]

    // Fetch assigned tickets from Jira using the integration
    const assignedTickets = await jiraIntegration.getUserTickets(
      jiraAccountId,
      fromDateStr,
      toDateStr
    )

    // Categorize tickets based on status
    let completed = 0
    let inProgress = 0
    let notStarted = 0

    for (const ticket of assignedTickets) {
      const statusName = ticket.issue.fields.status.name.toLowerCase()
      const statusCategory =
        ticket.issue.fields.status.statusCategory?.key?.toLowerCase()

      // Check if completed (status category "done" or status name indicates completion)
      if (
        statusCategory === 'done' ||
        statusName.includes('done') ||
        statusName.includes('closed') ||
        statusName.includes('resolved') ||
        statusName.includes('complete')
      ) {
        completed++
      }
      // Check if in progress (status category "in_progress" or status name indicates progress)
      else if (
        statusCategory === 'in_progress' ||
        statusName.includes('progress') ||
        statusName.includes('review') ||
        statusName.includes('testing') ||
        statusName.includes('in review')
      ) {
        inProgress++
      }
      // Everything else is considered not started
      else {
        notStarted++
      }
    }

    return {
      success: true,
      metrics: {
        completed,
        inProgress,
        notStarted,
        total: assignedTickets.length,
      },
    }
  } catch (error) {
    console.error('Failed to fetch Jira metrics:', error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to fetch Jira metrics',
    }
  }
}
