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

  // Onboarding settings
  showOnboarding: boolean

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
        status: string[]
        assigneeId: string[]
        initiativeId: string[]
        priority: string[]
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

  // Per-view team table settings
  teamTableSettings: Record<
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
        parentId: string
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

  // Per-view meeting table settings
  meetingTableSettings: Record<
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
        initiativeId: string
        scheduledFrom: string
        scheduledTo: string
        meetingType: string
      }
    }
  >

  // Per-view feedback table settings
  feedbackTableSettings: Record<
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
        fromPersonId: string
        aboutPersonId: string
        kind: string
        isPrivate: string
        startDate: string
        endDate: string
      }
    }
  >

  // Per-view job roles table settings
  jobRolesTableSettings: Record<
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
        levelId: string
        domainId: string
      }
    }
  >

  // Per-view organization members table settings
  organizationMembersTableSettings: Record<
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
        role: string
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
  showOnboarding: true,
  taskTableSettings: {},
  initiativeTableSettings: {},
  peopleTableSettings: {},
  teamTableSettings: {},
  oneOnOneTableSettings: {},
  meetingTableSettings: {},
  feedbackTableSettings: {},
  jobRolesTableSettings: {},
  organizationMembersTableSettings: {},
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
  const tableSettings = settings.taskTableSettings[settingsId]

  if (!tableSettings) {
    // For "my-tasks" view, default to filtering out completed tasks
    const defaultStatusFilter =
      settingsId === 'my-tasks' ? ['todo', 'doing', 'blocked'] : []

    return {
      sorting: [],
      grouping: 'none',
      sort: {
        field: '',
        direction: 'asc',
      },
      filters: {
        search: '',
        status: defaultStatusFilter,
        assigneeId: [],
        initiativeId: [],
        priority: [],
        dueDateFrom: '',
        dueDateTo: '',
      },
    }
  }

  return tableSettings
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
      status: [],
      assigneeId: [],
      initiativeId: [],
      priority: [],
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
 * Get team table settings for a specific view
 */
export function getTeamTableSettings(
  userId: string,
  settingsId: string
): UserSettings['teamTableSettings'][string] {
  const settings = loadUserSettings(userId)
  return (
    settings.teamTableSettings[settingsId] || {
      sorting: [],
      grouping: 'parent',
      sort: {
        field: '',
        direction: 'asc',
      },
      filters: {
        search: '',
        parentId: '',
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
 * Update team table settings for a specific view
 */
export function updateTeamTableSettings(
  userId: string,
  settingsId: string,
  tableSettings: Partial<UserSettings['teamTableSettings'][string]>
): void {
  const currentSettings = loadUserSettings(userId)
  const currentTableSettings = currentSettings.teamTableSettings[
    settingsId
  ] || {
    sorting: [],
    grouping: 'parent',
    sort: {
      field: '',
      direction: 'asc' as const,
    },
    filters: {
      search: '',
      parentId: '',
    },
  }

  const updatedTableSettings = {
    ...currentTableSettings,
    ...tableSettings,
  }

  const updatedSettings = {
    ...currentSettings,
    teamTableSettings: {
      ...currentSettings.teamTableSettings,
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

/**
 * Get meeting table settings for a specific view
 */
export function getMeetingTableSettings(
  userId: string,
  settingsId: string
): UserSettings['meetingTableSettings'][string] {
  const settings = loadUserSettings(userId)
  return (
    settings.meetingTableSettings[settingsId] || {
      sorting: [],
      grouping: 'none',
      sort: {
        field: '',
        direction: 'asc',
      },
      filters: {
        search: '',
        teamId: '',
        initiativeId: '',
        scheduledFrom: '',
        scheduledTo: '',
        meetingType: '',
      },
    }
  )
}

/**
 * Update meeting table settings for a specific view
 */
export function updateMeetingTableSettings(
  userId: string,
  settingsId: string,
  tableSettings: Partial<UserSettings['meetingTableSettings'][string]>
): void {
  const currentSettings = loadUserSettings(userId)
  const currentTableSettings = currentSettings.meetingTableSettings[
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
      initiativeId: '',
      scheduledFrom: '',
      scheduledTo: '',
      meetingType: '',
    },
  }

  const updatedTableSettings = {
    ...currentTableSettings,
    ...tableSettings,
  }

  const updatedSettings = {
    ...currentSettings,
    meetingTableSettings: {
      ...currentSettings.meetingTableSettings,
      [settingsId]: updatedTableSettings,
    },
  }

  saveUserSettings(userId, updatedSettings)
}

/**
 * Get feedback table settings for a specific view
 */
export function getFeedbackTableSettings(
  userId: string,
  settingsId: string
): UserSettings['feedbackTableSettings'][string] {
  const settings = loadUserSettings(userId)
  const tableSettings = settings.feedbackTableSettings[settingsId]

  if (!tableSettings) {
    return {
      sorting: [],
      grouping: 'none',
      sort: {
        field: '',
        direction: 'asc',
      },
      filters: {
        search: '',
        fromPersonId: 'all',
        aboutPersonId: 'all',
        kind: 'all',
        isPrivate: 'all',
        startDate: '',
        endDate: '',
      },
    }
  }

  return tableSettings
}

/**
 * Update feedback table settings for a specific view
 */
export function updateFeedbackTableSettings(
  userId: string,
  settingsId: string,
  tableSettings: Partial<UserSettings['feedbackTableSettings'][string]>
): void {
  const currentSettings = loadUserSettings(userId)
  const currentTableSettings = currentSettings.feedbackTableSettings[
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
      fromPersonId: 'all',
      aboutPersonId: 'all',
      kind: 'all',
      isPrivate: 'all',
      startDate: '',
      endDate: '',
    },
  }

  const updatedTableSettings = {
    ...currentTableSettings,
    ...tableSettings,
  }

  const updatedSettings = {
    ...currentSettings,
    feedbackTableSettings: {
      ...currentSettings.feedbackTableSettings,
      [settingsId]: updatedTableSettings,
    },
  }

  saveUserSettings(userId, updatedSettings)
}

/**
 * Get job roles table settings for a specific view
 */
export function getJobRolesTableSettings(
  userId: string,
  settingsId: string
): UserSettings['jobRolesTableSettings'][string] {
  const settings = loadUserSettings(userId)
  return (
    settings.jobRolesTableSettings[settingsId] || {
      sorting: [],
      grouping: 'none',
      sort: {
        field: '',
        direction: 'asc',
      },
      filters: {
        search: '',
        levelId: '',
        domainId: '',
      },
    }
  )
}

/**
 * Update job roles table settings for a specific view
 */
export function updateJobRolesTableSettings(
  userId: string,
  settingsId: string,
  tableSettings: Partial<UserSettings['jobRolesTableSettings'][string]>
): void {
  const currentSettings = loadUserSettings(userId)
  const currentTableSettings = currentSettings.jobRolesTableSettings[
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
      levelId: '',
      domainId: '',
    },
  }

  const updatedTableSettings = {
    ...currentTableSettings,
    ...tableSettings,
  }

  const updatedSettings = {
    ...currentSettings,
    jobRolesTableSettings: {
      ...currentSettings.jobRolesTableSettings,
      [settingsId]: updatedTableSettings,
    },
  }

  saveUserSettings(userId, updatedSettings)
}

/**
 * Get organization members table settings for a specific view
 */
export function getOrganizationMembersTableSettings(
  userId: string,
  settingsId: string
): UserSettings['organizationMembersTableSettings'][string] {
  const settings = loadUserSettings(userId)
  return (
    settings.organizationMembersTableSettings[settingsId] || {
      sorting: [],
      grouping: 'none',
      sort: {
        field: '',
        direction: 'asc',
      },
      filters: {
        search: '',
        role: '',
      },
    }
  )
}

/**
 * Update organization members table settings for a specific view
 */
export function updateOrganizationMembersTableSettings(
  userId: string,
  settingsId: string,
  tableSettings: Partial<
    UserSettings['organizationMembersTableSettings'][string]
  >
): void {
  const currentSettings = loadUserSettings(userId)
  const currentTableSettings = currentSettings.organizationMembersTableSettings[
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
      role: '',
    },
  }

  const updatedTableSettings = {
    ...currentTableSettings,
    ...tableSettings,
  }

  const updatedSettings = {
    ...currentSettings,
    organizationMembersTableSettings: {
      ...currentSettings.organizationMembersTableSettings,
      [settingsId]: updatedTableSettings,
    },
  }

  saveUserSettings(userId, updatedSettings)
}
