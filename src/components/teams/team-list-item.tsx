import Link from 'next/link'
import { TeamAvatar } from '@/components/teams/team-avatar'
import { Team, Person, Initiative } from '@prisma/client'

type TeamWithRelations = Team & {
  people: Person[]
  initiatives: Initiative[]
  parent: Team | null
}

interface TeamListItemProps {
  team: TeamWithRelations
  showDescription?: boolean
  showStats?: boolean
  showParent?: boolean
  className?: string
}

/**
 * Shareable team list item component that displays team information with avatar
 */
export function TeamListItem({
  team,
  showDescription = true,
  showStats = true,
  showParent = true,
  className = '',
}: TeamListItemProps) {
  return (
    <div className={`flex gap-3 ${className}`}>
      <div className='flex-shrink-0 pt-0.5'>
        <TeamAvatar name={team.name} avatar={team.avatar} size='sm' />
      </div>

      <div className='flex-1 min-w-0'>
        <Link
          href={`/teams/${team.id}`}
          className='font-medium hover:text-blue-400 transition-colors block truncate'
        >
          {team.name}
        </Link>

        {showDescription && team.description && (
          <div className='text-neutral-400 text-sm truncate'>
            {team.description}
          </div>
        )}

        {showStats && (
          <div className='text-xs text-neutral-500 mt-1'>
            {team.people.length} member{team.people.length !== 1 ? 's' : ''} •{' '}
            {team.initiatives.length} initiative
            {team.initiatives.length !== 1 ? 's' : ''}
            {showParent && team.parent && (
              <span>
                {' '}
                • Parent:{' '}
                <Link
                  href={`/teams/${team.parent.id}`}
                  className='hover:text-blue-400 transition-colors'
                >
                  {team.parent.name}
                </Link>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
