/**
 * Base interfaces and utilities for tolerance rules
 */

import type { ToleranceRule, ToleranceRuleType } from '@/types/tolerance-rule'
import type { z } from 'zod'

/**
 * Interface that all tolerance rule modules must implement
 * Note: FormFields are not included here as they are client components
 * and should only be in the client-side form-registry.ts
 */
export interface ToleranceRuleModule<Config = unknown> {
  /**
   * Rule type identifier
   */
  ruleType: ToleranceRuleType

  /**
   * Zod schema for validating the rule's configuration
   */
  configSchema: z.ZodSchema<Config>

  /**
   * Evaluate the rule and create exceptions if thresholds are exceeded
   * Returns the number of exceptions created
   */
  evaluate: (rule: ToleranceRule) => Promise<number>
}

/**
 * Shared utility: Batch check existing exceptions for multiple entities
 * Returns a Set of entityIds that already have active exceptions
 */
export async function getExistingExceptions(
  ruleId: string,
  organizationId: string,
  entityType: string,
  entityIds: string[]
): Promise<Set<string>> {
  const { prisma } = await import('@/lib/db')

  if (entityIds.length === 0) {
    return new Set()
  }

  const existingExceptions = await prisma.exception.findMany({
    where: {
      ruleId,
      organizationId,
      entityType,
      entityId: {
        in: entityIds,
      },
      status: 'active',
    },
    select: {
      entityId: true,
    },
  })

  return new Set(existingExceptions.map(e => e.entityId))
}
