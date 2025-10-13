'use client'

import { useMemo } from 'react'
import { DirectReports } from '@/components/dashboard-direct-reports'
import { ExpandableSection } from '@/components/expandable-section'
import { usePeople } from '@/hooks/use-people'
import { useSession } from 'next-auth/react'

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
      <ExpandableSection
        title='Direct Reports'
        icon='User'
        viewAllHref='/direct-reports'
      >
        <div className='flex items-center justify-center py-8'>
          <div className='text-muted-foreground'>Loading...</div>
        </div>
      </ExpandableSection>
    )
  }

  if (error) {
    console.error('Error loading direct reports:', error)
    return null
  }

  const directReports = data?.people || []

  if (!directReports || directReports.length === 0) return null

  // Transform the data to match the expected format
  const formattedReports = directReports.map(report => ({
    ...report,
    birthday: null,
    avatar: report.avatarUrl,
    employeeType: null,
    startedAt: report.startDate,
    team:
      report.teamId && report.teamName
        ? {
            id: report.teamId,
            name: report.teamName,
            description: null,
            organizationId: report.organizationId,
            createdAt: report.createdAt,
            updatedAt: report.updatedAt,
            avatar: null,
            parentId: null,
          }
        : null,
    reports: [], // Reports count is included in _count
  }))

  return (
    <ExpandableSection
      title='Direct Reports'
      icon='User'
      viewAllHref='/direct-reports'
    >
      <DirectReports directReports={formattedReports} />
    </ExpandableSection>
  )
}
