import { decrypt } from './encryption'

export interface GithubUser {
  login: string
  id: number
  name: string | null
  email: string | null
  avatarUrl: string
  htmlUrl: string
}

export interface GithubPullRequest {
  id: number
  number: number
  title: string
  state: string
  draft: boolean
  htmlUrl: string
  createdAt: string
  updatedAt: string
  closedAt: string | null
  mergedAt: string | null
  repository: {
    name: string
    fullName: string
    htmlUrl: string
  }
  author: {
    login: string
    avatarUrl: string
  }
}

export interface GithubCredentials {
  username: string
  pat: string
}

export class GithubApiService {
  private credentials: GithubCredentials

  constructor(credentials: GithubCredentials) {
    this.credentials = credentials
  }

  static fromEncryptedCredentials(
    username: string,
    encryptedPat: string
  ): GithubApiService {
    const pat = decrypt(encryptedPat)
    return new GithubApiService({ username, pat })
  }

  private async makeRequest(endpoint: string): Promise<unknown> {
    const response = await fetch(`https://api.github.com${endpoint}`, {
      headers: {
        Authorization: `token ${this.credentials.pat}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'ManagerOS/1.0',
      },
    })

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid GitHub credentials')
      }
      if (response.status === 403) {
        throw new Error(
          'GitHub API rate limit exceeded or insufficient permissions'
        )
      }
      throw new Error(
        `GitHub API error: ${response.status} ${response.statusText}`
      )
    }

    return response.json()
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.makeRequest('/user')
      return true
    } catch (error) {
      console.error('GitHub connection test failed:', error)
      return false
    }
  }

  async getUserByUsername(username: string): Promise<GithubUser | null> {
    try {
      const user = (await this.makeRequest(`/users/${username}`)) as Record<
        string,
        unknown
      >
      return {
        login: user.login as string,
        id: user.id as number,
        name: user.name as string | null,
        email: user.email as string | null,
        avatarUrl: user.avatar_url as string,
        htmlUrl: user.html_url as string,
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null
      }
      throw error
    }
  }

  async getCurrentUser(): Promise<GithubUser> {
    const user = (await this.makeRequest('/user')) as Record<string, unknown>
    return {
      login: user.login as string,
      id: user.id as number,
      name: user.name as string | null,
      email: user.email as string | null,
      avatarUrl: user.avatar_url as string,
      htmlUrl: user.html_url as string,
    }
  }

  async getRecentPullRequests(
    username: string,
    daysBack: number = 30
  ): Promise<GithubPullRequest[]> {
    const since = new Date()
    since.setDate(since.getDate() - daysBack)
    const sinceISO = since.toISOString()

    const response = await fetch(
      `https://api.github.com/search/issues?q=author:${username}+type:pr+created:>${sinceISO}&sort=updated&order=desc&per_page=20`,
      {
        headers: {
          Authorization: `token ${this.credentials.pat}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'ManagerOS/1.0',
        },
      }
    )

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid GitHub credentials')
      }
      if (response.status === 403) {
        throw new Error(
          'GitHub API rate limit exceeded or insufficient permissions'
        )
      }
      throw new Error(
        `GitHub API error: ${response.status} ${response.statusText}`
      )
    }

    const data = (await response.json()) as Record<string, unknown>
    const issues = data.items as Record<string, unknown>[]

    // Fetch detailed PR information for each issue
    const pullRequests: GithubPullRequest[] = []

    for (const issue of issues) {
      try {
        const prNumber = issue.number as number
        const repoUrl = issue.repository_url as string
        const repoMatch = repoUrl.match(/\/repos\/([^\/]+)\/([^\/]+)$/)

        if (!repoMatch) continue

        const [, owner, repo] = repoMatch
        const pr = (await this.makeRequest(
          `/repos/${owner}/${repo}/pulls/${prNumber}`
        )) as Record<string, unknown>
        const prHead = pr.head as Record<string, unknown> | undefined
        const prUser = pr.user as Record<string, unknown> | undefined
        const prHeadRepo = prHead?.repo as Record<string, unknown> | undefined

        pullRequests.push({
          id: pr.id as number,
          number: pr.number as number,
          title: pr.title as string,
          state: pr.state as string,
          draft: pr.draft as boolean,
          htmlUrl: pr.html_url as string,
          createdAt: pr.created_at as string,
          updatedAt: pr.updated_at as string,
          closedAt: pr.closed_at as string | null,
          mergedAt: pr.merged_at as string | null,
          repository: {
            name: (prHeadRepo?.name as string) || repo,
            fullName: `${owner}/${repo}`,
            htmlUrl: `https://github.com/${owner}/${repo}`,
          },
          author: {
            login: (prUser?.login as string) || username,
            avatarUrl: (prUser?.avatar_url as string) || '',
          },
        })
      } catch (error) {
        console.warn('Failed to fetch PR details:', error)
        // Continue with other PRs
      }
    }

    return pullRequests
  }
}
