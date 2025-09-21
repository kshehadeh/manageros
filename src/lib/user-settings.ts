/**
 * User-specific UI settings stored in browser localStorage
 * Each setting is scoped to the current user's ID to prevent conflicts
 */

export interface UserSettings {
  // People page settings
  peopleViewMode: 'list' | 'chart'

  // Theme settings
  theme: 'light' | 'dark'

  // Future expandable settings can be added here:
  // sidebarCollapsed: boolean
  // defaultPageSize: number
  // tasksViewMode: 'list' | 'kanban' | 'calendar'
  // initiativesViewMode: 'list' | 'timeline' | 'board'
  // etc.
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
  peopleViewMode: 'chart',
  theme: 'dark',
  // When adding new settings, add their defaults here:
  // sidebarCollapsed: false
  // defaultPageSize: 25
}

/**
 * Get a user-specific key for localStorage
 */
function getUserSettingsKey(userId: string): string {
  return `manageros_user_settings_${userId}`
}

/**
 * Load user settings from localStorage
 */
export function loadUserSettings(userId: string): UserSettings {
  if (typeof window === 'undefined') {
    return DEFAULT_USER_SETTINGS
  }

  try {
    const key = getUserSettingsKey(userId)
    const stored = localStorage.getItem(key)

    if (!stored) {
      return DEFAULT_USER_SETTINGS
    }

    const parsed = JSON.parse(stored) as Partial<UserSettings>

    // Merge with defaults to handle new settings being added
    return {
      ...DEFAULT_USER_SETTINGS,
      ...parsed,
    }
  } catch (error) {
    console.warn('Failed to load user settings:', error)
    return DEFAULT_USER_SETTINGS
  }
}

/**
 * Save user settings to localStorage
 */
export function saveUserSettings(userId: string, settings: UserSettings): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    const key = getUserSettingsKey(userId)
    localStorage.setItem(key, JSON.stringify(settings))
  } catch (error) {
    console.warn('Failed to save user settings:', error)
  }
}

/**
 * Update a specific setting for a user
 */
export function updateUserSetting<K extends keyof UserSettings>(
  userId: string,
  key: K,
  value: UserSettings[K]
): void {
  const currentSettings = loadUserSettings(userId)
  const updatedSettings = {
    ...currentSettings,
    [key]: value,
  }
  saveUserSettings(userId, updatedSettings)
}

/**
 * Clear all user settings (useful for logout)
 */
export function clearUserSettings(userId: string): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    const key = getUserSettingsKey(userId)
    localStorage.removeItem(key)
  } catch (error) {
    console.warn('Failed to clear user settings:', error)
  }
}
