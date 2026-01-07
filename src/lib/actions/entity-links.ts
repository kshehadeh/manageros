'use server'

import { prisma } from '@/lib/db'
import { getActionPermission, getCurrentUser } from '@/lib/auth-utils'
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

type EntityPermission = {
  view: Parameters<typeof getActionPermission>[1]
  edit: Parameters<typeof getActionPermission>[1]
}

function getEntityPermissions(entityType: string): EntityPermission | null {
  const normalized = entityType.replace(/[\s_-]/g, '').toLowerCase()

  switch (normalized) {
    case 'task':
      return { view: 'task.view', edit: 'task.edit' }
    case 'initiative':
      return { view: 'initiative.view', edit: 'initiative.edit' }
    case 'oneonone':
      return { view: 'oneonone.view', edit: 'oneonone.edit' }
    case 'person':
      return { view: 'person.view', edit: 'person.edit' }
    default:
      return null
  }
}

/**
 * Create a new entity link
 */
export async function createEntityLink(data: CreateEntityLinkData) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Authentication required')
  }

  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization to create links')
  }

  // Validate input
  const validatedData = CreateEntityLinkSchema.parse(data)
  const permissions = getEntityPermissions(validatedData.entityType)

  if (!permissions) {
    throw new Error('Unsupported entity type for links')
  }

  const canEditEntity = await getActionPermission(
    user,
    permissions.edit,
    validatedData.entityId
  )

  if (!canEditEntity) {
    throw new Error('You do not have permission to add links to this entity')
  }

  try {
    const link = await prisma.entityLink.create({
      data: {
        url: validatedData.url,
        title: validatedData.title,
        description: validatedData.description,
        entityType: validatedData.entityType,
        entityId: validatedData.entityId,
        organizationId: user.managerOSOrganizationId,
        createdById: user.managerOSUserId || '',
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

  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization to update links')
  }

  // Validate input
  const validatedData = UpdateEntityLinkSchema.parse(data)

  try {
    // First check if the link exists and belongs to the user's organization
    const existingLink = await prisma.entityLink.findFirst({
      where: {
        id: validatedData.id,
        organizationId: user.managerOSOrganizationId,
      },
    })

    if (!existingLink) {
      throw new Error('Link not found or access denied')
    }

    const permissions = getEntityPermissions(existingLink.entityType)

    if (!permissions) {
      throw new Error('Unsupported entity type for links')
    }

    const canEditEntity = await getActionPermission(
      user,
      permissions.edit,
      existingLink.entityId
    )

    if (!canEditEntity) {
      throw new Error('You do not have permission to update this link')
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

  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization to delete links')
  }

  // Validate input
  const validatedData = DeleteEntityLinkSchema.parse(data)

  try {
    // First check if the link exists and belongs to the user's organization
    const existingLink = await prisma.entityLink.findFirst({
      where: {
        id: validatedData.id,
        organizationId: user.managerOSOrganizationId,
      },
    })

    if (!existingLink) {
      throw new Error('Link not found or access denied')
    }

    const permissions = getEntityPermissions(existingLink.entityType)

    if (!permissions) {
      throw new Error('Unsupported entity type for links')
    }

    const canEditEntity = await getActionPermission(
      user,
      permissions.edit,
      existingLink.entityId
    )

    if (!canEditEntity) {
      throw new Error('You do not have permission to delete this link')
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

  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization to view links')
  }

  const permissions = getEntityPermissions(entityType)

  if (!permissions) {
    throw new Error('Unsupported entity type for links')
  }

  const canViewEntity = await getActionPermission(
    user,
    permissions.view,
    entityId
  )

  if (!canViewEntity) {
    throw new Error('You do not have permission to view links for this entity')
  }

  try {
    const links = await prisma.entityLink.findMany({
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
