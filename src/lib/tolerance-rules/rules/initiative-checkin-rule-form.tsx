'use client'

/**
 * Form fields component for initiative check-in rule
 */

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { InitiativeCheckInConfig } from './initiative-checkin-rule'

export function InitiativeCheckInFormFields({
  config,
  onChange,
}: {
  config: InitiativeCheckInConfig
  onChange: (config: InitiativeCheckInConfig) => void
}) {
  return (
    <div className='space-y-2'>
      <Label htmlFor='warningThresholdDays'>Warning Threshold (days)</Label>
      <Input
        id='warningThresholdDays'
        type='number'
        min='1'
        value={config.warningThresholdDays}
        onChange={e =>
          onChange({
            ...config,
            warningThresholdDays: parseInt(e.target.value) || 0,
          })
        }
        required
      />
    </div>
  )
}
