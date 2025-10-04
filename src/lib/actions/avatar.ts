'use server'

import { uploadFileToR2 } from '@/lib/r2-upload'
import { getCurrentUser } from '@/lib/auth-utils'
import { prisma } from '@/lib/db'
import { JiraApiService } from '@/lib/jira-api'

/**
 * Upload an avatar image to R2 storage and return the URL
 */
export async function uploadAvatar(formData: FormData, personId: string) {
  const user = await getCurrentUser()

  // Check if user is admin
  if (user.role !== 'ADMIN') {
    throw new Error('Only organization admins can upload avatars')
  }

  // Check if user belongs to an organization
  if (!user.organizationId) {
    throw new Error('User must belong to an organization to upload avatars')
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

  // Get the file from form data
  const file = formData.get('file') as File
  if (!file) {
    throw new Error('No file provided')
  }

  // Upload to R2 with specific options for avatars
  const uploadResult = await uploadFileToR2(file, {
    entityType: 'person',
    entityId: personId,
    folder: 'avatars',
    maxSizeBytes: 5 * 1024 * 1024, // 5MB max for avatars
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  })

  return uploadResult.r2Url
}

/**
 * Update a person's avatar URL
 */
export async function updatePersonAvatar(
  personId: string,
  avatarUrl: string | null
) {
  const user = await getCurrentUser()

  // Check if user is admin
  if (user.role !== 'ADMIN') {
    throw new Error('Only organization admins can update avatars')
  }

  // Check if user belongs to an organization
  if (!user.organizationId) {
    throw new Error('User must belong to an organization to update avatars')
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

  // Update the person's avatar
  await prisma.person.update({
    where: { id: personId },
    data: { avatar: avatarUrl },
  })

  return { success: true }
}

/**
 * Get avatar URLs from linked accounts (Jira, GitHub)
 */
export async function getLinkedAccountAvatars(personId: string) {
  const user = await getCurrentUser()

  // Check if user belongs to an organization
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
      githubAccount: true,
    },
  })

  if (!person) {
    throw new Error('Person not found or access denied')
  }

  const avatars: {
    jiraAvatar?: string
    githubAvatar?: string
  } = {}

  // For Jira, fetch the actual avatar URL from Jira API
  if (person.jiraAccount) {
    try {
      // Get user's Jira credentials
      const credentials = await prisma.userJiraCredentials.findUnique({
        where: { userId: user.id },
      })

      if (credentials) {
        const jiraService = JiraApiService.fromEncryptedCredentials(
          credentials.jiraUsername,
          credentials.encryptedApiKey,
          credentials.jiraBaseUrl
        )

        // Get user details with avatar URLs
        const jiraUser = await jiraService.getUserByAccountId(
          person.jiraAccount.jiraAccountId
        )

        if (jiraUser.avatarUrls) {
          // Use the largest available avatar (48x48)
          avatars.jiraAvatar = jiraUser.avatarUrls['48x48']
        }
      }
    } catch (error) {
      console.error('Failed to fetch Jira avatar:', error)
      // Continue without Jira avatar
    }
  }

  // For GitHub, we can use the GitHub avatar URL
  if (person.githubAccount) {
    // GitHub avatar URL pattern: https://avatars.githubusercontent.com/{username}
    avatars.githubAvatar = `https://avatars.githubusercontent.com/${person.githubAccount.githubUsername}`
  }

  return avatars
}
