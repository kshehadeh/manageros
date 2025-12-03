'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/auth-utils'
import { z } from 'zod'
import type {
  Exception,
  ExceptionStatus,
  CreateExceptionInput,
  ExceptionFilters,
  ExceptionEntityType,
} from '@/types/exception'
import { InputJsonValue } from '@prisma/client/runtime/library'

// Validation schemas
const createExceptionSchema = z.object({
  ruleId: z.string().min(1),
  organizationId: z.string().min(1),
  severity: z.enum(['warning', 'urgent']),
  entityType: z.enum(['Person', 'Initiative', 'OneOnOne', 'FeedbackCampaign']),
  entityId: z.string().min(1),
  message: z.string().min(1),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

/**
 * Create a new exception
 * This is typically called by the evaluator/cron job
 */
export async function createException(
  input: CreateExceptionInput
): Promise<Exception> {
  const validatedData = createExceptionSchema.parse(input)

  const exception = await prisma.exception.create({
    data: {
      ruleId: validatedData.ruleId,
      organizationId: validatedData.organizationId,
      severity: validatedData.severity,
      entityType: validatedData.entityType,
      entityId: validatedData.entityId,
      message: validatedData.message,
      metadata: validatedData.metadata as InputJsonValue,
      status: 'active',
    },
  })

  return {
    id: exception.id,
    ruleId: exception.ruleId,
    organizationId: exception.organizationId,
    severity: exception.severity as 'warning' | 'urgent',
    entityType: exception.entityType as ExceptionEntityType,
    entityId: exception.entityId,
    message: exception.message,
    metadata: exception.metadata as Record<string, unknown> | null,
    notificationId: exception.notificationId,
    status: exception.status as ExceptionStatus,
    acknowledgedAt: exception.acknowledgedAt,
    ignoredAt: exception.ignoredAt,
    resolvedAt: exception.resolvedAt,
    acknowledgedBy: exception.acknowledgedBy,
    ignoredBy: exception.ignoredBy,
    resolvedBy: exception.resolvedBy,
    createdAt: exception.createdAt,
    updatedAt: exception.updatedAt,
  } as Exception
}

/**
 * Get exceptions with optional filters
 */
export async function getExceptions(
  filters?: ExceptionFilters
): Promise<Exception[]> {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization to view exceptions')
  }

  const where: {
    organizationId: string
    status?: ExceptionStatus
    severity?: 'warning' | 'urgent'
    ruleType?: string
    ruleId?: string
    entityType?: string
    entityId?: string
  } = {
    organizationId: user.managerOSOrganizationId,
  }

  if (filters?.status) {
    where.status = filters.status
  }
  if (filters?.severity) {
    where.severity = filters.severity
  }
  if (filters?.ruleId) {
    where.ruleId = filters.ruleId
  }
  if (filters?.entityType) {
    where.entityType = filters.entityType
  }
  if (filters?.entityId) {
    where.entityId = filters.entityId
  }

  // If filtering by ruleType, we need to join with the rule
  let exceptions
  if (filters?.ruleType) {
    exceptions = await prisma.exception.findMany({
      where: {
        organizationId: user.managerOSOrganizationId,
        status: filters.status,
        severity: filters.severity,
        entityType: filters.entityType,
        entityId: filters.entityId,
        rule: {
          ruleType: filters.ruleType,
        },
      },
      include: {
        rule: {
          select: {
            id: true,
            name: true,
            ruleType: true,
          },
        },
        notification: {
          select: {
            id: true,
            title: true,
            message: true,
            type: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  } else {
    exceptions = await prisma.exception.findMany({
      where,
      include: {
        rule: {
          select: {
            id: true,
            name: true,
            ruleType: true,
          },
        },
        notification: {
          select: {
            id: true,
            title: true,
            message: true,
            type: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  return exceptions.map(ex => ({
    id: ex.id,
    ruleId: ex.ruleId,
    organizationId: ex.organizationId,
    severity: ex.severity as 'warning' | 'urgent',
    entityType: ex.entityType as ExceptionEntityType,
    entityId: ex.entityId,
    message: ex.message,
    metadata: ex.metadata as Record<string, unknown> | null,
    notificationId: ex.notificationId,
    status: ex.status as ExceptionStatus,
    acknowledgedAt: ex.acknowledgedAt,
    ignoredAt: ex.ignoredAt,
    resolvedAt: ex.resolvedAt,
    acknowledgedBy: ex.acknowledgedBy,
    ignoredBy: ex.ignoredBy,
    resolvedBy: ex.resolvedBy,
    createdAt: ex.createdAt,
    updatedAt: ex.updatedAt,
    rule: ex.rule
      ? {
          id: ex.rule.id,
          name: ex.rule.name,
          ruleType: ex.rule.ruleType,
        }
      : undefined,
    notification: ex.notification
      ? {
          id: ex.notification.id,
          title: ex.notification.title,
          message: ex.notification.message,
          type: ex.notification.type,
        }
      : undefined,
  }))
}

/**
 * Get a single exception by ID
 */
export async function getExceptionById(id: string): Promise<Exception | null> {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization to view exceptions')
  }

  const exception = await prisma.exception.findFirst({
    where: {
      id,
      organizationId: user.managerOSOrganizationId,
    },
    include: {
      rule: {
        select: {
          id: true,
          name: true,
          ruleType: true,
        },
      },
      notification: {
        select: {
          id: true,
          title: true,
          message: true,
          type: true,
        },
      },
    },
  })

  return exception
    ? ({
        ...exception,
        metadata: exception.metadata as Record<string, unknown> | null,
      } as Exception)
    : null
}

/**
 * Acknowledge an exception
 */
export async function acknowledgeException(id: string): Promise<Exception> {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId) {
    throw new Error(
      'User must belong to an organization to acknowledge exceptions'
    )
  }

  if (!user.managerOSUserId) {
    throw new Error('User ID is required')
  }

  // Verify exception exists and belongs to user's organization
  const existingException = await prisma.exception.findFirst({
    where: {
      id,
      organizationId: user.managerOSOrganizationId,
    },
  })

  if (!existingException) {
    throw new Error('Exception not found or access denied')
  }

  const exception = await prisma.exception.update({
    where: { id },
    data: {
      status: 'acknowledged',
      acknowledgedAt: new Date(),
      acknowledgedBy: user.managerOSUserId,
    },
  })

  // Update linked notification response if exists
  if (existingException.notificationId && user.managerOSUserId) {
    await prisma.notificationResponse.upsert({
      where: {
        // eslint-disable-next-line camelcase
        notificationId_userId: {
          notificationId: existingException.notificationId,
          userId: user.managerOSUserId,
        },
      },
      update: {
        status: 'acknowledged',
        acknowledgedAt: new Date(),
      },
      create: {
        notificationId: existingException.notificationId,
        userId: user.managerOSUserId,
        status: 'acknowledged',
        acknowledgedAt: new Date(),
      },
    })
  }

  revalidatePath('/exceptions')
  return exception as Exception
}

/**
 * Ignore an exception
 */
export async function ignoreException(id: string): Promise<Exception> {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization to ignore exceptions')
  }

  if (!user.managerOSUserId) {
    throw new Error('User ID is required')
  }

  // Verify exception exists and belongs to user's organization
  const existingException = await prisma.exception.findFirst({
    where: {
      id,
      organizationId: user.managerOSOrganizationId,
    },
  })

  if (!existingException) {
    throw new Error('Exception not found or access denied')
  }

  const exception = await prisma.exception.update({
    where: { id },
    data: {
      status: 'ignored',
      ignoredAt: new Date(),
      ignoredBy: user.managerOSUserId,
    },
  })

  // Update linked notification response if exists
  if (existingException.notificationId && user.managerOSUserId) {
    await prisma.notificationResponse.upsert({
      where: {
        // eslint-disable-next-line camelcase
        notificationId_userId: {
          notificationId: existingException.notificationId,
          userId: user.managerOSUserId,
        },
      },
      update: {
        status: 'ignored',
        ignoredAt: new Date(),
      },
      create: {
        notificationId: existingException.notificationId,
        userId: user.managerOSUserId,
        status: 'ignored',
        ignoredAt: new Date(),
      },
    })
  }

  revalidatePath('/exceptions')
  return exception as Exception
}

/**
 * Resolve an exception
 */
export async function resolveException(id: string): Promise<Exception> {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization to resolve exceptions')
  }

  if (!user.managerOSUserId) {
    throw new Error('User ID is required')
  }

  // Verify exception exists and belongs to user's organization
  const existingException = await prisma.exception.findFirst({
    where: {
      id,
      organizationId: user.managerOSOrganizationId,
    },
  })

  if (!existingException) {
    throw new Error('Exception not found or access denied')
  }

  const exception = await prisma.exception.update({
    where: { id },
    data: {
      status: 'resolved',
      resolvedAt: new Date(),
      resolvedBy: user.managerOSUserId,
    },
  })

  // Update linked notification response if exists
  if (existingException.notificationId && user.managerOSUserId) {
    await prisma.notificationResponse.upsert({
      where: {
        // eslint-disable-next-line camelcase
        notificationId_userId: {
          notificationId: existingException.notificationId,
          userId: user.managerOSUserId,
        },
      },
      update: {
        status: 'resolved',
        resolvedAt: new Date(),
      },
      create: {
        notificationId: existingException.notificationId,
        userId: user.managerOSUserId,
        status: 'resolved',
        resolvedAt: new Date(),
      },
    })
  }

  revalidatePath('/exceptions')
  return exception as Exception
}

/**
 * Link an exception to a notification
 * This is typically called when creating a notification for an exception
 */
export async function linkExceptionToNotification(
  exceptionId: string,
  notificationId: string
): Promise<Exception> {
  const exception = await prisma.exception.update({
    where: { id: exceptionId },
    data: { notificationId },
  })

  return exception as Exception
}
