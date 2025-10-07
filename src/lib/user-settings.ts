/**
 * User-specific UI settings stored in browser localStorage
 * Each setting is scoped to the current user's ID to prevent conflicts
 */

export interface UserSettings {
  // People page settings
  peopleViewMode: 'list' | 'chart'
  peopleGrouping: 'manager' | 'team' | 'status' | 'jobRole' | 'none'

  // Theme settings
  theme: 'light' | 'dark'

  // Task view settings
  taskGrouping: 'status' | 'initiative' | 'assignee'
  taskFilters: {
    textFilter: string
    assigneeFilter: string
    initiativeFilter: string
    statusFilter: string
    priorityFilter: string
    dateRangeFilter: string
    startDate: string
    endDate: string
  }

  // Initiative view settings
  initiativeGrouping: 'team' | 'rag'
  initiativeFilters: {
    textFilter: string
    ownerFilter: string
    teamFilter: string
    ragFilter: string
    statusFilter: string
    dateRangeFilter: string
    startDate: string
    endDate: string
  }

  // AI Chat settings
  chatWindowSettings: {
    isFullscreen: boolean
  }

  // Future expandable settings can be added here:
  // sidebarCollapsed: boolean
  // defaultPageSize: number
  // tasksViewMode: 'list' | 'kanban' | 'calendar'
  // initiativesViewMode: 'list' | 'timeline' | 'board'
  // etc.
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
  peopleViewMode: 'chart',
  peopleGrouping: 'team',
  theme: 'dark',
  taskGrouping: 'status',
  taskFilters: {
    textFilter: '',
    assigneeFilter: 'all',
    initiativeFilter: 'all',
    statusFilter: 'all',
    priorityFilter: 'all',
    dateRangeFilter: 'all',
    startDate: '',
    endDate: '',
  },
  initiativeGrouping: 'rag',
  initiativeFilters: {
    textFilter: '',
    ownerFilter: 'all',
    teamFilter: 'all',
    ragFilter: 'all',
    statusFilter: 'all',
    dateRangeFilter: 'all',
    startDate: '',
    endDate: '',
  },
  chatWindowSettings: {
    isFullscreen: false,
  },
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
