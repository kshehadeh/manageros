/* eslint-disable camelcase */
/**
 * Client-safe registry for tolerance rule form components
 * This registry only exports form components and can be safely imported in client components
 */

'use client'

import React from 'react'
import type { ToleranceRuleType } from '@/types/tolerance-rule'

// Import form components directly (client components)
import { OneOnOneFrequencyFormFields } from './rules/one-on-one-frequency-rule-form'
import { InitiativeCheckInFormFields } from './rules/initiative-checkin-rule-form'
import { Feedback360FormFields } from './rules/feedback-360-rule-form'
import { ManagerSpanFormFields } from './rules/manager-span-rule-form'
import { MaxReportsFormFields } from './rules/max-reports-rule-form'

/**
 * Registry of form components (client-safe)
 * Using type assertion to allow different config types in the registry
 */
export const toleranceRuleFormRegistry: Record<
  ToleranceRuleType,
  React.ComponentType<{
    config: unknown
    onChange: (config: unknown) => void
  }>
> = {
  one_on_one_frequency: OneOnOneFrequencyFormFields as React.ComponentType<{
    config: unknown
    onChange: (config: unknown) => void
  }>,
  initiative_checkin: InitiativeCheckInFormFields as React.ComponentType<{
    config: unknown
    onChange: (config: unknown) => void
  }>,
  feedback_360: Feedback360FormFields as React.ComponentType<{
    config: unknown
    onChange: (config: unknown) => void
  }>,
  manager_span: ManagerSpanFormFields as React.ComponentType<{
    config: unknown
    onChange: (config: unknown) => void
  }>,
  max_reports: MaxReportsFormFields as React.ComponentType<{
    config: unknown
    onChange: (config: unknown) => void
  }>,
}

/**
 * Get form component for a rule type (client-safe)
 */
export function getRuleFormFields(ruleType: ToleranceRuleType) {
  const FormFields = toleranceRuleFormRegistry[ruleType]
  if (!FormFields) {
    throw new Error(`Unknown rule type: ${ruleType}`)
  }
  return FormFields
}
