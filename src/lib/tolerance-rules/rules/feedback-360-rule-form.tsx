'use client'

/**
 * Form fields component for feedback 360 rule
 */

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Feedback360Config } from './feedback-360-rule'

export function Feedback360FormFields({
  config,
  onChange,
}: {
  config: Feedback360Config
  onChange: (config: Feedback360Config) => void
}) {
  return (
    <div className='space-y-2'>
      <Label htmlFor='warningThresholdMonths'>Warning Threshold (months)</Label>
      <Input
        id='warningThresholdMonths'
        type='number'
        min='1'
        value={config.warningThresholdMonths}
        onChange={e =>
          onChange({
            ...config,
            warningThresholdMonths: parseInt(e.target.value) || 0,
          })
        }
        required
      />
    </div>
  )
}
