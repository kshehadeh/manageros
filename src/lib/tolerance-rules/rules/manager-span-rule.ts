/**
 * Manager Span Tolerance Rule
 * Checks if managers have more direct reports than the threshold
 */

import { z } from 'zod'
import { prisma } from '@/lib/db'
import {
  createException,
  linkExceptionToNotification,
} from '@/lib/actions/exceptions'
import { createSystemNotification } from '@/lib/actions/notification'
import { getExistingExceptions } from '../base-rule'
import type { ToleranceRule } from '@/types/tolerance-rule'
import type { CreateExceptionInput } from '@/types/exception'
import type { ToleranceRuleModule } from '../base-rule'

/**
 * Configuration for manager span rule
 */
export interface ManagerSpanConfig {
  maxDirectReports: number
}

/**
 * Zod schema for manager span config
 */
export const managerSpanConfigSchema = z.object({
  maxDirectReports: z.number().int().positive(),
})

// Form component is imported from a separate client file
import { ManagerSpanFormFields } from './manager-span-rule-form'
export { ManagerSpanFormFields }

/**
 * Create exception for manager span issue
 */
async function createExceptionForManagerSpan(
  rule: ToleranceRule,
  managerId: string,
  severity: 'warning' | 'urgent',
  maxDirectReports: number,
  currentCount: number
): Promise<void> {
  const manager = await prisma.person.findUnique({
    where: { id: managerId },
  })

  const managerName = manager?.name || 'Unknown'

  const message = `${managerName} has ${currentCount} direct reports (threshold: ${maxDirectReports})`

  const exceptionInput: CreateExceptionInput = {
    ruleId: rule.id,
    organizationId: rule.organizationId,
    severity,
    entityType: 'Person',
    entityId: managerId,
    message,
    metadata: {
      managerId,
      managerName,
      maxDirectReports,
      currentCount,
    },
  }

  const exception = await createException(exceptionInput)

  // Create notification for the manager
  const managerWithUser = await prisma.person.findUnique({
    where: { id: managerId },
    include: { user: true },
  })

  if (managerWithUser?.user?.id) {
    const notification = await createSystemNotification({
      title: 'Warning: Manager Span of Control',
      message,
      type: 'warning',
      organizationId: rule.organizationId,
      userId: managerWithUser.user.id,
      metadata: {
        exceptionId: exception.id,
        entityType: 'Person',
        entityId: managerId,
        navigationPath: `/people/${managerId}`,
      },
    })

    await linkExceptionToNotification(exception.id, notification.id)
  }
}

/**
 * Evaluate manager span rule
 */
async function evaluateManagerSpan(rule: ToleranceRule): Promise<number> {
  const config = rule.config as ManagerSpanConfig
  let exceptionsCreated = 0

  // Get all managers with direct reports
  const managers = await prisma.person.findMany({
    where: {
      organizationId: rule.organizationId,
      status: 'active',
      reports: {
        some: {
          status: 'active',
        },
      },
    },
    include: {
      _count: {
        select: {
          reports: {
            where: {
              status: 'active',
            },
          },
        },
      },
    },
  })

  if (managers.length === 0) {
    return 0
  }

  // Filter managers that exceed threshold
  const managersExceedingThreshold = managers.filter(
    m => m._count.reports > config.maxDirectReports
  )

  if (managersExceedingThreshold.length === 0) {
    return 0
  }

  // Batch check existing exceptions
  const managerIds = managersExceedingThreshold.map(m => m.id)
  const existingExceptions = await getExistingExceptions(
    rule.id,
    rule.organizationId,
    'Person',
    managerIds
  )

  // Process managers that need exceptions
  for (const manager of managersExceedingThreshold) {
    // Skip if exception already exists
    if (existingExceptions.has(manager.id)) {
      continue
    }

    await createExceptionForManagerSpan(
      rule,
      manager.id,
      'warning',
      config.maxDirectReports,
      manager._count.reports
    )
    exceptionsCreated++
  }

  return exceptionsCreated
}

/**
 * Manager Span Rule Module
 */
export const managerSpanRule: ToleranceRuleModule<ManagerSpanConfig> = {
  ruleType: 'manager_span',
  configSchema: managerSpanConfigSchema,
  FormFields: ManagerSpanFormFields,
  evaluate: evaluateManagerSpan,
}
