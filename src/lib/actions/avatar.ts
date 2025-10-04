'use server'

import { uploadFileToR2 } from '@/lib/r2-upload'
import { getCurrentUser } from '@/lib/auth-utils'
import { prisma } from '@/lib/db'

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
export async function updatePersonAvatar(personId: string, avatarUrl: string | null) {
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

  // For Jira, we can use the Jira avatar API
  if (person.jiraAccount) {
    // Jira avatar API: https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-users/#api-rest-api-3-user-get
    // We'll need to fetch this from Jira API, but for now we'll store the account ID
    // The frontend can construct the URL or we can fetch it here
    avatars.jiraAvatar = person.jiraAccount.jiraAccountId
  }

  // For GitHub, we can use the GitHub avatar URL
  if (person.githubAccount) {
    // GitHub avatar URL pattern: https://avatars.githubusercontent.com/u/{user_id}
    avatars.githubAvatar = `https://github.com/${person.githubAccount.githubUsername}.png`
  }

  return avatars
}
