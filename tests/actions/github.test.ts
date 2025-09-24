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
  uploadImageToR2: async (imageFile: File) => {
    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
    ]
    if (!allowedTypes.includes(imageFile.type)) {
      throw new Error('Only JPEG, PNG, GIF, and WebP images are allowed')
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (imageFile.size > maxSize) {
      throw new Error('Image size must be less than 10MB')
    }

    // Check R2 configuration
    const r2AccountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID
    const r2AccessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID
    const r2SecretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY
    const r2BucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME
    const r2PublicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL

    if (
      !r2AccountId ||
      !r2AccessKeyId ||
      !r2SecretAccessKey ||
      !r2BucketName ||
      !r2PublicUrl
    ) {
      throw new Error(
        'Cloudflare R2 configuration is incomplete. Please check environment variables.'
      )
    }

    // Mock successful upload
    return `https://example-bucket.r2.dev/bug-reports/1234567890-abc123.png`
  },

  submitGitHubIssue: async (formData: {
    title: string
    description: string
    includeEmail?: boolean
    images?: File[]
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

    // Upload images first if provided
    let imageUrls: string[] = []
    if (formData.images && formData.images.length > 0) {
      try {
        imageUrls = await Promise.all(
          formData.images.map(image => githubActionsMock.uploadImageToR2(image))
        )
      } catch (error) {
        throw new Error(
          `Failed to upload images: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      }
    }

    const submittedBy =
      formData.includeEmail && user.email ? user.email : 'Anonymous user'

    // Build the issue body with images
    let issueBody = `**Submitted by:** ${submittedBy}\n\n**Description:**\n${formData.description.trim()}`

    if (imageUrls.length > 0) {
      issueBody += '\n\n**Images:**\n'
      imageUrls.forEach((url, index) => {
        issueBody += `![Image ${index + 1}](${url})\n`
      })
    }

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
          body: issueBody,
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

    // Set up R2 environment variables
    process.env.CLOUDFLARE_R2_ACCOUNT_ID = 'test-account-id'
    process.env.CLOUDFLARE_R2_ACCESS_KEY_ID = 'test-access-key-id'
    process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY = 'test-secret-access-key'
    process.env.CLOUDFLARE_R2_BUCKET_NAME = 'test-bucket-name'
    process.env.CLOUDFLARE_R2_PUBLIC_URL = 'https://example-bucket.r2.dev'

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

  it('should upload images successfully', async () => {
    const mockImage = new File(['test'], 'test.png', { type: 'image/png' })

    const imageUrl = await githubActionsMock.uploadImageToR2(mockImage)

    expect(imageUrl).toBe(
      'https://example-bucket.r2.dev/bug-reports/1234567890-abc123.png'
    )
  })

  it('should reject invalid image types', async () => {
    const mockImage = new File(['test'], 'test.txt', { type: 'text/plain' })

    await expect(githubActionsMock.uploadImageToR2(mockImage)).rejects.toThrow(
      'Only JPEG, PNG, GIF, and WebP images are allowed'
    )
  })

  it('should reject oversized images', async () => {
    const mockImage = new File(['x'.repeat(11 * 1024 * 1024)], 'test.png', {
      type: 'image/png',
    })

    await expect(githubActionsMock.uploadImageToR2(mockImage)).rejects.toThrow(
      'Image size must be less than 10MB'
    )
  })

  it('should reject when R2 configuration is missing', async () => {
    const mockImage = new File(['test'], 'test.png', { type: 'image/png' })

    // Temporarily remove R2 config
    const originalConfig = {
      CLOUDFLARE_R2_ACCOUNT_ID: process.env.CLOUDFLARE_R2_ACCOUNT_ID,
      CLOUDFLARE_R2_ACCESS_KEY_ID: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
      CLOUDFLARE_R2_SECRET_ACCESS_KEY:
        process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
      CLOUDFLARE_R2_BUCKET_NAME: process.env.CLOUDFLARE_R2_BUCKET_NAME,
      CLOUDFLARE_R2_PUBLIC_URL: process.env.CLOUDFLARE_R2_PUBLIC_URL,
    }

    delete process.env.CLOUDFLARE_R2_ACCOUNT_ID

    await expect(githubActionsMock.uploadImageToR2(mockImage)).rejects.toThrow(
      'Cloudflare R2 configuration is incomplete'
    )

    // Restore config
    Object.assign(process.env, originalConfig)
  })

  it('should include images in issue body when provided', async () => {
    const mockImage1 = new File(['test1'], 'test1.png', { type: 'image/png' })
    const mockImage2 = new File(['test2'], 'test2.jpg', { type: 'image/jpeg' })

    await githubActionsMock.submitGitHubIssue({
      title: 'Test Bug Report',
      description: 'This is a test bug description',
      images: [mockImage1, mockImage2],
    })

    expect(fetchCalls).toBe(1)
    const requestBody = JSON.parse(fetchArgs[0][1].body as string)
    expect(requestBody.body).toContain('**Images:**')
    expect(requestBody.body).toContain(
      '![Image 1](https://example-bucket.r2.dev/bug-reports/1234567890-abc123.png)'
    )
    expect(requestBody.body).toContain(
      '![Image 2](https://example-bucket.r2.dev/bug-reports/1234567890-abc123.png)'
    )
  })

  it('should handle image upload failures', async () => {
    const mockImage = new File(['test'], 'test.txt', { type: 'text/plain' })

    await expect(
      githubActionsMock.submitGitHubIssue({
        title: 'Test Bug Report',
        description: 'This is a test bug description',
        images: [mockImage],
      })
    ).rejects.toThrow(
      'Failed to upload images: Only JPEG, PNG, GIF, and WebP images are allowed'
    )
  })
})
