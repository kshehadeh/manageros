import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-utils'
import { uploadFileToR2 } from '@/lib/r2-upload'
import { prisma } from '@/lib/db'

/**
 * POST /api/notes/upload-image
 * Upload an image for embedding in notes
 * Returns a proxy URL that requires authentication to access
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user.managerOSOrganizationId) {
      return NextResponse.json(
        { error: 'User must belong to an organization to upload images' },
        { status: 403 }
      )
    }

    if (!user.managerOSUserId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate that it's an image
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
    ]

    if (!allowedMimeTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Only JPEG, PNG, GIF, and WebP images are allowed' },
        { status: 400 }
      )
    }

    // Upload to R2 in a private folder (no public URL access)
    const uploadResult = await uploadFileToR2(file, {
      entityType: 'note-image',
      entityId: user.managerOSOrganizationId,
      folder: 'private/note-images',
      maxSizeBytes: 10 * 1024 * 1024, // 10MB max for inline images
      allowedMimeTypes,
    })

    // Store image metadata in database for access control
    const noteImage = await prisma.noteImage.create({
      data: {
        organizationId: user.managerOSOrganizationId,
        uploadedById: user.managerOSUserId,
        fileName: uploadResult.fileName,
        originalName: uploadResult.originalName,
        fileSize: uploadResult.fileSize,
        mimeType: uploadResult.mimeType,
        r2Key: uploadResult.r2Key,
      },
    })

    // Return proxy URL instead of direct R2 URL
    // Images will be served through /api/notes/images/[id] with access control
    return NextResponse.json({
      url: `/api/notes/images/${noteImage.id}`,
      fileName: uploadResult.originalName,
    })
  } catch (error) {
    console.error('Error uploading image:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to upload image',
      },
      { status: 500 }
    )
  }
}
