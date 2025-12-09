import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-utils'
import { prisma } from '@/lib/db'
import { getFileFromR2 } from '@/lib/r2-upload'

/**
 * GET /api/notes/images/[id]
 * Serve note images with access control
 * Only users in the same organization can access the image
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    const { id } = await params

    if (!user.managerOSOrganizationId) {
      return NextResponse.json(
        { error: 'User must belong to an organization to view images' },
        { status: 403 }
      )
    }

    // Find the image and verify access
    const noteImage = await prisma.noteImage.findUnique({
      where: { id },
      select: {
        id: true,
        organizationId: true,
        r2Key: true,
        mimeType: true,
        originalName: true,
      },
    })

    if (!noteImage) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 })
    }

    // Access control: user must be in the same organization
    if (noteImage.organizationId !== user.managerOSOrganizationId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Fetch the image from R2
    const fileResult = await getFileFromR2(noteImage.r2Key)

    // Encode filename for Content-Disposition header (RFC 5987)
    // Use only filename* parameter to avoid issues with special characters
    const encodedFilename = encodeURIComponent(noteImage.originalName)
    const contentDisposition = `inline; filename*=UTF-8''${encodedFilename}`

    // Return the image with appropriate headers
    return new NextResponse(fileResult.body, {
      headers: {
        'Content-Type': fileResult.contentType,
        'Content-Length': fileResult.contentLength.toString(),
        'Cache-Control': 'private, max-age=31536000', // Cache for 1 year (private = browser only)
        'Content-Disposition': contentDisposition,
      },
    })
  } catch (error) {
    console.error('Error serving image:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to serve image',
      },
      { status: 500 }
    )
  }
}
