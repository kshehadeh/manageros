'use client'

import { useState } from 'react'
import { Link } from '@/components/ui/link'
import { TeamCard } from '@/components/teams/team-card'
import { Team, Person, Initiative } from '@prisma/client'

type TeamWithChildren = Team & {
  parent?: { id: string; name: string } | null
  children?: TeamWithChildren[]
  people: Person[]
  initiatives: Initiative[]
}

interface HierarchicalTeamViewProps {
  teams: TeamWithChildren[]
}

export function HierarchicalTeamView({ teams }: HierarchicalTeamViewProps) {
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set())

  const handleToggleExpanded = (teamId: string) => {
    setExpandedTeams(prev => {
      const newSet = new Set(prev)
      if (newSet.has(teamId)) {
        newSet.delete(teamId)
      } else {
        newSet.add(teamId)
      }
      return newSet
    })
  }

  // Filter to only show top-level teams (no parent)
  const topLevelTeams = teams.filter(team => !team.parentId)

  return (
    <div className='space-y-3'>
      {topLevelTeams.map(team => (
        <TeamCard
          key={team.id}
          team={team}
          variant='hierarchical'
          level={0}
          expandedTeams={expandedTeams}
          onToggleExpanded={handleToggleExpanded}
        />
      ))}
      {topLevelTeams.length === 0 && (
        <div className='text-neutral-400 text-sm text-center py-8'>
          No teams yet.{' '}
          <Link href='/teams/new' className='text-blue-400'>
            Create your first team
          </Link>
          .
        </div>
      )}
    </div>
  )
}
