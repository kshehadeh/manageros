/**
 * Max Reports Tolerance Rule
 * Checks if users have more direct reports than the threshold
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
 * Configuration for max reports rule
 */
export interface MaxReportsConfig {
  maxReports: number
}

/**
 * Zod schema for max reports config
 */
export const maxReportsConfigSchema = z.object({
  maxReports: z.number().int().positive(),
})

// Form component is imported from a separate client file
import { MaxReportsFormFields } from './max-reports-rule-form'
export { MaxReportsFormFields }

/**
 * Create exception for max reports issue
 */
async function createExceptionForMaxReports(
  rule: ToleranceRule,
  personId: string,
  severity: 'warning' | 'urgent',
  maxReports: number,
  currentCount: number
): Promise<void> {
  const person = await prisma.person.findUnique({
    where: { id: personId },
  })

  const personName = person?.name || 'Unknown'

  const message = `${personName} has ${currentCount} direct reports (threshold: ${maxReports})`

  const exceptionInput: CreateExceptionInput = {
    ruleId: rule.id,
    organizationId: rule.organizationId,
    severity,
    entityType: 'Person',
    entityId: personId,
    message,
    metadata: {
      personId,
      personName,
      maxReports,
      currentCount,
    },
  }

  const exception = await createException(exceptionInput)

  // Create notification for the person
  const personWithUser = await prisma.person.findUnique({
    where: { id: personId },
    include: { user: true },
  })

  if (personWithUser?.user?.id) {
    const notification = await createSystemNotification({
      title: 'Warning: Maximum Reports Exceeded',
      message,
      type: 'warning',
      organizationId: rule.organizationId,
      userId: personWithUser.user.id,
      metadata: {
        exceptionId: exception.id,
        entityType: 'Person',
        entityId: personId,
        navigationPath: `/people/${personId}`,
      },
    })

    await linkExceptionToNotification(exception.id, notification.id)
  }
}

/**
 * Evaluate max reports rule
 */
async function evaluateMaxReports(rule: ToleranceRule): Promise<number> {
  const config = rule.config as MaxReportsConfig
  let exceptionsCreated = 0

  // Get all people with direct reports
  const people = await prisma.person.findMany({
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

  if (people.length === 0) {
    return 0
  }

  // Filter people that exceed threshold
  const peopleExceedingThreshold = people.filter(
    p => p._count.reports > config.maxReports
  )

  if (peopleExceedingThreshold.length === 0) {
    return 0
  }

  // Batch check existing exceptions
  const personIds = peopleExceedingThreshold.map(p => p.id)
  const existingExceptions = await getExistingExceptions(
    rule.id,
    rule.organizationId,
    'Person',
    personIds
  )

  // Process people that need exceptions
  for (const person of peopleExceedingThreshold) {
    // Skip if exception already exists
    if (existingExceptions.has(person.id)) {
      continue
    }

    await createExceptionForMaxReports(
      rule,
      person.id,
      'warning',
      config.maxReports,
      person._count.reports
    )
    exceptionsCreated++
  }

  return exceptionsCreated
}

/**
 * Max Reports Rule Module
 */
export const maxReportsRule: ToleranceRuleModule<MaxReportsConfig> = {
  ruleType: 'max_reports',
  configSchema: maxReportsConfigSchema,
  FormFields: MaxReportsFormFields,
  evaluate: evaluateMaxReports,
}
