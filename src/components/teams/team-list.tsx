import { TeamListItem } from './team-list-item'
import { Team, Person, Initiative } from '@prisma/client'

type TeamWithRelations = Team & {
  people: Person[]
  initiatives: Initiative[]
  parent: Team | null
}

interface TeamListProps {
  teams: TeamWithRelations[]
  showDescription?: boolean
  showStats?: boolean
  showParent?: boolean
  className?: string
  emptyMessage?: string
}

/**
 * Shareable team list component that displays multiple teams with avatars
 */
export function TeamList({
  teams,
  showDescription = true,
  showStats = true,
  showParent = true,
  className = '',
  emptyMessage = 'No teams found',
}: TeamListProps) {
  if (teams.length === 0) {
    return (
      <div className={`text-center py-8 text-muted-foreground ${className}`}>
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {teams.map(team => (
        <TeamListItem
          key={team.id}
          team={team}
          showDescription={showDescription}
          showStats={showStats}
          showParent={showParent}
        />
      ))}
    </div>
  )
}
