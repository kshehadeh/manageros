'use client'

import { useMemo } from 'react'
import { ExpandableSection } from '@/components/expandable-section'
import { TeamListItem } from '@/components/teams/team-list-item'
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
      <ExpandableSection
        title='Related Teams'
        icon='Users2'
        viewAllHref='/teams'
      >
        <div className='flex items-center justify-center py-8'>
          <div className='text-muted-foreground'>Loading...</div>
        </div>
      </ExpandableSection>
    )
  }

  if (error) {
    console.error('Error loading related teams:', error)
    return null
  }

  const teams = data?.teams || []

  if (!teams || teams.length === 0) return null

  // Transform the data to match the expected format
  const formattedTeams = teams.map(team => ({
    ...team,
    avatar: team.avatar, // Preserve the actual avatar from API
    people: Array(team._count.people).fill(null), // Create array with correct length for stats
    initiatives: Array(team._count.initiatives).fill(null), // Create array with correct length for stats
    parent: team.parent
      ? {
          id: team.parent.id,
          name: team.parent.name || '',
          description: null,
          organizationId: team.organizationId,
          createdAt: team.createdAt,
          updatedAt: team.updatedAt,
          avatar: team.parent.avatar || null, // Ensure avatar is string | null, not undefined
          parentId: null,
        }
      : null,
  }))

  return (
    <ExpandableSection title='Related Teams' icon='Users2' viewAllHref='/teams'>
      {formattedTeams.map(team => (
        <TeamListItem key={team.id} team={team} />
      ))}
    </ExpandableSection>
  )
}
