import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3'
import { randomBytes } from 'crypto'
import { validateFile } from '@/lib/file-utils'

// R2 Configuration - Get at runtime to ensure env vars are loaded
function getR2Config() {
  // Check if we're on the server side
  if (typeof window !== 'undefined') {
    throw new Error('R2 upload functions can only be called on the server side')
  }

  const R2_ACCOUNT_ID = process.env.CLOUDFLARE_R2_ACCOUNT_ID
  const R2_ACCESS_KEY_ID = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID
  const R2_SECRET_ACCESS_KEY = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY
  const R2_BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME
  const R2_PUBLIC_URL = process.env.CLOUDFLARE_R2_PUBLIC_URL

  if (
    !R2_ACCOUNT_ID ||
    !R2_ACCESS_KEY_ID ||
    !R2_SECRET_ACCESS_KEY ||
    !R2_BUCKET_NAME ||
    !R2_PUBLIC_URL
  ) {
    throw new Error(
      'R2 configuration is incomplete. Please check your environment variables.'
    )
  }

  return {
    R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY,
    R2_BUCKET_NAME,
    R2_PUBLIC_URL,
  }
}

// Initialize S3 client for R2 - lazy initialization
let r2Client: S3Client | null = null

function getR2Client(): S3Client {
  if (!r2Client) {
    const config = getR2Config()
    r2Client = new S3Client({
      region: 'auto',
      endpoint: `https://${config.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.R2_ACCESS_KEY_ID,
        secretAccessKey: config.R2_SECRET_ACCESS_KEY,
      },
    })
  }
  return r2Client
}

export interface FileUploadResult {
  fileName: string
  originalName: string
  fileSize: number
  mimeType: string
  r2Key: string
  r2Url: string
}

export interface FileUploadOptions {
  entityType: string
  entityId: string
  folder?: string
  maxSizeBytes?: number
  allowedMimeTypes?: string[]
}

/**
 * Upload a file to Cloudflare R2
 */
export async function uploadFileToR2(
  file: File,
  options: FileUploadOptions
): Promise<FileUploadResult> {
  const {
    entityType,
    entityId,
    folder = 'attachments',
    maxSizeBytes = 50 * 1024 * 1024, // 50MB default
    allowedMimeTypes = [
      'image/*',
      'application/pdf',
      'text/*',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
  } = options

  // Get R2 configuration
  const config = getR2Config()
  const client = getR2Client()

  // Validate file
  const validationError = validateFile(file, { maxSizeBytes, allowedMimeTypes })
  if (validationError) {
    throw new Error(validationError)
  }

  // Generate unique filename
  const timestamp = Date.now()
  const randomString = randomBytes(8).toString('hex')
  const extension = file.name.split('.').pop() || ''
  const fileName = `${timestamp}-${randomString}.${extension}`

  // Create R2 key with folder structure
  const r2Key = `${folder}/${entityType.toLowerCase()}/${entityId}/${fileName}`

  try {
    // Convert File to Buffer
    const buffer = Buffer.from(await file.arrayBuffer())

    // Upload to R2
    const command = new PutObjectCommand({
      Bucket: config.R2_BUCKET_NAME,
      Key: r2Key,
      Body: buffer,
      ContentType: file.type,
      ContentLength: file.size,
    })

    await client.send(command)

    // Generate public URL
    const r2Url = `${config.R2_PUBLIC_URL}/${r2Key}`

    return {
      fileName,
      originalName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      r2Key,
      r2Url,
    }
  } catch (error) {
    console.error('Failed to upload file to R2:', error)
    throw new Error(
      `Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

export interface FileDownloadResult {
  body: ReadableStream<Uint8Array>
  contentType: string
  contentLength: number
}

/**
 * Get a file from Cloudflare R2 by its key
 */
export async function getFileFromR2(
  r2Key: string
): Promise<FileDownloadResult> {
  const config = getR2Config()
  const client = getR2Client()

  try {
    const command = new GetObjectCommand({
      Bucket: config.R2_BUCKET_NAME,
      Key: r2Key,
    })

    const response = await client.send(command)

    if (!response.Body) {
      throw new Error('No body in R2 response')
    }

    // Convert the AWS SDK stream to a web ReadableStream
    const webStream = response.Body.transformToWebStream()

    return {
      body: webStream as ReadableStream<Uint8Array>,
      contentType: response.ContentType || 'application/octet-stream',
      contentLength: response.ContentLength || 0,
    }
  } catch (error) {
    console.error('Failed to get file from R2:', error)
    throw new Error(
      `Failed to get file: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}
