/**
 * Types for tolerance rules and their configurations
 */

export type ToleranceRuleType =
  | 'one_on_one_frequency'
  | 'initiative_checkin'
  | 'feedback_360'
  | 'manager_span'

// Import config types from rule modules
import type { OneOnOneFrequencyConfig } from '@/lib/tolerance-rules/rules/one-on-one-frequency-rule'
import type { InitiativeCheckInConfig } from '@/lib/tolerance-rules/rules/initiative-checkin-rule'
import type { Feedback360Config } from '@/lib/tolerance-rules/rules/feedback-360-rule'
import type { ManagerSpanConfig } from '@/lib/tolerance-rules/rules/manager-span-rule'

// Re-export for backward compatibility
export type {
  OneOnOneFrequencyConfig,
  InitiativeCheckInConfig,
  Feedback360Config,
  ManagerSpanConfig,
}

export type ToleranceRuleConfig =
  | OneOnOneFrequencyConfig
  | InitiativeCheckInConfig
  | Feedback360Config
  | ManagerSpanConfig

export interface ToleranceRule {
  id: string
  organizationId: string
  ruleType: ToleranceRuleType
  name: string
  description: string | null
  isEnabled: boolean
  config: ToleranceRuleConfig
  createdAt: Date
  updatedAt: Date
}

export interface CreateToleranceRuleInput {
  ruleType: ToleranceRuleType
  name: string
  description?: string
  isEnabled?: boolean
  config: ToleranceRuleConfig
}

export interface UpdateToleranceRuleInput {
  name?: string
  description?: string
  isEnabled?: boolean
  config?: ToleranceRuleConfig
}
