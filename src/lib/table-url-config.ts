/**
 * URL parameter configuration for table settings synchronization
 * Maps filter field names to URL parameter names and defines default values
 */

export interface TableUrlConfig {
  // Map filter field names to URL parameter names
  // If not specified, uses the filter field name as the param name
  filterParamMap: Record<string, string>
  // Default values to exclude from URL (empty arrays, empty strings, 'none', etc.)
  defaultValues: Record<string, unknown>
  // URL parameter name for sort (default: 'sort')
  sortParamName?: string
  // URL parameter name for grouping (default: 'grouping')
  groupingParamName?: string
}

// Default configuration values
const DEFAULT_SORT_PARAM = 'sort'
const DEFAULT_GROUPING_PARAM = 'grouping'

/**
 * Initiative table URL configuration
 */
export const initiativeTableUrlConfig: TableUrlConfig = {
  filterParamMap: {
    search: 'search',
    teamId: 'teamId',
    ownerId: 'ownerId',
    rag: 'rag',
    status: 'status',
    dateFrom: 'dateFrom',
    dateTo: 'dateTo',
  },
  defaultValues: {
    search: '',
    teamId: [],
    ownerId: [],
    rag: [],
    status: [],
    dateFrom: '',
    dateTo: '',
    sort: { field: '', direction: 'asc' },
    grouping: 'none',
  },
  sortParamName: DEFAULT_SORT_PARAM,
  groupingParamName: DEFAULT_GROUPING_PARAM,
}

/**
 * Task table URL configuration
 */
export const taskTableUrlConfig: TableUrlConfig = {
  filterParamMap: {
    search: 'search',
    status: 'status',
    assigneeId: 'assigneeId',
    initiativeId: 'initiativeId',
    priority: 'priority',
    dueDateFrom: 'dueDateFrom',
    dueDateTo: 'dueDateTo',
  },
  defaultValues: {
    search: '',
    status: [],
    assigneeId: [],
    initiativeId: [],
    priority: [],
    dueDateFrom: '',
    dueDateTo: '',
    sort: { field: '', direction: 'asc' },
    grouping: 'none',
  },
  sortParamName: DEFAULT_SORT_PARAM,
  groupingParamName: DEFAULT_GROUPING_PARAM,
}

/**
 * Feedback table URL configuration
 */
export const feedbackTableUrlConfig: TableUrlConfig = {
  filterParamMap: {
    search: 'search',
    fromPersonId: 'fromPersonId',
    aboutPersonId: 'aboutPersonId',
    kind: 'kind',
    isPrivate: 'isPrivate',
    startDate: 'startDate',
    endDate: 'endDate',
  },
  defaultValues: {
    search: '',
    fromPersonId: 'all',
    aboutPersonId: 'all',
    kind: 'all',
    isPrivate: 'all',
    startDate: '',
    endDate: '',
    sort: { field: '', direction: 'asc' },
    grouping: 'none',
  },
  sortParamName: DEFAULT_SORT_PARAM,
  groupingParamName: DEFAULT_GROUPING_PARAM,
}

/**
 * Team table URL configuration
 */
export const teamTableUrlConfig: TableUrlConfig = {
  filterParamMap: {
    search: 'search',
    parentId: 'parentId',
  },
  defaultValues: {
    search: '',
    parentId: '',
    sort: { field: '', direction: 'asc' },
    grouping: 'parent', // Teams default to 'parent' grouping
  },
  sortParamName: DEFAULT_SORT_PARAM,
  groupingParamName: DEFAULT_GROUPING_PARAM,
}

/**
 * People table URL configuration
 */
export const peopleTableUrlConfig: TableUrlConfig = {
  filterParamMap: {
    search: 'search',
    teamId: 'teamId',
    managerId: 'managerId',
    jobRoleId: 'jobRoleId',
    status: 'status',
  },
  defaultValues: {
    search: '',
    teamId: '',
    managerId: '',
    jobRoleId: '',
    status: '',
    sort: { field: '', direction: 'asc' },
    grouping: 'team', // People default to 'team' grouping
  },
  sortParamName: DEFAULT_SORT_PARAM,
  groupingParamName: DEFAULT_GROUPING_PARAM,
}

/**
 * One-on-One table URL configuration
 */
export const oneOnOneTableUrlConfig: TableUrlConfig = {
  filterParamMap: {
    search: 'search',
    scheduledFrom: 'scheduledFrom',
    scheduledTo: 'scheduledTo',
  },
  defaultValues: {
    search: '',
    scheduledFrom: '',
    scheduledTo: '',
    sort: { field: '', direction: 'asc' },
    grouping: 'none',
  },
  sortParamName: DEFAULT_SORT_PARAM,
  groupingParamName: DEFAULT_GROUPING_PARAM,
}

/**
 * Notifications table URL configuration
 */
export const notificationsTableUrlConfig: TableUrlConfig = {
  filterParamMap: {
    search: 'search',
    type: 'type',
    status: 'status',
  },
  defaultValues: {
    search: '',
    type: '',
    status: '',
    sort: { field: '', direction: 'asc' },
    grouping: 'none',
  },
  sortParamName: DEFAULT_SORT_PARAM,
  groupingParamName: DEFAULT_GROUPING_PARAM,
}
