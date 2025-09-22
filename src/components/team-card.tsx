'use client'

import Link from 'next/link'
import { Users, Target, ChevronDown, ChevronRight } from 'lucide-react'
import { Team, Person, Initiative } from '@prisma/client'
import { TeamActionsDropdown } from '@/components/team-actions-dropdown'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

type TeamWithChildren = Team & {
  parent?: { id: string; name: string } | null
  children?: TeamWithChildren[]
  people: Person[]
  initiatives: Initiative[]
}

interface TeamCardProps {
  team: TeamWithChildren
  variant?: 'hierarchical' | 'simple'
  level?: number
  expandedTeams?: Set<string>
  onToggleExpanded?: (_teamId: string) => void
  showActions?: boolean
  className?: string
}

export function TeamCard({
  team,
  variant = 'simple',
  level = 0,
  expandedTeams,
  onToggleExpanded,
  showActions = true,
  className = '',
}: TeamCardProps) {
  const hasChildren = Boolean(team.children && team.children.length > 0)
  const isExpanded = expandedTeams?.has(team.id) ?? false
  const indentLevel = level * 16

  const handleToggle = () => {
    if (onToggleExpanded) {
      onToggleExpanded(team.id)
    }
  }

  const cardClasses =
    variant === 'hierarchical'
      ? 'card'
      : 'block border rounded-xl p-3 hover:bg-accent/50 transition-colors'

  const containerClasses =
    variant === 'hierarchical' && level > 0
      ? `space-y-2 ${className}`
      : `space-y-2 ${className}`

  const cardStyle =
    variant === 'hierarchical' && level > 0
      ? { marginLeft: `${indentLevel}px` }
      : {}

  return (
    <div className={containerClasses}>
      <div className={cardClasses} style={cardStyle}>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3 flex-1'>
            {variant === 'hierarchical' && hasChildren ? (
              <Collapsible open={isExpanded} onOpenChange={handleToggle}>
                <CollapsibleTrigger asChild>
                  <button
                    className='flex items-center justify-center w-6 h-6 hover:bg-accent rounded transition-colors'
                    aria-label={isExpanded ? 'Collapse team' : 'Expand team'}
                  >
                    {isExpanded ? (
                      <ChevronDown className='w-4 h-4 text-muted-foreground' />
                    ) : (
                      <ChevronRight className='w-4 h-4 text-muted-foreground' />
                    )}
                  </button>
                </CollapsibleTrigger>
              </Collapsible>
            ) : variant === 'hierarchical' ? (
              <div className='w-6' /> // Spacer for alignment
            ) : null}

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
                {variant === 'hierarchical' && hasChildren && (
                  <span className='text-primary'>
                    {team.children!.length} child team
                    {team.children!.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          </div>

          {showActions && (
            <div className='flex items-center gap-2'>
              <TeamActionsDropdown team={team} />
            </div>
          )}
        </div>

        {variant === 'hierarchical' && hasChildren && (
          <Collapsible open={isExpanded} onOpenChange={handleToggle}>
            <CollapsibleContent className='mt-4 pt-4 border-t'>
              <div className='space-y-2'>
                {team.children!.map(child => (
                  <TeamCard
                    key={child.id}
                    team={child}
                    variant='hierarchical'
                    level={level + 1}
                    expandedTeams={expandedTeams}
                    onToggleExpanded={onToggleExpanded}
                    showActions={showActions}
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
