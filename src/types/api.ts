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
