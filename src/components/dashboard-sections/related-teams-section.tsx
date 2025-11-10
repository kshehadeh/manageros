'use client'

import { useMemo } from 'react'
import { SimpleTeamList } from '@/components/teams/team-list'
import { SimpleTaskListSkeleton } from '@/components/common/simple-task-list-skeleton'
import { useTeams } from '@/hooks/use-teams'
import { useUser } from '@clerk/nextjs'
import { PageSection } from '@/components/ui/page-section'
import { SectionHeader } from '@/components/ui/section-header'
import { Button } from '@/components/ui/button'
import { Building2, Eye } from 'lucide-react'
import { Link } from '@/components/ui/link'

export function DashboardRelatedTeamsSection() {
  const { isLoaded } = useUser()
  const status = isLoaded ? 'authenticated' : 'loading'

  // Memoize immutableFilters to prevent infinite loop
  const immutableFilters = useMemo(
    () => ({
      relatedToUser: 'true',
    }),
    []
  )

  const { data, loading, error } = useTeams({
    immutableFilters,
    sort: 'name:asc',
    limit: 100,
    enabled: status !== 'loading',
  })

  if (loading || status === 'loading') {
    return (
      <SimpleTaskListSkeleton
        title='Related Teams'
        variant='simple'
        itemCount={3}
      />
    )
  }

  if (error) {
    console.error('Error loading related teams:', error)
    return null
  }

  const teams = data?.teams || []

  if (!teams || teams.length === 0) return null

  // Transform the data to match SimpleTeamList format
  const formattedTeams = teams.map(team => ({
    id: team.id,
    name: team.name,
    description: team.description,
    avatar: team.avatar,
    updatedAt: team.updatedAt,
    people: Array.from({ length: team._count.people || 0 }, () => ({
      id: '',
      name: '',
    })),
    initiatives: Array.from({ length: team._count.initiatives || 0 }, () => ({
      id: '',
      title: '',
    })),
  }))

  return (
    <PageSection
      header={
        <SectionHeader
          icon={Building2}
          title='Related Teams'
          action={
            <Button asChild variant='outline' size='sm'>
              <Link href='/teams' className='flex items-center gap-2'>
                <Eye className='w-4 h-4' />
                View All
              </Link>
            </Button>
          }
        />
      }
    >
      <SimpleTeamList
        teams={formattedTeams}
        variant='compact'
        emptyStateText='No related teams found.'
        showDescription={false}
        showMembers={true}
        showInitiatives={false}
        showUpdatedAt={false}
      />
    </PageSection>
  )
}
