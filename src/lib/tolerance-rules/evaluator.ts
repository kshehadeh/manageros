/**
 * Exception evaluation logic for tolerance rules
 */

import { prisma } from '@/lib/db'
import type {
  ToleranceRule,
  ToleranceRuleType,
  ToleranceRuleConfig,
} from '@/types/tolerance-rule'
import { getRuleEvaluator } from './registry'

/**
 * Evaluate all enabled rules for an organization
 */
export async function evaluateAllRules(organizationId: string): Promise<{
  exceptionsCreated: number
  errors: string[]
}> {
  const rules = await prisma.organizationToleranceRule.findMany({
    where: {
      organizationId,
      isEnabled: true,
    },
  })

  let exceptionsCreated = 0
  const errors: string[] = []

  for (const rule of rules) {
    try {
      const count = await evaluateRule({
        ...rule,
        ruleType: rule.ruleType as ToleranceRuleType,
        config: rule.config as unknown as ToleranceRuleConfig,
      } as ToleranceRule)
      exceptionsCreated += count
    } catch (error) {
      errors.push(
        `Error evaluating rule ${rule.id} (${rule.name}): ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      )
    }
  }

  return { exceptionsCreated, errors }
}

/**
 * Evaluate a single rule and create exceptions if thresholds are exceeded
 */
async function evaluateRule(rule: ToleranceRule): Promise<number> {
  const evaluator = getRuleEvaluator(rule.ruleType)
  return evaluator(rule)
}
