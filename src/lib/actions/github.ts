'use server'

import { getCurrentUser } from '@/lib/auth-utils'

export interface GitHubIssueData {
  title: string
  description: string
  includeEmail?: boolean
}

export async function submitGitHubIssue(formData: GitHubIssueData) {
  const user = await getCurrentUser()

  // Validate required fields
  if (!formData.title.trim()) {
    throw new Error('Title is required')
  }

  if (!formData.description.trim()) {
    throw new Error('Description is required')
  }

  // Check if GitHub token is configured
  const githubToken = process.env.GITHUB_TOKEN
  if (!githubToken) {
    throw new Error('GitHub integration is not configured')
  }

  // Prepare the issue data
  const submittedBy =
    formData.includeEmail && user.email ? user.email : 'Anonymous user'
  const issueData = {
    title: formData.title.trim(),
    body: `**Submitted by:** ${submittedBy}\n\n**Description:**\n${formData.description.trim()}`,
    labels: ['user-submitted'],
  }

  try {
    // Submit the issue to GitHub
    const response = await fetch(
      'https://api.github.com/repos/kshehadeh/manageros/issues',
      {
        method: 'POST',
        headers: {
          Authorization: `token ${githubToken}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(issueData),
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
      issueUrl: issue.html_url,
      issueTitle: issue.title,
    }
  } catch (error) {
    console.error('Error submitting GitHub issue:', error)
    throw new Error(
      `Failed to submit issue: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}
