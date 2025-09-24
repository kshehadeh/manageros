'use server'

import { getCurrentUser } from '@/lib/auth-utils'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

export interface GitHubIssueData {
  title: string
  description: string
  includeEmail?: boolean
  images?: File[]
}

export async function uploadImageToR2(imageFile: File): Promise<string> {
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

  // Generate unique filename
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 15)
  const fileExtension = imageFile.name.split('.').pop() || 'jpg'
  const fileName = `bug-reports/${timestamp}-${randomString}.${fileExtension}`

  // Convert File to Buffer
  const arrayBuffer = await imageFile.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // Create S3 client for Cloudflare R2
  const s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${r2AccountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: r2AccessKeyId,
      secretAccessKey: r2SecretAccessKey,
    },
  })

  // Upload to R2 using S3-compatible API
  const command = new PutObjectCommand({
    Bucket: r2BucketName,
    Key: fileName,
    Body: buffer,
    ContentType: imageFile.type,
  })

  try {
    await s3Client.send(command)

    // Return the public URL
    return `${r2PublicUrl}/${fileName}`
  } catch (error) {
    console.error('R2 upload error:', error)
    throw new Error(
      `Failed to upload image to R2: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
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

  // Upload images first if provided
  let imageUrls: string[] = []
  if (formData.images && formData.images.length > 0) {
    try {
      imageUrls = await Promise.all(
        formData.images.map(image => uploadImageToR2(image))
      )
    } catch (error) {
      throw new Error(
        `Failed to upload images: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  // Prepare the issue data
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

  const issueData = {
    title: formData.title.trim(),
    body: issueBody,
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
