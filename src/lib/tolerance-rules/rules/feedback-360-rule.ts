/**
 * Feedback 360 Tolerance Rule
 * Checks if people have had feedback campaigns within the threshold
 */

import { z } from 'zod'
import { prisma } from '@/lib/db'
import { createException } from '@/lib/actions/exceptions'
import { getExistingExceptions } from '../base-rule'
import type { ToleranceRule } from '@/types/tolerance-rule'
import type { CreateExceptionInput } from '@/types/exception'
import type { ToleranceRuleModule } from '../base-rule'

/**
 * Configuration for feedback 360 rule
 */
export interface Feedback360Config {
  warningThresholdMonths: number
}

/**
 * Zod schema for feedback 360 config
 */
const feedback360ConfigSchema = z.object({
  warningThresholdMonths: z.number().int().positive(),
})

/**
 * Create exception for 360 feedback issue
 */
async function createExceptionForFeedback360(
  rule: ToleranceRule,
  personId: string,
  severity: 'warning' | 'urgent',
  thresholdMonths: number,
  monthsSince: number
): Promise<void> {
  const person = await prisma.person.findUnique({
    where: { id: personId },
    include: {
      manager: true,
    },
  })

  const personName = person?.name || 'Unknown'

  const message =
    monthsSince === Infinity
      ? `${personName} has not had a 360 feedback campaign (threshold: ${thresholdMonths} months)`
      : `${personName} has not had a 360 feedback campaign in ${monthsSince} months (threshold: ${thresholdMonths} months)`

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
      thresholdMonths,
      monthsSince: monthsSince === Infinity ? null : monthsSince,
    },
  }

  await createException(exceptionInput)
}

/**
 * Evaluate 360 feedback rule
 */
async function evaluateFeedback360(rule: ToleranceRule): Promise<number> {
  const config = rule.config as Feedback360Config
  let exceptionsCreated = 0

  // Get all active people in the organization
  const people = await prisma.person.findMany({
    where: {
      organizationId: rule.organizationId,
      status: 'active',
    },
    select: {
      id: true,
    },
  })

  if (people.length === 0) {
    return 0
  }

  const personIds = people.map(p => p.id)

  // Batch fetch all feedback campaigns for these people
  // We'll group by personId in memory to get the most recent one per person
  const allCampaigns = await prisma.feedbackCampaign.findMany({
    where: {
      targetPersonId: {
        in: personIds,
      },
    },
    select: {
      targetPersonId: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  // Create a map of personId -> lastCampaignDate (most recent per person)
  const lastCampaignMap = new Map<string, Date>()
  for (const campaign of allCampaigns) {
    if (!lastCampaignMap.has(campaign.targetPersonId)) {
      lastCampaignMap.set(campaign.targetPersonId, campaign.createdAt)
    }
  }

  // Batch check existing exceptions
  const existingExceptions = await getExistingExceptions(
    rule.id,
    rule.organizationId,
    'Person',
    personIds
  )

  const now = Date.now()

  // Process people in batches to avoid memory issues
  const BATCH_SIZE = 100
  for (let i = 0; i < people.length; i += BATCH_SIZE) {
    const batch = people.slice(i, i + BATCH_SIZE)

    for (const person of batch) {
      // Skip if exception already exists
      if (existingExceptions.has(person.id)) {
        continue
      }

      const lastCampaign = lastCampaignMap.get(person.id)
      let monthsSince: number

      if (!lastCampaign) {
        // No feedback campaign ever recorded
        monthsSince = Infinity
      } else {
        monthsSince = Math.floor(
          (now - lastCampaign.getTime()) / (1000 * 60 * 60 * 24 * 30)
        )
      }

      if (monthsSince > config.warningThresholdMonths) {
        await createExceptionForFeedback360(
          rule,
          person.id,
          'warning',
          config.warningThresholdMonths,
          monthsSince
        )
        exceptionsCreated++
      }
    }
  }

  return exceptionsCreated
}

/**
 * Feedback 360 Rule Module
 */
export const feedback360Rule: ToleranceRuleModule<Feedback360Config> = {
  ruleType: 'feedback_360',
  configSchema: feedback360ConfigSchema,
  evaluate: evaluateFeedback360,
}
