'use client'

/**
 * Form fields component for one-on-one frequency rule
 */

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { OneOnOneFrequencyConfig } from './one-on-one-frequency-rule'

export function OneOnOneFrequencyFormFields({
  config,
  onChange,
}: {
  config: OneOnOneFrequencyConfig
  onChange: (config: OneOnOneFrequencyConfig) => void
}) {
  return (
    <>
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
      <div className='space-y-2'>
        <Label htmlFor='urgentThresholdDays'>Urgent Threshold (days)</Label>
        <Input
          id='urgentThresholdDays'
          type='number'
          min='1'
          value={config.urgentThresholdDays}
          onChange={e =>
            onChange({
              ...config,
              urgentThresholdDays: parseInt(e.target.value) || 0,
            })
          }
          required
        />
      </div>
      <div className='flex items-center space-x-2'>
        <input
          type='checkbox'
          id='onlyFullTimeEmployees'
          checked={config.onlyFullTimeEmployees ?? false}
          onChange={e =>
            onChange({
              ...config,
              onlyFullTimeEmployees: e.target.checked,
            })
          }
          className='h-4 w-4 rounded border-gray-300'
        />
        <Label htmlFor='onlyFullTimeEmployees' className='cursor-pointer'>
          Only check against full-time employees
        </Label>
      </div>
    </>
  )
}
