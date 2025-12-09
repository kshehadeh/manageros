'use server'

import { prisma } from '@/lib/db'
import { getCurrentUser, getActionPermission } from '@/lib/auth-utils'
import { uploadFilesToR2, FileUploadResult } from '@/lib/r2-upload'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { NoteWithAttachments } from '@/types/notes'
import type { Prisma } from '@/generated/prisma'

// Validation schemas
const CreateNoteSchema = z.object({
  entityType: z.string().min(1),
  entityId: z.string().min(1),
  content: z.string().min(1),
  title: z.string().max(500).optional(),
})

const UpdateNoteSchema = z.object({
  id: z.string().min(1),
  content: z.string().min(1),
  title: z.string().max(500).optional(),
})

const DeleteNoteSchema = z.object({
  id: z.string().min(1),
})

const DeleteFileAttachmentSchema = z.object({
  id: z.string().min(1),
})

/**
 * Create a new note with optional file attachments
 */
export async function createNote(formData: {
  entityType: string
  entityId: string
  content: string
  title?: string
  files?: File[]
}) {
  const user = await getCurrentUser()
  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization to create notes')
  }

  const validatedData = CreateNoteSchema.parse(formData)

  // Upload files if provided
  let fileUploadResults: FileUploadResult[] = []
  if (formData.files && formData.files.length > 0) {
    fileUploadResults = await uploadFilesToR2(formData.files, {
      entityType: validatedData.entityType,
      entityId: validatedData.entityId,
      folder: 'notes',
    })
  }

  // Create note with attachments
  const note = await prisma.note.create({
    data: {
      entityType: validatedData.entityType,
      entityId: validatedData.entityId,
      organizationId: user.managerOSOrganizationId,
      content: validatedData.content,
      title: validatedData.title || null,
      createdById: user.managerOSUserId || '',
      attachments: {
        create: fileUploadResults.map(file => ({
          entityType: validatedData.entityType,
          entityId: validatedData.entityId,
          organizationId: user.managerOSOrganizationId!,
          fileName: file.fileName,
          originalName: file.originalName,
          fileSize: file.fileSize,
          mimeType: file.mimeType,
          r2Key: file.r2Key,
          r2Url: file.r2Url,
          uploadedById: user.managerOSUserId || '',
        })),
      },
    },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      attachments: {
        include: {
          uploadedBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  })

  // Only revalidate if this is an entity-attached note
  if (validatedData.entityType && validatedData.entityId) {
    revalidatePath(
      `/${validatedData.entityType.toLowerCase()}s/${validatedData.entityId}`
    )
  }

  return {
    success: true,
    note: {
      id: note.id,
      title: note.title,
      entityType: note.entityType,
      entityId: note.entityId,
      content: note.content,
      createdAt: note.createdAt.toISOString(),
      updatedAt: note.updatedAt.toISOString(),
      createdBy: note.createdBy,
      attachments: note.attachments.map(att => ({
        id: att.id,
        fileName: att.fileName,
        originalName: att.originalName,
        fileSize: att.fileSize,
        mimeType: att.mimeType,
        r2Url: att.r2Url,
        createdAt: att.createdAt.toISOString(),
        uploadedBy: att.uploadedBy,
      })),
    },
  }
}

/**
 * Update an existing note
 */
export async function updateNote(formData: {
  id: string
  content: string
  title?: string
}) {
  const user = await getCurrentUser()
  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization to update notes')
  }

  const validatedData = UpdateNoteSchema.parse(formData)

  // Check if note exists and user has permission
  const existingNote = await prisma.note.findFirst({
    where: {
      id: validatedData.id,
      organizationId: user.managerOSOrganizationId,
    },
  })

  if (!existingNote) {
    throw new Error('Note not found or access denied')
  }

  // Update note
  const note = await prisma.note.update({
    where: {
      id: validatedData.id,
    },
    data: {
      content: validatedData.content,
      title:
        validatedData.title !== undefined
          ? validatedData.title || null
          : undefined,
      updatedAt: new Date(),
    },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      attachments: {
        include: {
          uploadedBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  })

  // Only revalidate if this is an entity-attached note
  if (existingNote.entityType && existingNote.entityId) {
    revalidatePath(
      `/${existingNote.entityType.toLowerCase()}s/${existingNote.entityId}`
    )
  }

  return {
    success: true,
    note: {
      id: note.id,
      title: note.title,
      entityType: note.entityType,
      entityId: note.entityId,
      content: note.content,
      createdAt: note.createdAt.toISOString(),
      updatedAt: note.updatedAt.toISOString(),
      createdBy: note.createdBy,
      attachments: note.attachments.map(att => ({
        id: att.id,
        fileName: att.fileName,
        originalName: att.originalName,
        fileSize: att.fileSize,
        mimeType: att.mimeType,
        r2Url: att.r2Url,
        createdAt: att.createdAt.toISOString(),
        uploadedBy: att.uploadedBy,
      })),
    },
  }
}

/**
 * Delete a note
 */
export async function deleteNote(formData: { id: string }) {
  const user = await getCurrentUser()
  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization to delete notes')
  }

  const validatedData = DeleteNoteSchema.parse(formData)

  // Check permission using the centralized permission system
  const hasPermission = await getActionPermission(
    user,
    'note.delete',
    validatedData.id
  )

  if (!hasPermission) {
    throw new Error('Note not found or you do not have permission to delete it')
  }

  // Verify note exists
  const existingNote = await prisma.note.findFirst({
    where: {
      id: validatedData.id,
      organizationId: user.managerOSOrganizationId,
    },
  })

  if (!existingNote) {
    throw new Error('Note not found or access denied')
  }

  // Delete note (attachments will be cascade deleted)
  await prisma.note.delete({
    where: {
      id: validatedData.id,
    },
  })

  // Only revalidate if this is an entity-attached note
  if (existingNote.entityType && existingNote.entityId) {
    revalidatePath(
      `/${existingNote.entityType.toLowerCase()}s/${existingNote.entityId}`
    )
  }

  return {
    success: true,
  }
}

/**
 * Get notes for a specific entity
 */
export async function getNotesForEntity(
  entityType: string,
  entityId: string
): Promise<NoteWithAttachments[]> {
  const user = await getCurrentUser()
  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization to view notes')
  }

  const notes = await prisma.note.findMany({
    where: {
      entityType,
      entityId,
      organizationId: user.managerOSOrganizationId,
    },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      attachments: {
        include: {
          uploadedBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return notes.map(note => ({
    id: note.id,
    title: note.title,
    entityType: note.entityType,
    entityId: note.entityId,
    content: note.content,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
    createdBy: note.createdBy,
    attachments: note.attachments.map(att => ({
      id: att.id,
      fileName: att.fileName,
      originalName: att.originalName,
      fileSize: att.fileSize,
      mimeType: att.mimeType,
      r2Url: att.r2Url,
      createdAt: att.createdAt.toISOString(),
      uploadedBy: att.uploadedBy,
    })),
  }))
}

/**
 * Add file attachments to an existing note
 */
export async function addAttachmentsToNote(formData: {
  noteId: string
  files: File[]
}) {
  const user = await getCurrentUser()
  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization to add attachments')
  }

  // Check if note exists and user has permission
  const existingNote = await prisma.note.findFirst({
    where: {
      id: formData.noteId,
      organizationId: user.managerOSOrganizationId,
    },
  })

  if (!existingNote) {
    throw new Error('Note not found or access denied')
  }

  // Determine entityType and entityId for file attachments
  // For standalone notes (null entityType), use 'StandaloneNote' and note ID
  const attachmentEntityType = existingNote.entityType ?? 'StandaloneNote'
  const attachmentEntityId = existingNote.entityId ?? formData.noteId

  // Upload files
  const fileUploadResults = await uploadFilesToR2(formData.files, {
    entityType: attachmentEntityType,
    entityId: attachmentEntityId,
    folder: 'notes',
  })

  // Create file attachment records
  const attachments = await prisma.fileAttachment.createMany({
    data: fileUploadResults.map(file => ({
      noteId: formData.noteId,
      entityType: attachmentEntityType,
      entityId: attachmentEntityId,
      organizationId: user.managerOSOrganizationId!,
      fileName: file.fileName,
      originalName: file.originalName,
      fileSize: file.fileSize,
      mimeType: file.mimeType,
      r2Key: file.r2Key,
      r2Url: file.r2Url,
      uploadedById: user.managerOSUserId || '',
    })),
  })

  // Only revalidate if this is an entity-attached note
  if (existingNote.entityType && existingNote.entityId) {
    revalidatePath(
      `/${existingNote.entityType.toLowerCase()}s/${existingNote.entityId}`
    )
  } else {
    // Revalidate standalone notes page
    revalidatePath('/notes')
    revalidatePath(`/notes/${formData.noteId}`)
  }

  return {
    success: true,
    attachmentsCreated: attachments.count,
  }
}

/**
 * Delete a file attachment
 */
export async function deleteFileAttachment(formData: { id: string }) {
  const user = await getCurrentUser()
  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization to delete attachments')
  }

  const validatedData = DeleteFileAttachmentSchema.parse(formData)

  // Check if attachment exists and user has permission
  const existingAttachment = await prisma.fileAttachment.findFirst({
    where: {
      id: validatedData.id,
      organizationId: user.managerOSOrganizationId,
    },
  })

  if (!existingAttachment) {
    throw new Error('Attachment not found or access denied')
  }

  // Delete attachment
  await prisma.fileAttachment.delete({
    where: {
      id: validatedData.id,
    },
  })

  // Only revalidate if this is an entity-attached note
  if (existingAttachment.entityType && existingAttachment.entityId) {
    revalidatePath(
      `/${existingAttachment.entityType.toLowerCase()}s/${existingAttachment.entityId}`
    )
  }

  return {
    success: true,
  }
}

// Validation schemas for standalone notes
const CreateStandaloneNoteSchema = z.object({
  title: z.string().min(1).max(500),
  content: z.string().min(1),
})

const UpdateStandaloneNoteSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(500).optional(),
  content: z.string().min(1),
  entityType: z.string().nullable().optional(),
  entityId: z.string().nullable().optional(),
})

/**
 * Create a new standalone note
 */
export async function createStandaloneNote(formData: {
  title: string
  content: string
  files?: File[]
}) {
  const user = await getCurrentUser()
  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization to create notes')
  }

  const validatedData = CreateStandaloneNoteSchema.parse(formData)

  // Create standalone note first (entityType and entityId are null)
  const note = await prisma.note.create({
    data: {
      title: validatedData.title,
      entityType: null,
      entityId: null,
      organizationId: user.managerOSOrganizationId,
      content: validatedData.content,
      createdById: user.managerOSUserId || '',
    },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  })

  // Upload files if provided (now we have the note ID)
  let fileUploadResults: FileUploadResult[] = []
  if (formData.files && formData.files.length > 0) {
    // For standalone notes, use the note ID as entityId
    fileUploadResults = await uploadFilesToR2(formData.files, {
      entityType: 'StandaloneNote',
      entityId: note.id,
      folder: 'notes',
    })

    // Create attachment records
    await prisma.fileAttachment.createMany({
      data: fileUploadResults.map(file => ({
        noteId: note.id,
        entityType: 'StandaloneNote',
        entityId: note.id,
        organizationId: user.managerOSOrganizationId!,
        fileName: file.fileName,
        originalName: file.originalName,
        fileSize: file.fileSize,
        mimeType: file.mimeType,
        r2Key: file.r2Key,
        r2Url: file.r2Url,
        uploadedById: user.managerOSUserId || '',
      })),
    })
  }

  // Fetch note with attachments
  const noteWithAttachments = await prisma.note.findUnique({
    where: { id: note.id },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      attachments: {
        include: {
          uploadedBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  })

  if (!noteWithAttachments) {
    throw new Error('Failed to retrieve created note')
  }

  const finalNote = noteWithAttachments

  revalidatePath('/notes')

  return {
    success: true,
    note: {
      id: finalNote.id,
      title: finalNote.title,
      entityType: finalNote.entityType,
      entityId: finalNote.entityId,
      content: finalNote.content,
      createdAt: finalNote.createdAt.toISOString(),
      updatedAt: finalNote.updatedAt.toISOString(),
      createdBy: finalNote.createdBy,
      attachments: finalNote.attachments.map(att => ({
        id: att.id,
        fileName: att.fileName,
        originalName: att.originalName,
        fileSize: att.fileSize,
        mimeType: att.mimeType,
        r2Url: att.r2Url,
        createdAt: att.createdAt.toISOString(),
        uploadedBy: att.uploadedBy,
      })),
    },
  }
}

/**
 * Get all standalone notes for the organization
 */
export async function getStandaloneNotes(): Promise<NoteWithAttachments[]> {
  const user = await getCurrentUser()
  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization to view notes')
  }

  const notes = await prisma.note.findMany({
    where: {
      organizationId: user.managerOSOrganizationId,
      entityType: { equals: null }, // Standalone notes have null entityType
      entityId: { equals: null }, // Standalone notes have null entityId
      OR: [
        { createdById: user.managerOSUserId || '' },
        { sharedWithEveryone: true },
        {
          sharedWith: {
            some: {
              userId: user.managerOSUserId || '',
            },
          },
        },
      ],
    },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      attachments: {
        include: {
          uploadedBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      },
      sharedWith: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: {
      updatedAt: 'desc', // Most recently updated first
    },
  })

  return notes.map(note => ({
    id: note.id,
    title: note.title,
    entityType: note.entityType,
    entityId: note.entityId,
    content: note.content,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
    sharedWithEveryone: note.sharedWithEveryone,
    createdBy: note.createdBy,
    attachments: note.attachments.map(att => ({
      id: att.id,
      fileName: att.fileName,
      originalName: att.originalName,
      fileSize: att.fileSize,
      mimeType: att.mimeType,
      r2Url: att.r2Url,
      createdAt: att.createdAt.toISOString(),
      uploadedBy: att.uploadedBy,
    })),
    sharedWith: note.sharedWith.map(share => share.user),
  }))
}

/**
 * Get all notes (standalone and entity-attached) for the organization
 * Returns notes the user has access to based on:
 * - Notes created by the user
 * - Notes shared with everyone
 * - Notes explicitly shared with the user
 */
export async function getAllNotes(options?: {
  page?: number
  limit?: number
  search?: string
  entityType?: string[]
}): Promise<{
  notes: NoteWithAttachments[]
  totalCount: number
}> {
  const user = await getCurrentUser()
  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization to view notes')
  }

  const page = options?.page || 1
  const limit = options?.limit || 20
  const skip = (page - 1) * limit
  const search = options?.search
  const entityTypes = options?.entityType

  // Build where clause
  const whereClause: Prisma.NoteWhereInput = {
    organizationId: user.managerOSOrganizationId,
    OR: [
      { createdById: user.managerOSUserId || '' },
      { sharedWithEveryone: true },
      {
        sharedWith: {
          some: {
            userId: user.managerOSUserId || '',
          },
        },
      },
    ],
  }

  // Add search filter
  if (search) {
    whereClause.AND = [
      {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } },
        ],
      },
    ]
  }

  // Add entityType filter
  if (entityTypes && entityTypes.length > 0) {
    const entityTypeConditions: Prisma.NoteWhereInput[] = []

    if (entityTypes.includes('Standalone')) {
      entityTypeConditions.push({ entityType: { equals: null } })
    }

    const otherTypes = entityTypes.filter((t: string) => t !== 'Standalone')
    if (otherTypes.length > 0) {
      entityTypeConditions.push({ entityType: { in: otherTypes } })
    }

    if (entityTypeConditions.length > 0) {
      // Ensure AND is always an array
      const andArray: Prisma.NoteWhereInput[] = Array.isArray(whereClause.AND)
        ? whereClause.AND
        : whereClause.AND
          ? [whereClause.AND]
          : []
      andArray.push({
        OR: entityTypeConditions,
      })
      whereClause.AND = andArray
    }
  }

  // Get total count
  const totalCount = await prisma.note.count({
    where: whereClause,
  })

  // Get paginated notes
  const notes = await prisma.note.findMany({
    where: whereClause,
    skip,
    take: limit,
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      attachments: {
        include: {
          uploadedBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      },
      sharedWith: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: {
      updatedAt: 'desc', // Most recently updated first
    },
  })

  return {
    notes: notes.map(note => ({
      id: note.id,
      title: note.title,
      entityType: note.entityType,
      entityId: note.entityId,
      content: note.content,
      createdAt: note.createdAt.toISOString(),
      updatedAt: note.updatedAt.toISOString(),
      sharedWithEveryone: note.sharedWithEveryone,
      createdBy: note.createdBy,
      attachments: note.attachments.map(att => ({
        id: att.id,
        fileName: att.fileName,
        originalName: att.originalName,
        fileSize: att.fileSize,
        mimeType: att.mimeType,
        r2Url: att.r2Url,
        createdAt: att.createdAt.toISOString(),
        uploadedBy: att.uploadedBy,
      })),
      sharedWith: note.sharedWith.map(share => share.user),
    })),
    totalCount,
  }
}

/**
 * Get a single note by ID (standalone or entity-attached)
 */
export async function getNoteById(
  id: string
): Promise<NoteWithAttachments | null> {
  const user = await getCurrentUser()
  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization to view notes')
  }

  const note = await prisma.note.findFirst({
    where: {
      id,
      organizationId: user.managerOSOrganizationId,
      OR: [
        { createdById: user.managerOSUserId || '' },
        { sharedWithEveryone: true },
        {
          sharedWith: {
            some: {
              userId: user.managerOSUserId || '',
            },
          },
        },
      ],
    },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      attachments: {
        include: {
          uploadedBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      },
      sharedWith: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  })

  if (!note) {
    return null
  }

  return {
    id: note.id,
    title: note.title,
    entityType: note.entityType,
    entityId: note.entityId,
    content: note.content,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
    sharedWithEveryone: note.sharedWithEveryone,
    createdBy: note.createdBy,
    attachments: note.attachments.map(att => ({
      id: att.id,
      fileName: att.fileName,
      originalName: att.originalName,
      fileSize: att.fileSize,
      mimeType: att.mimeType,
      r2Url: att.r2Url,
      createdAt: att.createdAt.toISOString(),
      uploadedBy: att.uploadedBy,
    })),
    sharedWith: note.sharedWith.map(share => share.user),
  }
}

/**
 * Get a single standalone note by ID
 */
export async function getStandaloneNoteById(
  id: string
): Promise<NoteWithAttachments | null> {
  const user = await getCurrentUser()
  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization to view notes')
  }

  const note = await prisma.note.findFirst({
    where: {
      id,
      organizationId: user.managerOSOrganizationId,
      entityType: { equals: null }, // Standalone notes have null entityType
      entityId: { equals: null }, // Standalone notes have null entityId
      OR: [
        { createdById: user.managerOSUserId || '' },
        { sharedWithEveryone: true },
        {
          sharedWith: {
            some: {
              userId: user.managerOSUserId || '',
            },
          },
        },
      ],
    },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      attachments: {
        include: {
          uploadedBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      },
      sharedWith: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  })

  if (!note) {
    return null
  }

  return {
    id: note.id,
    title: note.title,
    entityType: note.entityType,
    entityId: note.entityId,
    content: note.content,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
    sharedWithEveryone: note.sharedWithEveryone,
    createdBy: note.createdBy,
    attachments: note.attachments.map(att => ({
      id: att.id,
      fileName: att.fileName,
      originalName: att.originalName,
      fileSize: att.fileSize,
      mimeType: att.mimeType,
      r2Url: att.r2Url,
      createdAt: att.createdAt.toISOString(),
      uploadedBy: att.uploadedBy,
    })),
    sharedWith: note.sharedWith.map(share => share.user),
  }
}

/**
 * Update a standalone note
 */
export async function updateStandaloneNote(formData: {
  id: string
  title?: string
  content: string
}) {
  const user = await getCurrentUser()
  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization to update notes')
  }

  const validatedData = UpdateStandaloneNoteSchema.parse(formData)

  // Check if note exists and user has permission
  // User can edit if they created it or if it's shared with them
  const existingNote = await prisma.note.findFirst({
    where: {
      id: validatedData.id,
      organizationId: user.managerOSOrganizationId,
      OR: [
        { createdById: user.managerOSUserId || '' },
        { sharedWithEveryone: true },
        {
          sharedWith: {
            some: {
              userId: user.managerOSUserId || '',
            },
          },
        },
      ],
    },
    include: {
      sharedWith: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  })

  if (!existingNote) {
    throw new Error('Note not found or access denied')
  }

  // Only the creator can change entity association
  const canChangeEntity =
    existingNote.createdById === (user.managerOSUserId || '')

  // Update note
  const updateData: {
    title?: string | null
    content: string
    updatedAt: Date
    entityType?: string | null
    entityId?: string | null
  } = {
    title: validatedData.title ?? existingNote.title ?? null,
    content: validatedData.content,
    updatedAt: new Date(),
  }

  // Only update entityType/entityId if user is the creator and values are provided
  if (canChangeEntity && validatedData.entityType !== undefined) {
    updateData.entityType = validatedData.entityType
    updateData.entityId = validatedData.entityId ?? null
  }

  const note = await prisma.note.update({
    where: {
      id: validatedData.id,
    },
    data: updateData,
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      attachments: {
        include: {
          uploadedBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      },
      sharedWith: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  })

  revalidatePath('/notes')
  revalidatePath(`/notes/${note.id}`)
  // Revalidate initiative page if associated
  if (note.entityType === 'Initiative' && note.entityId) {
    revalidatePath(`/initiatives/${note.entityId}`)
  }

  return {
    success: true,
    note: {
      id: note.id,
      title: note.title,
      entityType: note.entityType,
      entityId: note.entityId,
      content: note.content,
      createdAt: note.createdAt.toISOString(),
      updatedAt: note.updatedAt.toISOString(),
      createdBy: note.createdBy,
      attachments: note.attachments.map(att => ({
        id: att.id,
        fileName: att.fileName,
        originalName: att.originalName,
        fileSize: att.fileSize,
        mimeType: att.mimeType,
        r2Url: att.r2Url,
        createdAt: att.createdAt.toISOString(),
        uploadedBy: att.uploadedBy,
      })),
      sharedWith: note.sharedWith.map(share => share.user),
    },
  }
}

/**
 * Delete a standalone note
 */
export async function deleteStandaloneNote(formData: { id: string }) {
  const user = await getCurrentUser()
  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization to delete notes')
  }

  const validatedData = DeleteNoteSchema.parse(formData)

  // Check permission using the centralized permission system
  const hasPermission = await getActionPermission(
    user,
    'note.delete',
    validatedData.id
  )

  if (!hasPermission) {
    throw new Error('Note not found or you do not have permission to delete it')
  }

  // Verify note exists and is a standalone note
  const existingNote = await prisma.note.findFirst({
    where: {
      id: validatedData.id,
      organizationId: user.managerOSOrganizationId,
      entityType: { equals: null }, // Standalone notes have null entityType
      entityId: { equals: null }, // Standalone notes have null entityId
    },
  })

  if (!existingNote) {
    throw new Error('Note not found or access denied')
  }

  // Delete note (attachments will be cascade deleted)
  await prisma.note.delete({
    where: {
      id: validatedData.id,
    },
  })

  revalidatePath('/notes')

  return {
    success: true,
  }
}

/**
 * Share a note with users
 */
export async function shareNote(formData: {
  noteId: string
  userIds: string[]
  sharedWithEveryone?: boolean
}) {
  const user = await getCurrentUser()
  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization to share notes')
  }

  // Check if note exists and user is the creator
  const existingNote = await prisma.note.findFirst({
    where: {
      id: formData.noteId,
      organizationId: user.managerOSOrganizationId,
      createdById: user.managerOSUserId || '',
    },
  })

  if (!existingNote) {
    throw new Error('Note not found or you do not have permission to share it')
  }

  // Update sharedWithEveryone flag
  await prisma.note.update({
    where: {
      id: formData.noteId,
    },
    data: {
      sharedWithEveryone: formData.sharedWithEveryone ?? false,
    },
  })

  // If sharing with everyone, clear individual shares
  if (formData.sharedWithEveryone) {
    await prisma.noteShare.deleteMany({
      where: {
        noteId: formData.noteId,
      },
    })
  } else {
    // Verify all users belong to the same organization
    if (formData.userIds.length > 0) {
      const users = await prisma.user.findMany({
        where: {
          id: { in: formData.userIds },
          organizationMemberships: {
            some: {
              organizationId: user.managerOSOrganizationId,
            },
          },
        },
        select: {
          id: true,
        },
      })

      if (users.length !== formData.userIds.length) {
        throw new Error('Some users do not belong to your organization')
      }
    }

    // Remove existing shares and create new ones
    await prisma.noteShare.deleteMany({
      where: {
        noteId: formData.noteId,
      },
    })

    if (formData.userIds.length > 0) {
      await prisma.noteShare.createMany({
        data: formData.userIds.map(userId => ({
          noteId: formData.noteId,
          userId,
        })),
      })
    }
  }

  revalidatePath('/notes')
  revalidatePath(`/notes/${formData.noteId}`)

  return {
    success: true,
  }
}

/**
 * Get users in the organization for sharing
 */
export async function getUsersForSharing() {
  const user = await getCurrentUser()
  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization')
  }

  // Get all users in the organization through organization memberships
  const members = await prisma.organizationMember.findMany({
    where: {
      organizationId: user.managerOSOrganizationId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  })

  return members.map(m => m.user).filter(u => u.id !== user.managerOSUserId) // Exclude current user
}
