'use server'

import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-utils'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const CreateEntityLinkSchema = z.object({
  url: z.string().url('Please enter a valid URL'),
  title: z.string().optional(),
  description: z.string().optional(),
  entityType: z.string().min(1, 'Entity type is required'),
  entityId: z.string().min(1, 'Entity ID is required'),
})

const UpdateEntityLinkSchema = z.object({
  id: z.string().min(1, 'Link ID is required'),
  url: z.string().url('Please enter a valid URL').optional(),
  title: z.string().optional(),
  description: z.string().optional(),
})

const DeleteEntityLinkSchema = z.object({
  id: z.string().min(1, 'Link ID is required'),
})

export type CreateEntityLinkData = z.infer<typeof CreateEntityLinkSchema>
export type UpdateEntityLinkData = z.infer<typeof UpdateEntityLinkSchema>
export type DeleteEntityLinkData = z.infer<typeof DeleteEntityLinkSchema>

/**
 * Create a new entity link
 */
export async function createEntityLink(data: CreateEntityLinkData) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Authentication required')
  }

  if (!user.organizationId) {
    throw new Error('User must belong to an organization to create links')
  }

  // Validate input
  const validatedData = CreateEntityLinkSchema.parse(data)

  try {
    const link = await prisma.entityLink.create({
      data: {
        url: validatedData.url,
        title: validatedData.title,
        description: validatedData.description,
        entityType: validatedData.entityType,
        entityId: validatedData.entityId,
        organizationId: user.organizationId,
        createdById: user.id,
      },
    })

    revalidatePath('/')
    return { success: true, link }
  } catch (error) {
    console.error('Error creating entity link:', error)
    throw new Error('Failed to create link')
  }
}

/**
 * Update an existing entity link
 */
export async function updateEntityLink(data: UpdateEntityLinkData) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Authentication required')
  }

  if (!user.organizationId) {
    throw new Error('User must belong to an organization to update links')
  }

  // Validate input
  const validatedData = UpdateEntityLinkSchema.parse(data)

  try {
    // First check if the link exists and belongs to the user's organization
    const existingLink = await prisma.entityLink.findFirst({
      where: {
        id: validatedData.id,
        organizationId: user.organizationId,
      },
    })

    if (!existingLink) {
      throw new Error('Link not found or access denied')
    }

    const link = await prisma.entityLink.update({
      where: { id: validatedData.id },
      data: {
        ...(validatedData.url && { url: validatedData.url }),
        ...(validatedData.title !== undefined && {
          title: validatedData.title,
        }),
        ...(validatedData.description !== undefined && {
          description: validatedData.description,
        }),
      },
    })

    revalidatePath('/')
    return { success: true, link }
  } catch (error) {
    console.error('Error updating entity link:', error)
    throw new Error('Failed to update link')
  }
}

/**
 * Delete an entity link
 */
export async function deleteEntityLink(data: DeleteEntityLinkData) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Authentication required')
  }

  if (!user.organizationId) {
    throw new Error('User must belong to an organization to delete links')
  }

  // Validate input
  const validatedData = DeleteEntityLinkSchema.parse(data)

  try {
    // First check if the link exists and belongs to the user's organization
    const existingLink = await prisma.entityLink.findFirst({
      where: {
        id: validatedData.id,
        organizationId: user.organizationId,
      },
    })

    if (!existingLink) {
      throw new Error('Link not found or access denied')
    }

    await prisma.entityLink.delete({
      where: { id: validatedData.id },
    })

    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('Error deleting entity link:', error)
    throw new Error('Failed to delete link')
  }
}

/**
 * Get all links for a specific entity
 */
export async function getEntityLinks(entityType: string, entityId: string) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Authentication required')
  }

  if (!user.organizationId) {
    throw new Error('User must belong to an organization to view links')
  }

  try {
    const links = await prisma.entityLink.findMany({
      where: {
        entityType,
        entityId,
        organizationId: user.organizationId,
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
      orderBy: {
        createdAt: 'desc',
      },
    })

    return links
  } catch (error) {
    console.error('Error fetching entity links:', error)
    throw new Error('Failed to fetch links')
  }
}

/**
 * Get a single entity link by ID
 */
export async function getEntityLinkById(id: string) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Authentication required')
  }

  if (!user.organizationId) {
    throw new Error('User must belong to an organization to view links')
  }

  try {
    const link = await prisma.entityLink.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
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

    if (!link) {
      throw new Error('Link not found or access denied')
    }

    return link
  } catch (error) {
    console.error('Error fetching entity link:', error)
    throw new Error('Failed to fetch link')
  }
}
