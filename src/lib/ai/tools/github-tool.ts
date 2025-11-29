import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth-utils'
import { prisma } from '@/lib/db'
import { GithubApiService } from '@/lib/github-api'
import { decrypt } from '@/lib/encryption'

interface GitHubIssue {
  id: number
  number: number
  title: string
  state: string
  html_url: string
  created_at: string
  updated_at: string
  closed_at?: string
  repository_url: string
  user: {
    login: string
    avatar_url: string
  }
  labels: Array<{
    name: string
    color: string
  }>
  assignees: Array<{
    login: string
    avatar_url: string
  }>
  pull_request?: {
    url: string
    html_url: string
    diff_url: string
    patch_url: string
  }
}

export const githubTool = {
  description:
    "Search GitHub pull requests and issues using GitHub API. IMPORTANT: When the user asks about 'my PRs', 'my pull requests', 'my issues', or anything related to their own work, DO NOT provide a personId - the tool will automatically use the current user's linked GitHub account. Only provide personId when searching for another specific person's GitHub activity.",
  parameters: z.object({
    query: z
      .string()
      .describe(
        'Search query for GitHub PRs/issues. Must include "is:pr" (for pull requests) or "is:issue" (for issues). If not specified, defaults to "is:pr". Additional search terms can be added (e.g., "is:pr merged", "is:issue label:bug"). IMPORTANT: Do NOT include author:, involves:, or other username qualifiers - the tool will automatically add the correct GitHub username based on the person being searched.'
      ),
    personId: z
      .string()
      .optional()
      .describe(
        "Person ID to lookup their GitHub account and search for their activity. ONLY use this when searching for ANOTHER person's activity (not the current user). If omitted, automatically uses the current user's linked GitHub account."
      ),
    repository: z
      .string()
      .optional()
      .describe('Specific repository to search in (format: owner/repo)'),
    state: z
      .enum(['open', 'closed', 'all'])
      .optional()
      .describe('Filter by PR/issue state'),
    limit: z
      .number()
      .min(1)
      .max(50)
      .optional()
      .describe('Maximum number of results to return (default: 20)'),
  }),
  execute: async ({
    query,
    personId,
    repository,
    state = 'all',
    limit = 20,
  }: {
    query: string
    personId?: string
    repository?: string
    state?: 'open' | 'closed' | 'all'
    limit?: number
  }) => {
    console.log('🔧 githubTool called with parameters:', {
      query,
      personId,
      repository,
      state,
      limit,
    })
    try {
      const user = await getCurrentUser()
      if (!user.managerOSOrganizationId) {
        throw new Error(
          'User must belong to an organization to use GitHub integration'
        )
      }

      // Get user's GitHub credentials
      const credentials = await prisma.userGithubCredentials.findUnique({
        where: { userId: user.managerOSUserId },
      })

      if (!credentials) {
        throw new Error(
          'GitHub credentials not configured. Please set up GitHub integration in Settings.'
        )
      }

      // Create GitHub API service
      const githubService = GithubApiService.fromEncryptedCredentials(
        credentials.githubUsername,
        credentials.encryptedPat
      )

      // Test connection (throws on failure)
      await githubService.testConnection()

      // Determine which person to search for
      let targetPersonId = personId

      // If no personId provided, try to use current user's linked person
      if (!targetPersonId) {
        if (user.managerOSPersonId) {
          targetPersonId = user.managerOSPersonId
        }
      }

      // If we have a personId (either provided or from current user), lookup their GitHub account
      let githubUsername: string | null = null
      if (targetPersonId) {
        // Verify person belongs to user's organization and get their GitHub account
        const person = await prisma.person.findFirst({
          where: {
            id: targetPersonId,
            organizationId: user.managerOSOrganizationId,
          },
          include: {
            githubAccount: true,
          },
        })

        if (!person) {
          throw new Error('Person not found or access denied')
        }

        if (!person.githubAccount) {
          const personName =
            targetPersonId === user.managerOSPersonId ? 'You' : person.name
          throw new Error(
            `${personName} do not have a GitHub account linked. Please link a GitHub account first in Settings.`
          )
        }

        githubUsername = person.githubAccount.githubUsername

        console.log('🔧 GitHub username resolved:', {
          githubUsername,
          personName: person.name,
        })
        // Validate GitHub username format (alphanumeric and hyphens only)
        if (!/^[a-zA-Z0-9-]+$/.test(githubUsername)) {
          throw new Error(
            `Invalid GitHub username "${githubUsername}" for ${person.name}. GitHub usernames can only contain letters, numbers, and hyphens. Please update the linked GitHub account.`
          )
        }
      }

      // Build search query
      let searchQuery = query.trim()

      // If personId is provided, remove any user-related qualifiers from the query
      // since we'll add the correct username ourselves
      if (githubUsername) {
        // Remove any author:, involves:, assignee:, mentions:, commenter: qualifiers
        searchQuery = searchQuery
          .replace(
            /\b(author|involves|assignee|mentions|commenter):[^\s]+/g,
            ''
          )
          .trim()
      }

      // Ensure query has a type specifier (is:pr or is:issue)
      // If not specified, default to pull requests
      if (!searchQuery.includes('is:pr') && !searchQuery.includes('is:issue')) {
        searchQuery = `is:pr ${searchQuery}`
      }

      // Add GitHub username filter if personId was provided
      if (githubUsername) {
        // Use 'author:' for PRs/issues created by the user
        // Username is already validated to only contain alphanumeric chars and hyphens
        searchQuery += ` author:${githubUsername}`
      }

      // Add repository filter if specified
      if (repository) {
        searchQuery += ` repo:${repository}`
      }

      // Add state filter
      if (state !== 'all') {
        searchQuery += ` is:${state}`
      }

      // Decrypt the PAT
      const decryptedPat = decrypt(credentials.encryptedPat)

      // Make search request to GitHub API
      const response = await fetch(
        `https://api.github.com/search/issues?q=${encodeURIComponent(searchQuery)}&sort=updated&order=desc&per_page=${limit}`,
        {
          headers: {
            Authorization: `token ${decryptedPat}`,
            Accept: 'application/vnd.github.v3+json',
            'User-Agent': 'ManagerOS/1.0',
          },
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.message || response.statusText

        if (response.status === 401) {
          throw new Error('Invalid GitHub credentials')
        }
        if (response.status === 403) {
          throw new Error(
            'GitHub API rate limit exceeded or insufficient permissions'
          )
        }
        if (response.status === 422) {
          throw new Error(
            `GitHub search query is invalid: ${errorMessage}. Query used: "${searchQuery}"`
          )
        }
        throw new Error(
          `GitHub API error: ${response.status} ${response.statusText}. ${errorMessage}`
        )
      }

      const data = await response.json()
      const issues = data.items || []

      // Process results
      const results = issues.map((issue: GitHubIssue) => ({
        id: issue.id,
        number: issue.number,
        title: issue.title,
        state: issue.state,
        htmlUrl: issue.html_url,
        createdAt: issue.created_at,
        updatedAt: issue.updated_at,
        closedAt: issue.closed_at,
        repository: {
          name: issue.repository_url?.split('/').pop() || 'Unknown',
          fullName:
            issue.repository_url?.split('/').slice(-2).join('/') || 'Unknown',
          htmlUrl:
            issue.repository_url?.replace(
              'api.github.com/repos',
              'github.com'
            ) || '',
        },
        author: {
          login: issue.user?.login || 'Unknown',
          avatarUrl: issue.user?.avatar_url || '',
        },
        labels:
          issue.labels?.map(label => ({
            name: label.name,
            color: label.color,
          })) || [],
        assignees:
          issue.assignees?.map(assignee => ({
            login: assignee.login,
            avatarUrl: assignee.avatar_url,
          })) || [],
        pullRequest: issue.pull_request
          ? {
              url: issue.pull_request.url,
              htmlUrl: issue.pull_request.html_url,
              diffUrl: issue.pull_request.diff_url,
              patchUrl: issue.pull_request.patch_url,
            }
          : null,
      }))

      return {
        totalCount: data.total_count,
        results,
        searchQuery,
        githubUsername: githubUsername || undefined,
        repository: repository || 'All repositories',
        state,
      }
    } catch (error) {
      console.error('Error in GitHub tool:', error)
      throw error
    }
  },
}
