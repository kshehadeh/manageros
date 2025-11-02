'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/auth-utils'
import { encrypt } from '@/lib/encryption'
import { GithubApiService } from '@/lib/github-api'

export async function saveGithubCredentials(formData: {
  githubUsername: string
  githubPat: string
}) {
  const user = await getCurrentUser()

  if (!user.organizationId) {
    throw new Error('User must belong to an organization to configure GitHub')
  }

  // Test the connection before saving
  const githubService = new GithubApiService({
    username: formData.githubUsername,
    pat: formData.githubPat,
  })

  const isConnected = await githubService.testConnection()
  if (!isConnected) {
    throw new Error(
      'Failed to connect to GitHub. Please check your credentials.'
    )
  }

  // Encrypt the PAT
  const encryptedPat = encrypt(formData.githubPat)

  // Upsert the credentials
  await prisma.userGithubCredentials.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
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
    where: { userId: user.id },
    select: {
      githubUsername: true,
    },
  })

  return credentials
}

export async function deleteGithubCredentials() {
  const user = await getCurrentUser()

  await prisma.userGithubCredentials.delete({
    where: { userId: user.id },
  })

  revalidatePath('/settings')
  return { success: true }
}

export async function linkPersonToGithubAccount(
  personId: string,
  githubUsername: string
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

  // Get user's GitHub credentials
  const credentials = await prisma.userGithubCredentials.findUnique({
    where: { userId: user.id },
  })

  if (!credentials) {
    throw new Error('GitHub credentials not configured')
  }

  // Search for GitHub user by username
  const githubService = GithubApiService.fromEncryptedCredentials(
    credentials.githubUsername,
    credentials.encryptedPat
  )

  const githubUser = await githubService.getUserByUsername(githubUsername)

  if (!githubUser) {
    throw new Error(`No GitHub user found with username: ${githubUsername}`)
  }

  // Create or update the link
  await prisma.personGithubAccount.upsert({
    where: { personId },
    create: {
      personId,
      githubUsername: githubUser.login,
      githubDisplayName: githubUser.name,
      githubEmail: githubUser.email,
    },
    update: {
      githubUsername: githubUser.login,
      githubDisplayName: githubUser.name,
      githubEmail: githubUser.email,
    },
  })

  revalidatePath(`/people/${personId}`)
  return { success: true }
}

export async function unlinkPersonFromGithubAccount(personId: string) {
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

export async function uploadImageToR2(file: File): Promise<string> {
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
      githubAccount: true,
    },
  })

  if (!person) {
    throw new Error('Person not found or access denied')
  }

  if (!person.githubAccount) {
    return { success: false, error: 'No GitHub account linked' }
  }

  // Get user's GitHub credentials
  const credentials = await prisma.userGithubCredentials.findUnique({
    where: { userId: user.id },
  })

  if (!credentials) {
    throw new Error('GitHub credentials not configured')
  }

  // Get allowed GitHub organizations for filtering
  const githubOrgs = await prisma.organizationGithubOrg.findMany({
    where: {
      organizationId: user.organizationId,
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
    // Fetch recent pull requests
    const githubService = GithubApiService.fromEncryptedCredentials(
      credentials.githubUsername,
      credentials.encryptedPat
    )

    const pullRequests = await githubService.getRecentPullRequests(
      person.githubAccount.githubUsername,
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
      githubAccount: true,
    },
  })

  if (!person) {
    throw new Error('Person not found or access denied')
  }

  if (!person.githubAccount) {
    throw new Error('Person is not linked to a GitHub account')
  }

  // Get user's GitHub credentials
  const credentials = await prisma.userGithubCredentials.findUnique({
    where: { userId: user.id },
  })

  if (!credentials) {
    throw new Error('GitHub credentials not configured')
  }

  // Get allowed GitHub organizations for filtering
  const githubOrgs = await prisma.organizationGithubOrg.findMany({
    where: {
      organizationId: user.organizationId,
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
    // Fetch recent pull requests
    const githubService = GithubApiService.fromEncryptedCredentials(
      credentials.githubUsername,
      credentials.encryptedPat
    )

    const pullRequests = await githubService.getRecentPullRequests(
      person.githubAccount.githubUsername,
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
    throw error instanceof Error
      ? error
      : new Error('Failed to fetch GitHub metrics')
  }
}
