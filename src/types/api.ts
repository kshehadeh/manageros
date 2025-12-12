// Shared API response types

/**
 * Person list item as returned by the /api/people endpoint
 */
export interface PersonListItem {
  id: string
  name: string
  email: string | null
  role: string | null
  status: string
  avatarUrl: string | null
  startDate: Date | null
  endDate: null
  teamId: string | null
  managerId: string | null
  jobRoleId: string | null
  organizationId: string
  userId: null
  createdAt: Date
  updatedAt: Date
  teamName: string | null
  managerName: string | null
  jobRoleTitle: string | null
  reportCount: number
}

/**
 * Response from the /api/people endpoint
 */
export interface PeopleResponse {
  people: PersonListItem[]
  pagination: {
    page: number
    limit: number
    totalCount: number
    totalPages: number
    hasMore: boolean
  }
}

/**
 * Feedback item as returned by the /api/feedback endpoint
 */
export interface FeedbackListItem {
  id: string
  aboutId: string
  fromId: string
  kind: string
  isPrivate: boolean
  body: string
  createdAt: string
  about: {
    id: string
    name: string
    email: string | null
    role: string | null
  }
  from: {
    id: string
    name: string
    email: string | null
    role: string | null
  }
}

/**
 * Response from the /api/feedback endpoint
 */
export interface FeedbackResponse {
  feedback: FeedbackListItem[]
  currentPersonId: string
  pagination: {
    page: number
    limit: number
    totalCount: number
    totalPages: number
    hasMore: boolean
  }
}

/**
 * Task list item as returned by the /api/tasks endpoint
 */
export interface TaskListItem {
  id: string
  title: string
  description: string | null
  status: string
  priority: number
  estimate: number | null
  dueDate: Date | null
  createdAt: Date
  updatedAt: Date
  assigneeId: string | null
  initiativeId: string | null
  objectiveId: string | null
  createdById: string
  assignee: {
    id: string
    name: string
  } | null
  initiative: {
    id: string
    title: string
  } | null
  objective: {
    id: string
    title: string
  } | null
  createdBy: {
    id: string
    name: string
  }
}

/**
 * Response from the /api/tasks endpoint
 */
export interface TasksResponse {
  tasks: TaskListItem[]
  pagination: {
    page: number
    limit: number
    totalCount: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

/**
 * Initiative list item as returned by the /api/initiatives endpoint
 */
export interface InitiativeListItem {
  id: string
  title: string
  summary: string | null
  outcome: string | null
  status: string
  rag: string
  confidence: number
  startDate: Date | null
  targetDate: Date | null
  createdAt: Date
  updatedAt: Date
  teamId: string | null
  organizationId: string
  objectives: Array<{
    id: string
    title: string
    initiativeId: string
    sortIndex: number
  }>
  owners: Array<{
    initiativeId: string
    personId: string
    person: {
      id: string
      name: string
    }
  }>
  team: {
    id: string
    name: string
  } | null
  _count: {
    tasks: number
    checkIns: number
  }
  tasks: Array<{
    status: 'done' | 'todo'
  }>
}

/**
 * Response from the /api/initiatives endpoint
 */
export interface InitiativesResponse {
  initiatives: InitiativeListItem[]
  pagination: {
    page: number
    limit: number
    totalCount: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}
