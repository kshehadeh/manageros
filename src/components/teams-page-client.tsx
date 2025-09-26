'use client'

import { useState, useEffect, useCallback } from 'react'
import { TeamsTable } from '@/components/teams-table'
import { TeamsFilterBar } from '@/components/teams-filter-bar'
import { TeamWithRelations } from '@/types/team'

interface TeamsPageClientProps {
  teams: TeamWithRelations[]
}

export function TeamsPageClient({ teams }: TeamsPageClientProps) {
  const [filteredTeams, setFilteredTeams] = useState<TeamWithRelations[]>(teams)

  // Update filtered teams when teams prop changes
  useEffect(() => {
    setFilteredTeams(teams)
  }, [teams])

  const handleFilteredTeamsChange = useCallback(
    (newFilteredTeams: TeamWithRelations[]) => {
      setFilteredTeams(newFilteredTeams)
    },
    []
  )

  return (
    <div className='page-section'>
      <TeamsFilterBar
        teams={teams}
        onFilteredTeamsChange={handleFilteredTeamsChange}
      />

      <TeamsTable teams={filteredTeams} />
    </div>
  )
}
