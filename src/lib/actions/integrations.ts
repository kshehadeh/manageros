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

export async function getUserIntegrations() {
  const user = await getCurrentUser()

  if (!user.managerOSUserId) {
    return []
  }

  const integrations = await prisma.integration.findMany({
    where: {
      userId: user.managerOSUserId,
      scope: 'user',
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

export async function linkEntityToIntegration(formData: {
  entityType: string
  entityId: string
  integrationId: string
  externalEntityId: string
  externalEntityUrl?: string
  metadata?: Record<string, unknown>
}) {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization')
  }

  // Verify integration exists and user has access
  const integration = await prisma.integration.findFirst({
    where: {
      id: formData.integrationId,
      OR: [
        {
          organizationId: user.managerOSOrganizationId,
          scope: 'organization',
        },
        {
          userId: user.managerOSUserId,
          scope: 'user',
        },
      ],
    },
  })

  if (!integration) {
    throw new Error('Integration not found or access denied')
  }

  // Check if link already exists
  const existing = await prisma.entityIntegrationLink.findFirst({
    where: {
      entityType: formData.entityType,
      entityId: formData.entityId,
      integrationId: formData.integrationId,
      externalEntityId: formData.externalEntityId,
    },
  })

  if (existing) {
    throw new Error('Link already exists')
  }

  // Create link
  await prisma.entityIntegrationLink.create({
    data: {
      organizationId: user.managerOSOrganizationId,
      entityType: formData.entityType,
      entityId: formData.entityId,
      integrationId: formData.integrationId,
      externalEntityId: formData.externalEntityId,
      externalEntityUrl: formData.externalEntityUrl,
      metadata: (formData.metadata || {}) as unknown as Prisma.InputJsonValue,
    },
  })

  revalidatePath(`/${formData.entityType.toLowerCase()}s/${formData.entityId}`)
  return { success: true }
}

export async function unlinkEntityFromIntegration(linkId: string) {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization')
  }

  // Verify link belongs to organization
  const link = await prisma.entityIntegrationLink.findFirst({
    where: {
      id: linkId,
      organizationId: user.managerOSOrganizationId,
    },
    include: {
      integration: true,
    },
  })

  if (!link) {
    throw new Error('Link not found or access denied')
  }

  // Check if user has permission (admin for org integrations, owner for user integrations)
  const isOrgIntegration = link.integration.scope === 'organization'
  if (isOrgIntegration) {
    // For org integrations, require admin
    await requireAdmin()
  } else {
    // For user integrations, require ownership
    if (link.integration.userId !== user.managerOSUserId) {
      throw new Error('You do not have permission to unlink this entity')
    }
  }

  await prisma.entityIntegrationLink.delete({
    where: { id: linkId },
  })

  revalidatePath(`/${link.entityType.toLowerCase()}s/${link.entityId}`)
  return { success: true }
}

export async function getEntityIntegrationLinks(
  entityType: string,
  entityId: string
) {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId) {
    return []
  }

  const links = await prisma.entityIntegrationLink.findMany({
    where: {
      entityType,
      entityId,
      organizationId: user.managerOSOrganizationId,
    },
    include: {
      integration: {
        select: {
          id: true,
          name: true,
          integrationType: true,
          scope: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return links.map(link => ({
    id: link.id,
    integration: link.integration,
    externalEntityId: link.externalEntityId,
    externalEntityUrl: link.externalEntityUrl,
    metadata: link.metadata,
    createdAt: link.createdAt,
  }))
}

export async function searchExternalEntities(formData: {
  integrationId: string
  query?: string
  startDate?: string
  endDate?: string
  limit?: number
}) {
  const user = await getCurrentUser()

  // Verify integration exists and user has access
  const integration = await prisma.integration.findFirst({
    where: {
      id: formData.integrationId,
      OR: [
        {
          organizationId: user.managerOSOrganizationId,
          scope: 'organization',
        },
        {
          userId: user.managerOSUserId,
          scope: 'user',
        },
      ],
    },
  })

  if (!integration) {
    throw new Error('Integration not found or access denied')
  }

  try {
    const integrationInstance = await getIntegration(formData.integrationId)
    if (!integrationInstance) {
      throw new Error('Failed to create integration instance')
    }

    const searchQuery = {
      query: formData.query,
      startDate: formData.startDate ? new Date(formData.startDate) : undefined,
      endDate: formData.endDate ? new Date(formData.endDate) : undefined,
      limit: formData.limit || 50,
    }

    const results = await integrationInstance.searchEntities(searchQuery)
    return { success: true, results }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Search failed',
      results: [],
    }
  }
}

// ============================================================================
// Migration helpers
// ============================================================================

async function checkMigrationStatus() {
  const user = await getCurrentUser()

  if (!user.managerOSUserId) {
    return { needsMigration: false }
  }

  // Check for old Jira credentials
  const jiraCreds = await prisma.userJiraCredentials.findUnique({
    where: { userId: user.managerOSUserId },
  })

  // Check for old GitHub credentials
  const githubCreds = await prisma.userGithubCredentials.findUnique({
    where: { userId: user.managerOSUserId },
  })

  // Check if already migrated
  const existingJira = await prisma.integration.findFirst({
    where: {
      userId: user.managerOSUserId,
      integrationType: 'jira',
      scope: 'user',
    },
  })

  const existingGithub = await prisma.integration.findFirst({
    where: {
      userId: user.managerOSUserId,
      integrationType: 'github',
      scope: 'user',
    },
  })

  return {
    needsMigration:
      (jiraCreds && !existingJira) || (githubCreds && !existingGithub),
    hasJira: !!jiraCreds,
    hasGithub: !!githubCreds,
    migratedJira: !!existingJira,
    migratedGithub: !!existingGithub,
  }
}

async function migrateJiraIntegration() {
  const user = await getCurrentUser()

  if (!user.managerOSUserId) {
    throw new Error('User ID is required')
  }

  if (!user.managerOSOrganizationId) {
    throw new Error(
      'User must belong to an organization to migrate integrations'
    )
  }

  // Get old credentials
  const oldCreds = await prisma.userJiraCredentials.findUnique({
    where: { userId: user.managerOSUserId },
  })

  if (!oldCreds) {
    throw new Error('No Jira credentials found to migrate')
  }

  // Check if already migrated
  const existing = await prisma.integration.findFirst({
    where: {
      userId: user.managerOSUserId,
      integrationType: 'jira',
      scope: 'user',
    },
  })

  if (existing) {
    throw new Error('Jira integration already migrated')
  }

  // Create new integration
  const integration = await prisma.integration.create({
    data: {
      userId: user.managerOSUserId,
      integrationType: 'jira',
      name: 'Jira',
      scope: 'user',
      isEnabled: true,
      encryptedCredentials: {
        jiraUsername: oldCreds.jiraUsername,
        encryptedApiKey: oldCreds.encryptedApiKey,
        jiraBaseUrl: oldCreds.jiraBaseUrl,
      } as unknown as Prisma.InputJsonValue,
    },
  })

  // Migrate person links
  const personLinks = await prisma.personJiraAccount.findMany({
    where: {
      person: {
        organizationId: user.managerOSOrganizationId,
      },
    },
  })

  for (const link of personLinks) {
    await prisma.entityIntegrationLink.create({
      data: {
        organizationId: user.managerOSOrganizationId,
        entityType: 'Person',
        entityId: link.personId,
        integrationId: integration.id,
        externalEntityId: link.jiraAccountId,
        metadata: {
          jiraEmail: link.jiraEmail,
          jiraDisplayName: link.jiraDisplayName,
        } as unknown as Prisma.InputJsonValue,
      },
    })
  }

  revalidatePath('/settings')
  return { success: true, integrationId: integration.id }
}

async function migrateGithubIntegration() {
  const user = await getCurrentUser()

  if (!user.managerOSUserId) {
    throw new Error('User ID is required')
  }

  if (!user.managerOSOrganizationId) {
    throw new Error(
      'User must belong to an organization to migrate integrations'
    )
  }

  // Get old credentials
  const oldCreds = await prisma.userGithubCredentials.findUnique({
    where: { userId: user.managerOSUserId },
  })

  if (!oldCreds) {
    throw new Error('No GitHub credentials found to migrate')
  }

  // Check if already migrated
  const existing = await prisma.integration.findFirst({
    where: {
      userId: user.managerOSUserId,
      integrationType: 'github',
      scope: 'user',
    },
  })

  if (existing) {
    throw new Error('GitHub integration already migrated')
  }

  // Create new integration
  const integration = await prisma.integration.create({
    data: {
      userId: user.managerOSUserId,
      integrationType: 'github',
      name: 'GitHub',
      scope: 'user',
      isEnabled: true,
      encryptedCredentials: {
        githubUsername: oldCreds.githubUsername,
        encryptedPat: oldCreds.encryptedPat,
      } as unknown as Prisma.InputJsonValue,
    },
  })

  // Migrate person links
  const personLinks = await prisma.personGithubAccount.findMany({
    where: {
      person: {
        organizationId: user.managerOSOrganizationId,
      },
    },
  })

  for (const link of personLinks) {
    await prisma.entityIntegrationLink.create({
      data: {
        organizationId: user.managerOSOrganizationId,
        entityType: 'Person',
        entityId: link.personId,
        integrationId: integration.id,
        externalEntityId: link.githubUsername,
        metadata: {
          githubDisplayName: link.githubDisplayName,
          githubEmail: link.githubEmail,
        } as unknown as Prisma.InputJsonValue,
      },
    })
  }

  revalidatePath('/settings')
  return { success: true, integrationId: integration.id }
}
