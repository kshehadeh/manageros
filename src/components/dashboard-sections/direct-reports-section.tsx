'use client'

import { useMemo, useState, useEffect } from 'react'
import { Link } from '@/components/ui/link'
import { SimplePeopleList } from '@/components/people/person-list'
import { SimpleTaskListSkeleton } from '@/components/common/simple-task-list-skeleton'
import { SectionHeader } from '@/components/ui/section-header'
import { PageSection } from '@/components/ui/page-section'
import { Button } from '@/components/ui/button'
import { usePeople } from '@/hooks/use-people'
import { useUser } from '@clerk/nextjs'
import { Users, Eye } from 'lucide-react'
import type { Person } from '@/types/person'

export function DashboardDirectReportsSection() {
  const { user, isLoaded } = useUser()
  const [userData, setUserData] = useState<{ personId?: string } | null>(null)

  useEffect(() => {
    if (isLoaded && user) {
      fetch('/api/user/current')
        .then(res => res.json())
        .then(data => setUserData(data.user))
        .catch(() => {})
    }
  }, [isLoaded, user])

  const currentPersonId = userData?.personId

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
    <PageSection
      header={
        <SectionHeader
          icon={Users}
          title='Direct Reports'
          action={
            <Button asChild variant='outline' size='sm'>
              <Link href='/direct-reports' className='flex items-center gap-2'>
                <Eye className='w-4 h-4' />
                View All
              </Link>
            </Button>
          }
        />
      }
    >
      <SimplePeopleList
        people={formattedReports}
        variant='compact'
        emptyStateText='No direct reports.'
        showEmail={true}
        showRole={false}
        showTeam={false}
        showJobRole={false}
        showManager={false}
        showReportsCount={false}
      />
    </PageSection>
  )
}
