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
