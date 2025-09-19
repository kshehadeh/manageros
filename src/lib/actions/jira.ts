'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/auth-utils'
import { encrypt } from '@/lib/encryption'
import { JiraApiService } from '@/lib/jira-api'

export async function saveJiraCredentials(formData: {
  jiraUsername: string
  jiraApiKey: string
  jiraBaseUrl: string
}) {
  const user = await getCurrentUser()

  if (!user.organizationId) {
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

  const isConnected = await jiraService.testConnection()
  if (!isConnected) {
    throw new Error(
      'Failed to connect to Jira. Please check your credentials and URL.'
    )
  }

  // Encrypt the API key
  const encryptedApiKey = encrypt(formData.jiraApiKey)

  // Upsert the credentials
  await prisma.userJiraCredentials.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
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
    where: { userId: user.id },
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

export async function deleteJiraCredentials() {
  const user = await getCurrentUser()

  await prisma.userJiraCredentials.delete({
    where: { userId: user.id },
  })

  revalidatePath('/settings')
  return { success: true }
}

export async function linkPersonToJiraAccount(
  personId: string,
  jiraEmail: string
) {
  const user = await getCurrentUser()

  if (!user.organizationId) {
    throw new Error('User must belong to an organization')
  }

  // Verify person belongs to user's organization
  const person = await prisma.person.findFirst({
    where: {
      id: personId,
      organizationId: user.organizationId,
    },
  })

  if (!person) {
    throw new Error('Person not found or access denied')
  }

  // Get user's Jira credentials
  const credentials = await prisma.userJiraCredentials.findUnique({
    where: { userId: user.id },
  })

  if (!credentials) {
    throw new Error('Jira credentials not configured')
  }

  // Search for Jira user by email
  const jiraService = JiraApiService.fromEncryptedCredentials(
    credentials.jiraUsername,
    credentials.encryptedApiKey,
    credentials.jiraBaseUrl
  )

  const jiraUsers = await jiraService.searchUsersByEmail(jiraEmail)

  if (jiraUsers.length === 0) {
    throw new Error(`No active Jira user found with email: ${jiraEmail}`)
  }

  if (jiraUsers.length > 1) {
    throw new Error(`Multiple Jira users found with email: ${jiraEmail}`)
  }

  const jiraUser = jiraUsers[0]

  // Create or update the link
  await prisma.personJiraAccount.upsert({
    where: { personId },
    create: {
      personId,
      jiraAccountId: jiraUser.accountId,
      jiraEmail: jiraUser.emailAddress,
      jiraDisplayName: jiraUser.displayName,
    },
    update: {
      jiraAccountId: jiraUser.accountId,
      jiraEmail: jiraUser.emailAddress,
      jiraDisplayName: jiraUser.displayName,
    },
  })

  revalidatePath(`/people/${personId}`)
  return { success: true }
}

export async function unlinkPersonFromJiraAccount(personId: string) {
  const user = await getCurrentUser()

  if (!user.organizationId) {
    throw new Error('User must belong to an organization')
  }

  // Verify person belongs to user's organization
  const person = await prisma.person.findFirst({
    where: {
      id: personId,
      organizationId: user.organizationId,
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
) {
  const user = await getCurrentUser()

  if (!user.organizationId) {
    throw new Error('User must belong to an organization')
  }

  // Verify person belongs to user's organization
  const person = await prisma.person.findFirst({
    where: {
      id: personId,
      organizationId: user.organizationId,
    },
    include: {
      jiraAccount: true,
    },
  })

  if (!person) {
    throw new Error('Person not found or access denied')
  }

  if (!person.jiraAccount) {
    throw new Error('Person is not linked to a Jira account')
  }

  // Get user's Jira credentials
  const credentials = await prisma.userJiraCredentials.findUnique({
    where: { userId: user.id },
  })

  if (!credentials) {
    throw new Error('Jira credentials not configured')
  }

  // Calculate date range
  const toDate = new Date()
  const fromDate = new Date()
  fromDate.setDate(fromDate.getDate() - daysBack)

  const fromDateStr = fromDate.toISOString().split('T')[0]
  const toDateStr = toDate.toISOString().split('T')[0]

  // Fetch assigned tickets from Jira
  const jiraService = JiraApiService.fromEncryptedCredentials(
    credentials.jiraUsername,
    credentials.encryptedApiKey,
    credentials.jiraBaseUrl
  )

  const assignedTickets = await jiraService.getUserAssignedTickets(
    person.jiraAccount.jiraAccountId,
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
}
