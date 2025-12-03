/**
 * Types for tolerance rules and their configurations
 */

export type ToleranceRuleType =
  | 'one_on_one_frequency'
  | 'initiative_checkin'
  | 'feedback_360'
  | 'manager_span'

export interface OneOnOneFrequencyConfig {
  warningThresholdDays: number
  urgentThresholdDays: number
}

export interface InitiativeCheckInConfig {
  warningThresholdDays: number
}

export interface Feedback360Config {
  warningThresholdMonths: number
}

export interface ManagerSpanConfig {
  maxDirectReports: number
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
