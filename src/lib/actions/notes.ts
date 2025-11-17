'use server'

import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-utils'
import { uploadFilesToR2, FileUploadResult } from '@/lib/r2-upload'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { NoteWithAttachments } from '@/types/notes'

// Validation schemas
const CreateNoteSchema = z.object({
  entityType: z.string().min(1),
  entityId: z.string().min(1),
  content: z.string().min(1),
})

const UpdateNoteSchema = z.object({
  id: z.string().min(1),
  content: z.string().min(1),
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

  revalidatePath(
    `/${validatedData.entityType.toLowerCase()}s/${validatedData.entityId}`
  )

  return {
    success: true,
    note: {
      id: note.id,
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
export async function updateNote(formData: { id: string; content: string }) {
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

  revalidatePath(
    `/${existingNote.entityType.toLowerCase()}s/${existingNote.entityId}`
  )

  return {
    success: true,
    note: {
      id: note.id,
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

  // Delete note (attachments will be cascade deleted)
  await prisma.note.delete({
    where: {
      id: validatedData.id,
    },
  })

  revalidatePath(
    `/${existingNote.entityType.toLowerCase()}s/${existingNote.entityId}`
  )

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

  // Upload files
  const fileUploadResults = await uploadFilesToR2(formData.files, {
    entityType: existingNote.entityType,
    entityId: existingNote.entityId,
    folder: 'notes',
  })

  // Create file attachment records
  const attachments = await prisma.fileAttachment.createMany({
    data: fileUploadResults.map(file => ({
      noteId: formData.noteId,
      entityType: existingNote.entityType,
      entityId: existingNote.entityId,
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

  revalidatePath(
    `/${existingNote.entityType.toLowerCase()}s/${existingNote.entityId}`
  )

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

  revalidatePath(
    `/${existingAttachment.entityType.toLowerCase()}s/${existingAttachment.entityId}`
  )

  return {
    success: true,
  }
}
