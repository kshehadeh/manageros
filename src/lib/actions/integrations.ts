/**
 * Server actions for integration management
 * Supports both organization-level and user-level integrations
 */

'use server'

import { prisma } from '@/lib/db'
import type { Prisma } from '@/generated/prisma'
import { revalidatePath } from 'next/cache'
import { getCurrentUser, requireAdmin } from '@/lib/auth-utils'
import { encrypt } from '@/lib/encryption'
import { getIntegration } from '@/lib/integrations/integration-factory'
import type { IntegrationType } from '@/lib/integrations/base-integration'

// ============================================================================
// Organization-level actions (admin only)
// ============================================================================

export async function createOrganizationIntegration(formData: {
  integrationType: IntegrationType
  name: string
  credentials: Record<string, string>
  metadata?: Record<string, unknown>
}) {
  const user = await requireAdmin()

  if (!user.managerOSOrganizationId) {
    throw new Error(
      'User must belong to an organization to create integrations'
    )
  }

  // Validate integration type and scope
  // All integration types can be organization-level
  const validOrgTypes: IntegrationType[] = [
    'google_calendar',
    'microsoft_outlook',
    'jira',
    'github',
  ]
  if (!validOrgTypes.includes(formData.integrationType)) {
    throw new Error(
      `Integration type ${formData.integrationType} is not supported at organization level`
    )
  }

  // Encrypt credentials
  const encryptedCredentials: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(formData.credentials)) {
    if (
      key.includes('encrypted') ||
      key.includes('token') ||
      key.includes('key')
    ) {
      encryptedCredentials[key] = encrypt(value)
    } else {
      encryptedCredentials[key] = value
    }
  }

  // Test connection before saving
  const integration = await prisma.integration.create({
    data: {
      organizationId: user.managerOSOrganizationId,
      integrationType: formData.integrationType,
      name: formData.name,
      scope: 'organization',
      isEnabled: true,
      encryptedCredentials:
        encryptedCredentials as unknown as Prisma.InputJsonValue,
      metadata: (formData.metadata || {}) as unknown as Prisma.InputJsonValue,
    },
  })

  // Test the connection
  try {
    const integrationInstance = await getIntegration(integration.id)
    if (integrationInstance) {
      // testConnection() throws on failure
      await integrationInstance.testConnection()
    }
  } catch (error) {
    // Delete the integration if connection test fails
    await prisma.integration
      .delete({ where: { id: integration.id } })
      .catch(() => {})
    throw error instanceof Error
      ? error
      : new Error('Failed to test integration connection')
  }

  revalidatePath('/organization/settings')
  return { success: true, integrationId: integration.id }
}

export async function updateOrganizationIntegration(
  integrationId: string,
  formData: {
    name?: string
    credentials?: Record<string, string>
    metadata?: Record<string, unknown>
    isEnabled?: boolean
  }
) {
  const user = await requireAdmin()

  if (!user.managerOSOrganizationId) {
    throw new Error(
      'User must belong to an organization to update integrations'
    )
  }

  // Verify integration belongs to organization
  const existing = await prisma.integration.findFirst({
    where: {
      id: integrationId,
      organizationId: user.managerOSOrganizationId,
      scope: 'organization',
    },
  })

  if (!existing) {
    throw new Error('Integration not found or access denied')
  }

  // Prepare update data
  const updateData: Prisma.IntegrationUpdateInput = {}

  if (formData.name !== undefined) {
    updateData.name = formData.name
  }

  if (formData.isEnabled !== undefined) {
    updateData.isEnabled = formData.isEnabled
  }

  if (formData.metadata !== undefined) {
    updateData.metadata = formData.metadata as unknown as Prisma.InputJsonValue
  }

  if (formData.credentials) {
    // Encrypt credentials
    const encryptedCredentials: Record<string, unknown> = {
      ...(existing.encryptedCredentials as Record<string, unknown>),
    }
    for (const [key, value] of Object.entries(formData.credentials)) {
      if (
        key.includes('encrypted') ||
        key.includes('token') ||
        key.includes('key')
      ) {
        encryptedCredentials[key] = encrypt(value)
      } else {
        encryptedCredentials[key] = value
      }
    }
    updateData.encryptedCredentials =
      encryptedCredentials as unknown as Prisma.InputJsonValue
  }

  // Update integration
  const updated = await prisma.integration.update({
    where: { id: integrationId },
    data: updateData,
  })

  // Test connection if credentials were updated
  if (formData.credentials) {
    try {
      const integrationInstance = await getIntegration(updated.id)
      if (integrationInstance) {
        // testConnection() throws on failure
        await integrationInstance.testConnection()
      }
    } catch (error) {
      throw error instanceof Error
        ? error
        : new Error('Failed to test integration connection')
    }
  }

  revalidatePath('/organization/settings')
  return { success: true }
}

export async function deleteOrganizationIntegration(integrationId: string) {
  const user = await requireAdmin()

  if (!user.managerOSOrganizationId) {
    throw new Error(
      'User must belong to an organization to delete integrations'
    )
  }

  // Verify integration belongs to organization
  const existing = await prisma.integration.findFirst({
    where: {
      id: integrationId,
      organizationId: user.managerOSOrganizationId,
      scope: 'organization',
    },
  })

  if (!existing) {
    throw new Error('Integration not found or access denied')
  }

  await prisma.integration.delete({
    where: { id: integrationId },
  })

  revalidatePath('/organization/settings')
  return { success: true }
}

export async function getOrganizationIntegrations() {
  const user = await requireAdmin()

  if (!user.managerOSOrganizationId) {
    return []
  }

  const integrations = await prisma.integration.findMany({
    where: {
      organizationId: user.managerOSOrganizationId,
      scope: 'organization',
    },
    orderBy: { createdAt: 'desc' },
  })

  return integrations.map(integration => ({
    id: integration.id,
    type: integration.integrationType,
    name: integration.name,
    isEnabled: integration.isEnabled,
    createdAt: integration.createdAt,
    updatedAt: integration.updatedAt,
    // Don't return encrypted credentials
  }))
}

export async function testOrganizationIntegration(integrationId: string) {
  const user = await requireAdmin()

  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization to test integrations')
  }

  // Verify integration belongs to organization
  const existing = await prisma.integration.findFirst({
    where: {
      id: integrationId,
      organizationId: user.managerOSOrganizationId,
      scope: 'organization',
    },
  })

  if (!existing) {
    throw new Error('Integration not found or access denied')
  }

  try {
    const integrationInstance = await getIntegration(integrationId)
    if (!integrationInstance) {
      throw new Error('Failed to create integration instance')
    }

    // testConnection() throws on failure, so if we get here it succeeded
    await integrationInstance.testConnection()
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Connection test failed',
    }
  }
}

// ============================================================================
// User-level actions
// ============================================================================

export async function createUserIntegration(formData: {
  integrationType: IntegrationType
  name: string
  credentials: Record<string, string>
  metadata?: Record<string, unknown>
}) {
  const user = await getCurrentUser()

  if (!user.managerOSUserId) {
    throw new Error('User ID is required')
  }

  // Validate integration type and scope
  if (
    formData.integrationType !== 'jira' &&
    formData.integrationType !== 'github'
  ) {
    throw new Error(
      'Only Jira and GitHub integrations can be created at user level'
    )
  }

  // Encrypt credentials
  const encryptedCredentials: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(formData.credentials)) {
    if (
      key.includes('encrypted') ||
      key.includes('token') ||
      key.includes('key')
    ) {
      encryptedCredentials[key] = encrypt(value)
    } else {
      encryptedCredentials[key] = value
    }
  }

  // Test connection before saving
  const integration = await prisma.integration.create({
    data: {
      userId: user.managerOSUserId,
      integrationType: formData.integrationType,
      name: formData.name,
      scope: 'user',
      isEnabled: true,
      encryptedCredentials:
        encryptedCredentials as unknown as Prisma.InputJsonValue,
      metadata: (formData.metadata || {}) as unknown as Prisma.InputJsonValue,
    },
  })

  // Test the connection
  try {
    const integrationInstance = await getIntegration(integration.id)
    if (integrationInstance) {
      // testConnection() throws on failure
      await integrationInstance.testConnection()
    }
  } catch (error) {
    // Delete the integration if connection test fails
    await prisma.integration
      .delete({ where: { id: integration.id } })
      .catch(() => {})
    throw error instanceof Error
      ? error
      : new Error('Failed to test integration connection')
  }

  revalidatePath('/settings')
  return { success: true, integrationId: integration.id }
}

export async function updateUserIntegration(
  integrationId: string,
  formData: {
    name?: string
    credentials?: Record<string, string>
    metadata?: Record<string, unknown>
    isEnabled?: boolean
  }
) {
  const user = await getCurrentUser()

  if (!user.managerOSUserId) {
    throw new Error('User ID is required')
  }

  // Verify integration belongs to user
  const existing = await prisma.integration.findFirst({
    where: {
      id: integrationId,
      userId: user.managerOSUserId,
      scope: 'user',
    },
  })

  if (!existing) {
    throw new Error('Integration not found or access denied')
  }

  // Prepare update data
  const updateData: Prisma.IntegrationUpdateInput = {}

  if (formData.name !== undefined) {
    updateData.name = formData.name
  }

  if (formData.isEnabled !== undefined) {
    updateData.isEnabled = formData.isEnabled
  }

  if (formData.metadata !== undefined) {
    updateData.metadata = formData.metadata as unknown as Prisma.InputJsonValue
  }

  if (formData.credentials) {
    // Encrypt credentials
    const encryptedCredentials: Record<string, unknown> = {
      ...(existing.encryptedCredentials as Record<string, unknown>),
    }
    for (const [key, value] of Object.entries(formData.credentials)) {
      if (
        key.includes('encrypted') ||
        key.includes('token') ||
        key.includes('key')
      ) {
        encryptedCredentials[key] = encrypt(value)
      } else {
        encryptedCredentials[key] = value
      }
    }
    updateData.encryptedCredentials =
      encryptedCredentials as unknown as Prisma.InputJsonValue
  }

  // Update integration
  const updated = await prisma.integration.update({
    where: { id: integrationId },
    data: updateData,
  })

  // Test connection if credentials were updated
  if (formData.credentials) {
    try {
      const integrationInstance = await getIntegration(updated.id)
      if (integrationInstance) {
        // testConnection() throws on failure
        await integrationInstance.testConnection()
      }
    } catch (error) {
      throw error instanceof Error
        ? error
        : new Error('Failed to test integration connection')
    }
  }

  revalidatePath('/settings')
  return { success: true }
}

export async function deleteUserIntegration(integrationId: string) {
  const user = await getCurrentUser()

  if (!user.managerOSUserId) {
    throw new Error('User ID is required')
  }

  // Verify integration belongs to user
  const existing = await prisma.integration.findFirst({
    where: {
      id: integrationId,
      userId: user.managerOSUserId,
      scope: 'user',
    },
  })

  if (!existing) {
    throw new Error('Integration not found or access denied')
  }

  await prisma.integration.delete({
    where: { id: integrationId },
  })

  revalidatePath('/settings')
  return { success: true }
}

export async function testUserIntegration(integrationId: string) {
  const user = await getCurrentUser()

  if (!user.managerOSUserId) {
    throw new Error('User ID is required')
  }

  // Verify integration belongs to user
  const existing = await prisma.integration.findFirst({
    where: {
      id: integrationId,
      userId: user.managerOSUserId,
      scope: 'user',
    },
  })

  if (!existing) {
    throw new Error('Integration not found or access denied')
  }

  try {
    const integrationInstance = await getIntegration(integrationId)
    if (!integrationInstance) {
      throw new Error('Failed to create integration instance')
    }

    // testConnection() throws on failure, so if we get here it succeeded
    await integrationInstance.testConnection()
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Connection test failed',
    }
  }
}

// ============================================================================
// Entity linking actions (both scopes)
// ============================================================================
