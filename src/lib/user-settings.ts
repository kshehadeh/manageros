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
  taskGrouping: 'status' | 'initiative' | 'assignee' | 'none'
  taskFilters: {
    textFilter: string
    assigneeFilter: string | string[]
    initiativeFilter: string | string[]
    statusFilter: string | string[]
    priorityFilter: string | string[]
    dateRangeFilter: string
    startDate: string
    endDate: string
  }
  myTasksHideCompleted: boolean

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

  // Per-view task table settings
  taskTableSettings: Record<
    string,
    {
      sorting: Array<{ id: string; desc: boolean }>
      grouping: string
      sort: {
        field: string
        direction: 'asc' | 'desc'
      }
      filters: {
        search: string
        status: string | string[]
        assigneeId: string | string[]
        initiativeId: string | string[]
        priority: string | string[]
        dueDateFrom: string
        dueDateTo: string
      }
    }
  >

  // Per-view initiative table settings
  initiativeTableSettings: Record<
    string,
    {
      sorting: Array<{ id: string; desc: boolean }>
      grouping: string
      sort: {
        field: string
        direction: 'asc' | 'desc'
      }
      filters: {
        search: string
        teamId: string
        ownerId: string
        rag: string
        status: string
        dateFrom: string
        dateTo: string
      }
    }
  >

  // Per-view people table settings
  peopleTableSettings: Record<
    string,
    {
      sorting: Array<{ id: string; desc: boolean }>
      grouping: string
      sort: {
        field: string
        direction: 'asc' | 'desc'
      }
      filters: {
        search: string
        teamId: string
        managerId: string
        jobRoleId: string
        status: string
      }
    }
  >

  // Per-view one-on-one table settings
  oneOnOneTableSettings: Record<
    string,
    {
      sorting: Array<{ id: string; desc: boolean }>
      grouping: string
      sort: {
        field: string
        direction: 'asc' | 'desc'
      }
      filters: {
        search: string
        scheduledFrom: string
        scheduledTo: string
      }
    }
  >

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
  myTasksHideCompleted: true,
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
  taskTableSettings: {},
  initiativeTableSettings: {},
  peopleTableSettings: {},
  oneOnOneTableSettings: {},
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

/**
 * Get task table settings for a specific view
 */
export function getTaskTableSettings(
  userId: string,
  settingsId: string
): UserSettings['taskTableSettings'][string] {
  const settings = loadUserSettings(userId)
  return (
    settings.taskTableSettings[settingsId] || {
      sorting: [],
      grouping: 'none',
      sort: {
        field: '',
        direction: 'asc',
      },
      filters: {
        search: '',
        status: '',
        assigneeId: '',
        initiativeId: '',
        priority: '',
        dueDateFrom: '',
        dueDateTo: '',
      },
    }
  )
}

/**
 * Update task table settings for a specific view
 */
export function updateTaskTableSettings(
  userId: string,
  settingsId: string,
  tableSettings: Partial<UserSettings['taskTableSettings'][string]>
): void {
  const currentSettings = loadUserSettings(userId)
  const currentTableSettings = currentSettings.taskTableSettings[
    settingsId
  ] || {
    sorting: [],
    grouping: 'none',
    sort: {
      field: '',
      direction: 'asc' as const,
    },
    filters: {
      search: '',
      status: '',
      assigneeId: '',
      initiativeId: '',
      priority: '',
      dueDateFrom: '',
      dueDateTo: '',
    },
  }

  const updatedTableSettings = {
    ...currentTableSettings,
    ...tableSettings,
  }

  const updatedSettings = {
    ...currentSettings,
    taskTableSettings: {
      ...currentSettings.taskTableSettings,
      [settingsId]: updatedTableSettings,
    },
  }

  saveUserSettings(userId, updatedSettings)
}

/**
 * Get initiative table settings for a specific view
 */
export function getInitiativeTableSettings(
  userId: string,
  settingsId: string
): UserSettings['initiativeTableSettings'][string] {
  const settings = loadUserSettings(userId)
  return (
    settings.initiativeTableSettings[settingsId] || {
      sorting: [],
      grouping: 'none',
      sort: {
        field: '',
        direction: 'asc',
      },
      filters: {
        search: '',
        teamId: '',
        ownerId: '',
        rag: '',
        status: '',
        dateFrom: '',
        dateTo: '',
      },
    }
  )
}

/**
 * Update initiative table settings for a specific view
 */
export function updateInitiativeTableSettings(
  userId: string,
  settingsId: string,
  tableSettings: Partial<UserSettings['initiativeTableSettings'][string]>
): void {
  const currentSettings = loadUserSettings(userId)
  const currentTableSettings = currentSettings.initiativeTableSettings[
    settingsId
  ] || {
    sorting: [],
    grouping: 'none',
    sort: {
      field: '',
      direction: 'asc' as const,
    },
    filters: {
      search: '',
      teamId: '',
      ownerId: '',
      rag: '',
      status: '',
      dateFrom: '',
      dateTo: '',
    },
  }

  const updatedTableSettings = {
    ...currentTableSettings,
    ...tableSettings,
  }

  const updatedSettings = {
    ...currentSettings,
    initiativeTableSettings: {
      ...currentSettings.initiativeTableSettings,
      [settingsId]: updatedTableSettings,
    },
  }

  saveUserSettings(userId, updatedSettings)
}

/**
 * Get people table settings for a specific view
 */
export function getPeopleTableSettings(
  userId: string,
  settingsId: string
): UserSettings['peopleTableSettings'][string] {
  const settings = loadUserSettings(userId)
  return (
    settings.peopleTableSettings[settingsId] || {
      sorting: [],
      grouping: 'team',
      sort: {
        field: '',
        direction: 'asc',
      },
      filters: {
        search: '',
        teamId: '',
        managerId: '',
        jobRoleId: '',
        status: '',
      },
    }
  )
}

/**
 * Update people table settings for a specific view
 */
export function updatePeopleTableSettings(
  userId: string,
  settingsId: string,
  tableSettings: Partial<UserSettings['peopleTableSettings'][string]>
): void {
  const currentSettings = loadUserSettings(userId)
  const currentTableSettings = currentSettings.peopleTableSettings[
    settingsId
  ] || {
    sorting: [],
    grouping: 'team',
    sort: {
      field: '',
      direction: 'asc' as const,
    },
    filters: {
      search: '',
      teamId: '',
      managerId: '',
      jobRoleId: '',
      status: '',
    },
  }

  const updatedTableSettings = {
    ...currentTableSettings,
    ...tableSettings,
  }

  const updatedSettings = {
    ...currentSettings,
    peopleTableSettings: {
      ...currentSettings.peopleTableSettings,
      [settingsId]: updatedTableSettings,
    },
  }

  saveUserSettings(userId, updatedSettings)
}

/**
 * Get one-on-one table settings for a specific view
 */
export function getOneOnOneTableSettings(
  userId: string,
  settingsId: string
): UserSettings['oneOnOneTableSettings'][string] {
  const settings = loadUserSettings(userId)
  return (
    settings.oneOnOneTableSettings[settingsId] || {
      sorting: [],
      grouping: 'none',
      sort: {
        field: '',
        direction: 'asc',
      },
      filters: {
        search: '',
        scheduledFrom: '',
        scheduledTo: '',
      },
    }
  )
}

/**
 * Update one-on-one table settings for a specific view
 */
export function updateOneOnOneTableSettings(
  userId: string,
  settingsId: string,
  tableSettings: Partial<UserSettings['oneOnOneTableSettings'][string]>
): void {
  const currentSettings = loadUserSettings(userId)
  const currentTableSettings = currentSettings.oneOnOneTableSettings[
    settingsId
  ] || {
    sorting: [],
    grouping: 'none',
    sort: {
      field: '',
      direction: 'asc' as const,
    },
    filters: {
      search: '',
      scheduledFrom: '',
      scheduledTo: '',
    },
  }

  const updatedTableSettings = {
    ...currentTableSettings,
    ...tableSettings,
  }

  const updatedSettings = {
    ...currentSettings,
    oneOnOneTableSettings: {
      ...currentSettings.oneOnOneTableSettings,
      [settingsId]: updatedTableSettings,
    },
  }

  saveUserSettings(userId, updatedSettings)
}
