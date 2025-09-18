'use client'

import { useUserSettings } from '@/lib/hooks/use-user-settings'

/**
 * Example component showing how to use the user settings system
 * This demonstrates how other components can easily integrate with the settings
 */
export function UserSettingsExample() {
  const { getSetting, updateSetting, isLoaded } = useUserSettings()

  // Example: How to use a setting in another component
  const peopleViewMode = getSetting('peopleViewMode')

  const handleToggleViewMode = () => {
    const newMode = peopleViewMode === 'chart' ? 'list' : 'chart'
    updateSetting('peopleViewMode', newMode)
  }

  if (!isLoaded) {
    return <div>Loading settings...</div>
  }

  return (
    <div className='p-4 border rounded-lg'>
      <h3 className='text-lg font-semibold mb-2'>User Settings Example</h3>
      <p className='text-sm text-gray-600 mb-4'>
        Current people view mode: <strong>{peopleViewMode}</strong>
      </p>
      <button
        onClick={handleToggleViewMode}
        className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'
      >
        Toggle View Mode
      </button>

      <div className='mt-4 text-xs text-gray-500'>
        <p>This demonstrates how any component can:</p>
        <ul className='list-disc list-inside mt-2'>
          <li>
            Read current settings with <code>getSetting()</code>
          </li>
          <li>
            Update settings with <code>updateSetting()</code>
          </li>
          <li>
            Check if settings are loaded with <code>isLoaded</code>
          </li>
        </ul>
      </div>
    </div>
  )
}

/**
 * Example of how to add a new setting:
 *
 * 1. Add the setting to UserSettings interface in user-settings.ts:
 *    theme: 'light' | 'dark'
 *
 * 2. Add default value to DEFAULT_USER_SETTINGS:
 *    theme: 'dark'
 *
 * 3. Use in any component:
 *    const theme = getSetting('theme')
 *    updateSetting('theme', 'light')
 */
