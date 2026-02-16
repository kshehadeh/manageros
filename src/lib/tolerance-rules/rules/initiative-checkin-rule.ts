/**
 * Initiative Check-In Tolerance Rule
 * Checks if initiatives have had check-ins within the threshold
 */

import { z } from 'zod'
import { prisma } from '@/lib/db'
import { createException } from '@/lib/actions/exceptions'
import { getExistingExceptions } from '../base-rule'
import type { ToleranceRule } from '@/types/tolerance-rule'
import type { CreateExceptionInput } from '@/types/exception'
import type { ToleranceRuleModule } from '../base-rule'

/**
 * Configuration for initiative check-in rule
 */
export interface InitiativeCheckInConfig {
  warningThresholdDays: number
}

/**
 * Zod schema for initiative check-in config
 */
const initiativeCheckInConfigSchema = z.object({
  warningThresholdDays: z.number().int().positive(),
})

/**
 * Create exception for initiative check-in issue
 */
async function createExceptionForInitiative(
  rule: ToleranceRule,
  initiativeId: string,
  severity: 'warning' | 'urgent',
  thresholdDays: number,
  daysSince: number
): Promise<void> {
  const initiative = await prisma.initiative.findUnique({
    where: { id: initiativeId },
  })

  const initiativeName = initiative?.title || 'Unknown Initiative'

  const message =
    daysSince === Infinity
      ? `Initiative "${initiativeName}" has no check-ins (threshold: ${thresholdDays} days)`
      : `Initiative "${initiativeName}" has not had a check-in in ${daysSince} days (threshold: ${thresholdDays} days)`

  const exceptionInput: CreateExceptionInput = {
    ruleId: rule.id,
    organizationId: rule.organizationId,
    severity,
    entityType: 'Initiative',
    entityId: initiativeId,
    message,
    metadata: {
      initiativeId,
      initiativeName,
      thresholdDays,
      daysSince: daysSince === Infinity ? null : daysSince,
    },
  }

  await createException(exceptionInput)
}

/**
 * Evaluate initiative check-in rule
 */
async function evaluateInitiativeCheckIn(rule: ToleranceRule): Promise<number> {
  const config = rule.config as InitiativeCheckInConfig
  let exceptionsCreated = 0

  // Get all active initiatives
  const initiatives = await prisma.initiative.findMany({
    where: {
      organizationId: rule.organizationId,
      status: {
        in: ['planned', 'in_progress'],
      },
    },
    select: {
      id: true,
    },
  })

  if (initiatives.length === 0) {
    return 0
  }

  const initiativeIds = initiatives.map(i => i.id)

  // Batch fetch last check-in date for all initiatives
  const allCheckIns = await prisma.checkIn.findMany({
    where: {
      initiativeId: {
        in: initiativeIds,
      },
    },
    select: {
      initiativeId: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  // Create a map of initiativeId -> lastCheckInDate (most recent per initiative)
  const lastCheckInMap = new Map<string, Date>()
  for (const checkIn of allCheckIns) {
    if (!lastCheckInMap.has(checkIn.initiativeId)) {
      lastCheckInMap.set(checkIn.initiativeId, checkIn.createdAt)
    }
  }

  // Batch check existing exceptions
  const existingExceptions = await getExistingExceptions(
    rule.id,
    rule.organizationId,
    'Initiative',
    initiativeIds
  )

  const now = Date.now()

  // Process initiatives in batches
  const BATCH_SIZE = 100
  for (let i = 0; i < initiatives.length; i += BATCH_SIZE) {
    const batch = initiatives.slice(i, i + BATCH_SIZE)

    for (const initiative of batch) {
      // Skip if exception already exists
      if (existingExceptions.has(initiative.id)) {
        continue
      }

      const lastCheckIn = lastCheckInMap.get(initiative.id)

      if (!lastCheckIn) {
        // No check-in ever recorded - create exception if threshold is exceeded
        const daysSince = Infinity
        if (daysSince > config.warningThresholdDays) {
          await createExceptionForInitiative(
            rule,
            initiative.id,
            'warning',
            config.warningThresholdDays,
            daysSince
          )
          exceptionsCreated++
        }
        continue
      }

      const daysSince = Math.floor(
        (now - lastCheckIn.getTime()) / (1000 * 60 * 60 * 24)
      )

      if (daysSince > config.warningThresholdDays) {
        await createExceptionForInitiative(
          rule,
          initiative.id,
          'warning',
          config.warningThresholdDays,
          daysSince
        )
        exceptionsCreated++
      }
    }
  }

  return exceptionsCreated
}

/**
 * Initiative Check-In Rule Module
 */
export const initiativeCheckInRule: ToleranceRuleModule<InitiativeCheckInConfig> =
  {
    ruleType: 'initiative_checkin',
    configSchema: initiativeCheckInConfigSchema,
    evaluate: evaluateInitiativeCheckIn,
  }
