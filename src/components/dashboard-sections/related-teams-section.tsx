'use client'

import { useMemo } from 'react'
import { SimpleTeamList } from '@/components/teams/team-list'
import { SimpleTaskListSkeleton } from '@/components/common/simple-task-list-skeleton'
import { useTeams } from '@/hooks/use-teams'
import { useSession } from 'next-auth/react'

export function DashboardRelatedTeamsSection() {
  const { status } = useSession()

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
    <SimpleTeamList
      teams={formattedTeams}
      title='Related Teams'
      variant='compact'
      viewAllHref='/teams'
      emptyStateText='No related teams found.'
      showDescription={false}
      showMembers={true}
      showInitiatives={false}
      showUpdatedAt={false}
    />
  )
}
