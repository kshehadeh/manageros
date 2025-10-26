'use client'

import { useMemo } from 'react'
import { SimplePeopleList } from '@/components/people/person-list'
import { SimpleTaskListSkeleton } from '@/components/common/simple-task-list-skeleton'
import { usePeople } from '@/hooks/use-people'
import { useSession } from 'next-auth/react'
import type { Person } from '@/types/person'

export function DashboardDirectReportsSection() {
  const { data: session, status } = useSession()
  const currentPersonId = (session?.user as { personId?: string })?.personId

  // Memoize immutableFilters to prevent infinite loop
  const immutableFilters = useMemo(
    () => ({
      managerId: currentPersonId || '',
      status: 'active',
    }),
    [currentPersonId]
  )

  const { data, loading, error } = usePeople({
    immutableFilters,
    sort: 'name:asc',
    limit: 100,
    enabled: status !== 'loading' && !!currentPersonId,
  })

  if (loading || status === 'loading') {
    return (
      <SimpleTaskListSkeleton
        title='Direct Reports'
        variant='simple'
        itemCount={3}
      />
    )
  }

  if (error) {
    console.error('Error loading direct reports:', error)
    return null
  }

  const directReports = data?.people || []

  if (!directReports || directReports.length === 0) return null

  // Transform the data to match SimplePeopleList format
  const formattedReports: Person[] = directReports.map(report => ({
    id: report.id,
    name: report.name,
    email: report.email,
    role: report.role,
    status: report.status,
    birthday: null,
    avatar: report.avatarUrl,
    employeeType: null,
    team:
      report.teamId && report.teamName
        ? {
            id: report.teamId,
            name: report.teamName,
          }
        : null,
    jobRole: null,
    manager: null,
    reports: [],
    level: 0,
  }))

  return (
    <SimplePeopleList
      people={formattedReports}
      title='Direct Reports'
      variant='compact'
      viewAllHref='/direct-reports'
      emptyStateText='No direct reports.'
      showEmail={true}
      showRole={false}
      showTeam={false}
      showJobRole={false}
      showManager={false}
      showReportsCount={false}
    />
  )
}
