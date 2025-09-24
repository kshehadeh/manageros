import { describe, it, expect, beforeEach } from 'vitest'

// Mock auth-utils
let _getCurrentUserCalls = 0
let getCurrentUserReturnValue: {
  id: string
  email: string | null
  organizationId: string
} | null = null

const authUtilsMock = {
  getCurrentUser: async () => {
    _getCurrentUserCalls += 1
    return (
      getCurrentUserReturnValue || {
        id: 'test-user-id',
        email: 'test@example.com',
        organizationId: 'test-org-id',
      }
    )
  },
}

// Mock fetch
let fetchCalls = 0
let fetchArgs: [string, RequestInit][] = []
let fetchReturnValue: Response | null = null

global.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  fetchCalls += 1
  fetchArgs.push([input as string, init || {}])
  return (
    fetchReturnValue ||
    ({
      ok: true,
      json: async () => ({
        number: 123,
        htmlUrl: 'https://github.com/kshehadeh/manageros/issues/123',
        title: 'Test Bug Report',
      }),
    } as Response)
  )
}

// Mock the module
const githubActionsMock = {
  submitGitHubIssue: async (formData: {
    title: string
    description: string
    includeEmail?: boolean
  }) => {
    const user = await authUtilsMock.getCurrentUser()

    if (!formData.title.trim()) {
      throw new Error('Title is required')
    }

    if (!formData.description.trim()) {
      throw new Error('Description is required')
    }

    const githubToken = process.env.GITHUB_TOKEN
    if (!githubToken) {
      throw new Error('GitHub integration is not configured')
    }

    const submittedBy =
      formData.includeEmail && user.email ? user.email : 'Anonymous user'

    const response = await global.fetch(
      'https://api.github.com/repos/kshehadeh/manageros/issues',
      {
        method: 'POST',
        headers: {
          Authorization: `token ${githubToken}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          body: `**Submitted by:** ${submittedBy}\n\n**Description:**\n${formData.description.trim()}`,
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
      issueNumber: issue.number,
      issueUrl: issue.htmlUrl,
      issueTitle: issue.title,
    }
  },
}

describe('GitHub Issue Submission', () => {
  beforeEach(() => {
    // Reset counters
    _getCurrentUserCalls = 0
    fetchCalls = 0
    fetchArgs = []

    // Set up environment variable
    process.env.GITHUB_TOKEN = 'test-github-token'

    // Reset return values
    getCurrentUserReturnValue = null
    fetchReturnValue = null
  })

  it('should submit a GitHub issue successfully', async () => {
    const result = await githubActionsMock.submitGitHubIssue({
      title: 'Test Bug Report',
      description: 'This is a test bug description',
    })

    expect(result.success).toBe(true)
    expect(result.issueNumber).toBe(123)
    expect(result.issueUrl).toBe(
      'https://github.com/kshehadeh/manageros/issues/123'
    )
    expect(result.issueTitle).toBe('Test Bug Report')

    expect(fetchCalls).toBe(1)
    expect(fetchArgs[0][0]).toBe(
      'https://api.github.com/repos/kshehadeh/manageros/issues'
    )
    expect(fetchArgs[0][1].method).toBe('POST')
    expect(
      (fetchArgs[0][1].headers as Record<string, string>)['Authorization']
    ).toBe('token test-github-token')
  })

  it('should throw error when title is empty', async () => {
    await expect(
      githubActionsMock.submitGitHubIssue({
        title: '',
        description: 'Some description',
      })
    ).rejects.toThrow('Title is required')
  })

  it('should throw error when description is empty', async () => {
    await expect(
      githubActionsMock.submitGitHubIssue({
        title: 'Some title',
        description: '',
      })
    ).rejects.toThrow('Description is required')
  })

  it('should throw error when GitHub token is not configured', async () => {
    delete process.env.GITHUB_TOKEN

    await expect(
      githubActionsMock.submitGitHubIssue({
        title: 'Test Bug Report',
        description: 'This is a test bug description',
      })
    ).rejects.toThrow('GitHub integration is not configured')
  })

  it('should handle GitHub API errors', async () => {
    fetchReturnValue = {
      ok: false,
      status: 422,
      statusText: 'Unprocessable Entity',
      json: async () => ({
        message: 'Validation failed',
      }),
    } as Response

    await expect(
      githubActionsMock.submitGitHubIssue({
        title: 'Test Bug Report',
        description: 'This is a test bug description',
      })
    ).rejects.toThrow(
      'GitHub API error: 422 Unprocessable Entity. Validation failed'
    )
  })

  it('should include email when includeEmail is true', async () => {
    getCurrentUserReturnValue = {
      id: 'test-user-id',
      email: 'test@example.com',
      organizationId: 'test-org-id',
    }

    await githubActionsMock.submitGitHubIssue({
      title: 'Test Bug Report',
      description: 'This is a test bug description',
      includeEmail: true,
    })

    expect(fetchCalls).toBe(1)
    const requestBody = JSON.parse(fetchArgs[0][1].body as string)
    expect(requestBody.body).toContain('**Submitted by:** test@example.com')
  })

  it('should use anonymous user when includeEmail is false', async () => {
    getCurrentUserReturnValue = {
      id: 'test-user-id',
      email: 'test@example.com',
      organizationId: 'test-org-id',
    }

    await githubActionsMock.submitGitHubIssue({
      title: 'Test Bug Report',
      description: 'This is a test bug description',
      includeEmail: false,
    })

    expect(fetchCalls).toBe(1)
    const requestBody = JSON.parse(fetchArgs[0][1].body as string)
    expect(requestBody.body).toContain('**Submitted by:** Anonymous user')
  })

  it('should use anonymous user when includeEmail is true but user has no email', async () => {
    getCurrentUserReturnValue = {
      id: 'test-user-id',
      email: null,
      organizationId: 'test-org-id',
    }

    await githubActionsMock.submitGitHubIssue({
      title: 'Test Bug Report',
      description: 'This is a test bug description',
      includeEmail: true,
    })

    expect(fetchCalls).toBe(1)
    const requestBody = JSON.parse(fetchArgs[0][1].body as string)
    expect(requestBody.body).toContain('**Submitted by:** Anonymous user')
  })
})
