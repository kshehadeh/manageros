'use client'

/**
 * Form fields component for manager span rule
 */

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ManagerSpanConfig } from './manager-span-rule'

export function ManagerSpanFormFields({
  config,
  onChange,
}: {
  config: ManagerSpanConfig
  onChange: (config: ManagerSpanConfig) => void
}) {
  return (
    <div className='space-y-2'>
      <Label htmlFor='maxDirectReports'>Maximum Direct Reports</Label>
      <Input
        id='maxDirectReports'
        type='number'
        min='1'
        value={config.maxDirectReports}
        onChange={e =>
          onChange({
            ...config,
            maxDirectReports: parseInt(e.target.value) || 0,
          })
        }
        required
      />
    </div>
  )
}
