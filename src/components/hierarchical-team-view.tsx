'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronRight, Users, Target } from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { EditIconButton } from '@/components/edit-icon-button'
import { DeleteTeamIconButton } from '@/components/delete-team-icon-button'
import { AddPersonButton } from '@/components/add-person-button'
import { AddChildTeamButton } from '@/components/add-child-team-button'
import { Team, Person, Initiative } from '@prisma/client'

type TeamWithChildren = Team & {
  parent?: { id: string; name: string } | null
  children?: TeamWithChildren[]
  people: Person[]
  initiatives: Initiative[]
}

interface HierarchicalTeamCardProps {
  team: TeamWithChildren
  level?: number
  expandedTeams: Set<string>
  onToggleExpanded: (_teamId: string) => void
}

function HierarchicalTeamCard({
  team,
  level = 0,
  expandedTeams,
  onToggleExpanded,
}: HierarchicalTeamCardProps) {
  const hasChildren = Boolean(team.children && team.children.length > 0)
  const isExpanded = expandedTeams.has(team.id)
  const indentLevel = level * 16 // Reduced from 24px to 16px per level

  const handleToggle = () => {
    onToggleExpanded(team.id)
  }

  return (
    <div className='space-y-2'>
      <div
        className='card'
        style={{ marginLeft: level > 0 ? `${indentLevel}px` : '0' }}
      >
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3 flex-1'>
            {hasChildren ? (
              <Collapsible open={isExpanded} onOpenChange={handleToggle}>
                <CollapsibleTrigger asChild>
                  <button className='flex items-center justify-center w-6 h-6 hover:bg-accent rounded transition-colors' aria-label={isExpanded ? 'Collapse team' : 'Expand team'}>
                    {isExpanded ? (
                      <ChevronDown className='w-4 h-4 text-muted-foreground' />
                    ) : (
                      <ChevronRight className='w-4 h-4 text-muted-foreground' />
                    )}
                  </button>
                </CollapsibleTrigger>
              </Collapsible>
            ) : (
              <div className='w-6' /> // Spacer for alignment
            )}

            <div className='flex-1'>
              <Link
                href={`/teams/${team.id}`}
                className='font-medium hover:text-primary transition-colors'
              >
                {team.name}
              </Link>
              {team.description && (
                <div className='text-sm text-muted-foreground mt-1'>
                  {team.description}
                </div>
              )}
              <div className='flex items-center gap-4 text-xs text-muted-foreground mt-2'>
                <div className='flex items-center gap-1'>
                  <Users className='w-3 h-3' />
                  {team.people.length} member
                  {team.people.length !== 1 ? 's' : ''}
                </div>
                <div className='flex items-center gap-1'>
                  <Target className='w-3 h-3' />
                  {team.initiatives.length} initiative
                  {team.initiatives.length !== 1 ? 's' : ''}
                </div>
                {hasChildren && (
                  <span className='text-primary'>
                    {team.children!.length} child team
                    {team.children!.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className='flex items-center gap-2'>
            <AddPersonButton teamId={team.id} />
            <AddChildTeamButton parentTeamId={team.id} />
            <EditIconButton href={`/teams/${team.id}/edit`} />
            <DeleteTeamIconButton
              teamId={team.id}
              teamName={team.name}
              hasPeople={team.people.length > 0}
              hasInitiatives={team.initiatives.length > 0}
              hasChildren={hasChildren}
            />
          </div>
        </div>

        {hasChildren && (
          <Collapsible open={isExpanded} onOpenChange={handleToggle}>
            <CollapsibleContent className='mt-4 pt-4 border-t'>
              <div className='space-y-2'>
                {team.children!.map(child => (
                  <HierarchicalTeamCard
                    key={child.id}
                    team={child}
                    level={level + 1}
                    expandedTeams={expandedTeams}
                    onToggleExpanded={onToggleExpanded}
                  />
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    </div>
  )
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
        <HierarchicalTeamCard
          key={team.id}
          team={team}
          level={0}
          expandedTeams={expandedTeams}
          onToggleExpanded={handleToggleExpanded}
        />
      ))}
      {topLevelTeams.length === 0 && (
        <div className='text-neutral-400 text-sm text-center py-8'>
          No teams yet.{' '}
          <Link href='/teams/new' className='text-blue-400 hover:text-blue-300'>
            Create your first team
          </Link>
          .
        </div>
      )}
    </div>
  )
}
