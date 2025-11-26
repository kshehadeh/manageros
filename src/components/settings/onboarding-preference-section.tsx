'use client'

import { useUserSettings } from '@/lib/hooks/use-user-settings'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Sparkles } from 'lucide-react'

export function OnboardingPreferenceSection() {
  const { settings, isLoaded, updateSetting } = useUserSettings()

  if (!isLoaded) {
    return null
  }

  return (
    <div className='flex items-start gap-3'>
      <Checkbox
        id='show-onboarding'
        checked={settings.showOnboarding}
        onCheckedChange={checked =>
          updateSetting('showOnboarding', checked === true)
        }
      />
      <div className='flex-1 space-y-1'>
        <Label
          htmlFor='show-onboarding'
          className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2'
        >
          <Sparkles className='h-4 w-4' />
          Show onboarding guide on dashboard
        </Label>
        <p className='text-xs text-muted-foreground'>
          Display the welcome onboarding section on your dashboard to help you
          get started with setting up your organization.
        </p>
      </div>
    </div>
  )
}
