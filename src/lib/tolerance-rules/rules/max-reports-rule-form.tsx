'use client'

/**
 * Form fields component for max reports rule
 */

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { MaxReportsConfig } from './max-reports-rule'

export function MaxReportsFormFields({
  config,
  onChange,
}: {
  config: MaxReportsConfig
  onChange: (config: MaxReportsConfig) => void
}) {
  return (
    <div className='space-y-2'>
      <Label htmlFor='maxReports'>Maximum Reports</Label>
      <Input
        id='maxReports'
        type='number'
        min='1'
        value={config.maxReports}
        onChange={e =>
          onChange({
            ...config,
            maxReports: parseInt(e.target.value) || 0,
          })
        }
        required
      />
      <p className='text-sm text-muted-foreground'>
        Users with more than this number of direct reports will trigger an
        exception.
      </p>
    </div>
  )
}
