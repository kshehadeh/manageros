/* eslint-disable camelcase */
/**
 * Registry mapping tolerance rule types to their modules
 */

import type { ToleranceRuleType } from '@/types/tolerance-rule'
import type { ToleranceRuleModule } from './base-rule'

// Import rule modules
import { oneOnOneFrequencyRule } from './rules/one-on-one-frequency-rule'
import { initiativeCheckInRule } from './rules/initiative-checkin-rule'
import { feedback360Rule } from './rules/feedback-360-rule'
import { managerSpanRule } from './rules/manager-span-rule'

/**
 * Registry of all tolerance rule modules
 * Using type assertion to allow different config types in the registry
 */
export const toleranceRuleRegistry: Record<
  ToleranceRuleType,
  ToleranceRuleModule
> = {
  one_on_one_frequency: oneOnOneFrequencyRule as ToleranceRuleModule,
  initiative_checkin: initiativeCheckInRule as ToleranceRuleModule,
  feedback_360: feedback360Rule as ToleranceRuleModule,
  manager_span: managerSpanRule as ToleranceRuleModule,
}

/**
 * Get a rule module by type
 */
export function getRuleModule(
  ruleType: ToleranceRuleType
): ToleranceRuleModule {
  const module = toleranceRuleRegistry[ruleType]
  if (!module) {
    throw new Error(`Unknown rule type: ${ruleType}`)
  }
  return module
}

/**
 * Get validation schema for a rule type
 */
export function getRuleConfigSchema(ruleType: ToleranceRuleType) {
  return getRuleModule(ruleType).configSchema
}

/**
 * Get evaluation function for a rule type
 */
export function getRuleEvaluator(ruleType: ToleranceRuleType) {
  return getRuleModule(ruleType).evaluate
}
