'use server'

import { uploadFileToR2 } from '@/lib/r2-upload'
import { getCurrentUser, isAdminOrOwner } from '@/lib/auth-utils'
import { prisma } from '@/lib/db'

/**
 * Upload an avatar image to R2 storage and return the URL
 */
export async function uploadAvatar(formData: FormData, personId: string) {
  const user = await getCurrentUser()

  // Check if user is admin or owner
  if (!isAdminOrOwner(user)) {
    throw new Error('Only organization admins or owners can upload avatars')
  }

  // Check if user belongs to an organization
  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization to upload avatars')
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
  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization to update avatars')
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
  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization')
  }

  // Verify person belongs to user's organization
  const person = await prisma.person.findFirst({
    where: {
      id: personId,
      organizationId: user.managerOSOrganizationId,
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

  // Get the organization-level Jira integration
  const jiraIntegration = await prisma.integration.findFirst({
    where: {
      organizationId: user.managerOSOrganizationId,
      integrationType: 'jira',
      scope: 'organization',
      isEnabled: true,
    },
    orderBy: { createdAt: 'asc' },
  })

  // For Jira, fetch the actual avatar URL from Jira API
  if (jiraIntegration) {
    try {
      // Get Jira account ID from EntityIntegrationLink or fall back to PersonJiraAccount
      let jiraAccountId: string | null = null

      const jiraLink = await prisma.entityIntegrationLink.findFirst({
        where: {
          entityType: 'Person',
          entityId: personId,
          integrationId: jiraIntegration.id,
        },
      })

      if (jiraLink) {
        jiraAccountId = jiraLink.externalEntityId
      } else if (person.jiraAccount) {
        // Fall back to old PersonJiraAccount for backward compatibility
        jiraAccountId = person.jiraAccount.jiraAccountId
      }

      if (jiraAccountId) {
        // Get integration instance
        const { getIntegration } = await import(
          '@/lib/integrations/integration-factory'
        )
        const integrationInstance = await getIntegration(jiraIntegration.id)

        if (integrationInstance && integrationInstance.getType() === 'jira') {
          const jiraInt =
            integrationInstance as import('@/lib/integrations/jira').JiraIntegration
          const jiraUser = await jiraInt.getUserByAccountId(jiraAccountId)

          if (jiraUser && jiraUser.avatarUrls) {
            // Use the largest available avatar (48x48)
            avatars.jiraAvatar = jiraUser.avatarUrls['48x48']
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch Jira avatar:', error)
      // Continue without Jira avatar
    }
  }

  // Get the organization-level GitHub integration
  const githubIntegration = await prisma.integration.findFirst({
    where: {
      organizationId: user.managerOSOrganizationId,
      integrationType: 'github',
      scope: 'organization',
      isEnabled: true,
    },
    orderBy: { createdAt: 'asc' },
  })

  // For GitHub, we can use the GitHub avatar URL
  if (githubIntegration) {
    // Get GitHub username from EntityIntegrationLink or fall back to PersonGithubAccount
    let githubUsername: string | null = null

    const githubLink = await prisma.entityIntegrationLink.findFirst({
      where: {
        entityType: 'Person',
        entityId: personId,
        integrationId: githubIntegration.id,
      },
    })

    if (githubLink) {
      githubUsername = githubLink.externalEntityId
    } else if (person.githubAccount) {
      // Fall back to old PersonGithubAccount for backward compatibility
      githubUsername = person.githubAccount.githubUsername
    }

    if (githubUsername) {
      // GitHub avatar URL pattern: https://avatars.githubusercontent.com/{username}
      avatars.githubAvatar = `https://avatars.githubusercontent.com/${githubUsername}`
    }
  }

  return avatars
}

/**
 * Upload a team avatar image to R2 storage and return the URL
 */
export async function uploadTeamAvatar(formData: FormData, teamId: string) {
  const user = await getCurrentUser()

  // Check if user is admin
  if (user.role !== 'ADMIN') {
    throw new Error('Only organization admins can upload team avatars')
  }

  // Check if user belongs to an organization
  if (!user.managerOSOrganizationId) {
    throw new Error(
      'User must belong to an organization to upload team avatars'
    )
  }

  // Verify team belongs to user's organization
  const team = await prisma.team.findFirst({
    where: {
      id: teamId,
      organizationId: user.managerOSOrganizationId,
    },
  })

  if (!team) {
    throw new Error('Team not found or access denied')
  }

  // Get the file from form data
  const file = formData.get('file') as File
  if (!file) {
    throw new Error('No file provided')
  }

  // Upload to R2 with specific options for team avatars
  const uploadResult = await uploadFileToR2(file, {
    entityType: 'team',
    entityId: teamId,
    folder: 'avatars',
    maxSizeBytes: 5 * 1024 * 1024, // 5MB max for avatars
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  })

  return uploadResult.r2Url
}

/**
 * Update a team's avatar URL
 */
export async function updateTeamAvatar(
  teamId: string,
  avatarUrl: string | null
) {
  const user = await getCurrentUser()

  // Check if user is admin
  if (user.role !== 'ADMIN') {
    throw new Error('Only organization admins can update team avatars')
  }

  // Check if user belongs to an organization
  if (!user.managerOSOrganizationId) {
    throw new Error(
      'User must belong to an organization to update team avatars'
    )
  }

  // Verify team belongs to user's organization
  const team = await prisma.team.findFirst({
    where: {
      id: teamId,
      organizationId: user.managerOSOrganizationId,
    },
  })

  if (!team) {
    throw new Error('Team not found or access denied')
  }

  // Update the team's avatar
  await prisma.team.update({
    where: { id: teamId },
    data: { avatar: avatarUrl },
  })

  return { success: true }
}
