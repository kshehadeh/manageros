'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/auth-utils'
import { encrypt } from '@/lib/encryption'
import { GithubApiService } from '@/lib/github-api'
import type { Prisma } from '@/generated/prisma'

export async function saveGithubCredentials(formData: {
  githubUsername: string
  githubPat: string
}) {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization to configure GitHub')
  }

  // Test the connection before saving
  const githubService = new GithubApiService({
    username: formData.githubUsername,
    pat: formData.githubPat,
  })

  try {
    await githubService.testConnection()
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? error.message
        : 'Failed to connect to GitHub. Please check your credentials.'
    )
  }

  // Encrypt the PAT
  const encryptedPat = encrypt(formData.githubPat)

  // Upsert the credentials
  await prisma.userGithubCredentials.upsert({
    where: { userId: user.managerOSUserId || '' },
    create: {
      userId: user.managerOSUserId || '',
      githubUsername: formData.githubUsername,
      encryptedPat,
    },
    update: {
      githubUsername: formData.githubUsername,
      encryptedPat,
    },
  })

  revalidatePath('/settings')
  return { success: true }
}

export async function getGithubCredentials() {
  const user = await getCurrentUser()

  const credentials = await prisma.userGithubCredentials.findUnique({
    where: { userId: user.managerOSUserId || '' },
    select: {
      githubUsername: true,
    },
  })

  return credentials
}

export async function deleteGithubCredentials() {
  const user = await getCurrentUser()

  await prisma.userGithubCredentials.delete({
    where: { userId: user.managerOSUserId || '' },
  })

  revalidatePath('/settings')
  return { success: true }
}

export async function linkPersonToGithubAccount(
  personId: string,
  githubUsername: string
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

  // Get the first organization-level GitHub integration
  const orgIntegration = await prisma.integration.findFirst({
    where: {
      organizationId: user.managerOSOrganizationId,
      integrationType: 'github',
      scope: 'organization',
      isEnabled: true,
    },
    orderBy: { createdAt: 'asc' }, // Use the first one created
  })

  if (!orgIntegration) {
    throw new Error(
      'Organization GitHub integration not configured. Please contact your administrator.'
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

  // Search for GitHub user by username using the integration
  if (integrationInstance.getType() !== 'github') {
    throw new Error('Invalid integration type')
  }

  // Use the integration's searchEntities method to find users
  const searchResults = await integrationInstance.searchEntities({
    query: githubUsername,
  })

  if (searchResults.length === 0) {
    throw new Error(`No GitHub user found with username: ${githubUsername}`)
  }

  const githubUserResult = searchResults[0]
  const githubLogin = githubUserResult.id
  const githubDisplayName = githubUserResult.title || githubUsername
  const githubEmail = githubUserResult.description || null

  // Check if link already exists
  const existingLink = await prisma.entityIntegrationLink.findFirst({
    where: {
      entityType: 'Person',
      entityId: personId,
      integrationId: orgIntegration.id,
      externalEntityId: githubLogin,
    },
  })

  if (existingLink) {
    // Update existing link
    await prisma.entityIntegrationLink.update({
      where: { id: existingLink.id },
      data: {
        metadata: {
          githubDisplayName: githubDisplayName,
          githubEmail: githubEmail,
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
        externalEntityId: githubLogin,
        externalEntityUrl:
          githubUserResult.url || `https://github.com/${githubLogin}`,
        metadata: {
          githubDisplayName: githubDisplayName,
          githubEmail: githubEmail,
        } as unknown as Prisma.InputJsonValue,
      },
    })
  }

  // Also update the old PersonGithubAccount table for backward compatibility
  await prisma.personGithubAccount.upsert({
    where: { personId },
    create: {
      personId,
      githubUsername: githubLogin,
      githubDisplayName: githubDisplayName,
      githubEmail: githubEmail,
    },
    update: {
      githubUsername: githubLogin,
      githubDisplayName: githubDisplayName,
      githubEmail: githubEmail,
    },
  })

  revalidatePath(`/people/${personId}`)
  return { success: true }
}

export async function unlinkPersonFromGithubAccount(personId: string) {
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

  // Delete the GitHub account link
  await prisma.personGithubAccount.delete({
    where: { personId },
  })

  revalidatePath(`/people/${personId}`)
  return { success: true }
}

export async function submitGitHubIssue(formData: {
  title: string
  description: string
  images?: string[]
  includeEmail?: boolean
}) {
  const githubToken = process.env.GITHUB_TOKEN

  if (!githubToken) {
    throw new Error('GitHub integration is not configured')
  }

  if (!formData.title.trim()) {
    throw new Error('Title is required')
  }

  if (!formData.description.trim()) {
    throw new Error('Description is required')
  }

  // Get current user for email inclusion
  const user = await getCurrentUser()
  const userEmail = formData.includeEmail ? user.email : 'Anonymous user'

  // Build issue body
  let body = formData.description

  if (formData.images && formData.images.length > 0) {
    body += '\n\n## Images\n\n'
    formData.images.forEach(imageUrl => {
      body += `![Image](${imageUrl})\n\n`
    })
  }

  body += `\n\n---\nSubmitted by: ${userEmail}`

  // Create GitHub issue
  const response = await fetch(
    'https://api.github.com/repos/kshehadeh/manageros/issues',
    {
      method: 'POST',
      headers: {
        Authorization: `token ${githubToken}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: formData.title,
        body,
        labels: ['user-submitted'],
      }),
    }
  )

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(
      `GitHub API error: ${response.status} ${response.statusText}. ${errorData.message || ''}`
    )
  }

  const issue = await response.json()
  return {
    success: true,
    issueUrl: issue.html_url,
    issueNumber: issue.number,
    issueTitle: issue.title,
  }
}

async function uploadImageToR2(file: File): Promise<string> {
  const { uploadFileToR2 } = await import('@/lib/r2-upload')

  const result = await uploadFileToR2(file, {
    entityType: 'BugReport',
    entityId: 'github-issues',
    folder: 'bug-reports',
    maxSizeBytes: 10 * 1024 * 1024, // 10MB for bug reports
    allowedMimeTypes: ['image/*'],
  })

  return result.r2Url
}

export async function fetchGithubPullRequests(
  personId: string,
  daysBack: number = 30
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
    include: {
      githubAccount: true,
    },
  })

  if (!person) {
    throw new Error('Person not found or access denied')
  }

  // Get the first organization-level GitHub integration
  const orgIntegration = await prisma.integration.findFirst({
    where: {
      organizationId: user.managerOSOrganizationId,
      integrationType: 'github',
      scope: 'organization',
      isEnabled: true,
    },
    orderBy: { createdAt: 'asc' },
  })

  if (!orgIntegration) {
    return {
      success: false,
      error:
        'Organization GitHub integration not configured. Please contact your administrator.',
    }
  }

  // Get GitHub username from EntityIntegrationLink or fall back to PersonGithubAccount
  let githubUsername: string | null = null

  const integrationLink = await prisma.entityIntegrationLink.findFirst({
    where: {
      entityType: 'Person',
      entityId: personId,
      integrationId: orgIntegration.id,
    },
  })

  if (integrationLink) {
    githubUsername = integrationLink.externalEntityId
  } else if (person.githubAccount) {
    // Fall back to old PersonGithubAccount for backward compatibility
    githubUsername = person.githubAccount.githubUsername
  }

  if (!githubUsername) {
    return { success: false, error: 'No GitHub account linked' }
  }

  // Get allowed GitHub organizations for filtering
  const githubOrgs = await prisma.organizationGithubOrg.findMany({
    where: {
      organizationId: user.managerOSOrganizationId,
    },
    select: {
      githubOrgName: true,
    },
  })

  const allowedOrganizations =
    githubOrgs.length > 0
      ? githubOrgs.map((org: { githubOrgName: string }) => org.githubOrgName)
      : undefined

  try {
    // Get integration instance
    const { getIntegration } = await import(
      '@/lib/integrations/integration-factory'
    )
    const integrationInstance = await getIntegration(orgIntegration.id)

    if (!integrationInstance || integrationInstance.getType() !== 'github') {
      throw new Error('Failed to create GitHub integration instance')
    }

    const githubIntegration =
      integrationInstance as import('@/lib/integrations/github').GithubIntegration

    // Fetch recent pull requests using the integration
    const pullRequests = await githubIntegration.getUserPullRequests(
      githubUsername,
      daysBack,
      allowedOrganizations
    )

    return { success: true, pullRequests }
  } catch (error) {
    console.error('Failed to fetch GitHub pull requests:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to fetch pull requests',
    }
  }
}

export async function fetchGithubMetrics(
  personId: string,
  daysBack: number = 30
): Promise<
  | {
      success: true
      metrics: { openPrs: number; mergedPrs: number; total: number }
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
        githubAccount: true,
      },
    })

    if (!person) {
      return { success: false, error: 'Person not found or access denied' }
    }

    // Get the first organization-level GitHub integration
    const orgIntegration = await prisma.integration.findFirst({
      where: {
        organizationId: user.managerOSOrganizationId,
        integrationType: 'github',
        scope: 'organization',
        isEnabled: true,
      },
      orderBy: { createdAt: 'asc' },
    })

    if (!orgIntegration) {
      return {
        success: false,
        error:
          'Organization GitHub integration not configured. Please contact your administrator.',
      }
    }

    // Get GitHub username from EntityIntegrationLink or fall back to PersonGithubAccount
    let githubUsername: string | null = null

    const integrationLink = await prisma.entityIntegrationLink.findFirst({
      where: {
        entityType: 'Person',
        entityId: personId,
        integrationId: orgIntegration.id,
      },
    })

    if (integrationLink) {
      githubUsername = integrationLink.externalEntityId
    } else if (person.githubAccount) {
      // Fall back to old PersonGithubAccount for backward compatibility
      githubUsername = person.githubAccount.githubUsername
    }

    if (!githubUsername) {
      return {
        success: false,
        error: 'Person is not linked to a GitHub account',
      }
    }

    // Get allowed GitHub organizations for filtering
    const githubOrgs = await prisma.organizationGithubOrg.findMany({
      where: {
        organizationId: user.managerOSOrganizationId,
      },
      select: {
        githubOrgName: true,
      },
    })

    const allowedOrganizations =
      githubOrgs.length > 0
        ? githubOrgs.map((org: { githubOrgName: string }) => org.githubOrgName)
        : undefined

    // Get integration instance
    const { getIntegration } = await import(
      '@/lib/integrations/integration-factory'
    )
    const integrationInstance = await getIntegration(orgIntegration.id)

    if (!integrationInstance || integrationInstance.getType() !== 'github') {
      return {
        success: false,
        error: 'Failed to create GitHub integration instance',
      }
    }

    const githubIntegration =
      integrationInstance as import('@/lib/integrations/github').GithubIntegration

    // Fetch recent pull requests using the integration
    const pullRequests = await githubIntegration.getUserPullRequests(
      githubUsername,
      daysBack,
      allowedOrganizations
    )

    // Calculate date threshold for merged PRs (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - daysBack)

    // Categorize PRs
    let openPrs = 0
    let mergedPrs = 0

    for (const pr of pullRequests) {
      // Count open PRs (state === 'open')
      if (pr.state === 'open') {
        openPrs++
      }
      // Count merged PRs that were merged in the last 30 days
      // mergedAt is set when a PR is merged, regardless of state
      if (pr.mergedAt) {
        const mergedDate = new Date(pr.mergedAt)
        if (mergedDate >= thirtyDaysAgo) {
          mergedPrs++
        }
      }
    }

    return {
      success: true,
      metrics: {
        openPrs,
        mergedPrs,
        total: pullRequests.length,
      },
    }
  } catch (error) {
    console.error('Failed to fetch GitHub metrics:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to fetch GitHub metrics',
    }
  }
}
