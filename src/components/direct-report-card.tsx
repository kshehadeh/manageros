import Link from 'next/link'
import { PersonActionsDropdown } from '@/components/person-actions-dropdown'
import { PersonStatusBadge } from '@/components/person-status-badge'
import { Person, Team } from '@prisma/client'

// Define the type for a person with all the relations needed for direct reports
// This is flexible enough to handle different query patterns used across the app
type DirectReport = Person & {
  team?:
    | Team
    | {
        id: string
        name: string
      }
    | null
  user?: {
    id: string
    name: string
    email: string
  } | null
  reports?: Person[]
  manager?: Person | null
  _count?: {
    oneOnOnes: number
    feedback: number
    tasks: number
    reports: number
  }
}

interface PersonListItemCardProps {
  person: DirectReport
  variant?: 'simple' | 'detailed' | 'compact'
  showActions?: boolean
  currentPerson?: Person | null
  isAdmin?: boolean
  className?: string
}

export function PersonListItemCard({
  person,
  variant = 'simple',
  showActions = false,
  currentPerson,
  isAdmin = false,
  className = '',
}: PersonListItemCardProps) {
  if (variant === 'detailed') {
    return (
      <div
        className={`bg-card border rounded-xl p-6 hover:border-border/80 transition-colors ${className}`}
      >
        {/* Header */}
        <div className='flex items-start justify-between mb-4'>
          <div className='flex-1'>
            <div className='flex items-center gap-2 mb-1'>
              <Link
                href={`/people/${person.id}`}
                className='text-lg font-semibold text-card-foreground hover:text-primary transition-colors'
              >
                {person.name}
              </Link>
              <PersonStatusBadge status={person.status} size='sm' />
            </div>
            {person.role && (
              <p className='text-sm text-muted-foreground mt-1'>
                {person.role}
              </p>
            )}
            {person.email && (
              <p className='text-xs text-muted-foreground/70 mt-1'>
                {person.email}
              </p>
            )}
          </div>
          {showActions && currentPerson && (
            <PersonActionsDropdown
              person={{
                ...person,
                team:
                  person.team && 'createdAt' in person.team
                    ? person.team
                    : null,
                reports: person.reports || [],
                manager: person.manager || null,
              }}
              currentPerson={currentPerson}
              isAdmin={isAdmin}
              size='sm'
            />
          )}
        </div>

        {/* Team */}
        {person.team && (
          <div className='mb-4'>
            <span className='text-xs text-muted-foreground'>Team:</span>
            <span className='text-sm text-card-foreground ml-1'>
              {person.team.name}
            </span>
          </div>
        )}

        {/* Statistics */}
        {person._count && (
          <div className='grid grid-cols-2 gap-4 pt-4 border-t border-border'>
            <div className='text-center'>
              <div className='text-xl font-bold text-primary'>
                {person._count.oneOnOnes}
              </div>
              <div className='text-xs text-muted-foreground'>1:1s</div>
            </div>
            <div className='text-center'>
              <Link
                href={`/people/${person.id}#feedback`}
                className='block hover:bg-accent/10 rounded-lg p-2 transition-colors'
              >
                <div className='text-xl font-bold text-badge-success'>
                  {person._count.feedback}
                </div>
                <div className='text-xs text-muted-foreground'>Feedback</div>
              </Link>
            </div>
            <div className='text-center'>
              <div className='text-xl font-bold text-badge-info'>
                {person._count.tasks}
              </div>
              <div className='text-xs text-muted-foreground'>Tasks</div>
            </div>
            <div className='text-center'>
              <div className='text-xl font-bold text-badge-warning'>
                {person._count.reports}
              </div>
              <div className='text-xs text-muted-foreground'>Reports</div>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center justify-between ${className}`}>
        <div>
          <Link
            href={`/people/${person.id}`}
            className='font-medium hover:text-blue-400'
          >
            {person.name}
          </Link>
          <div className='text-neutral-400 text-sm'>{person.role ?? ''}</div>
          <div className='text-xs text-neutral-500 mt-1'>
            {person.team?.name && (
              <span>
                Team:{' '}
                <Link
                  href={`/teams/${person.team.id}`}
                  className='hover:text-blue-400'
                >
                  {person.team.name}
                </Link>
              </span>
            )}
            {person._count?.reports && person._count.reports > 0 && (
              <span>
                {' '}
                • {person._count.reports} report
                {person._count.reports !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <PersonStatusBadge status={person.status} size='sm' />
        </div>
      </div>
    )
  }

  // Default 'simple' variant
  return (
    <div className={`border rounded-xl p-3 ${className}`}>
      <div className='flex items-start justify-between'>
        <div className='flex-1'>
          <div className='flex items-center gap-2 mb-1'>
            <Link
              href={`/people/${person.id}`}
              className='font-medium hover:text-blue-400'
            >
              {person.name}
            </Link>
            <PersonStatusBadge status={person.status} size='sm' />
          </div>
          <div className='text-sm text-neutral-400'>{person.role ?? ''}</div>
          <div className='text-xs text-neutral-500'>{person.email}</div>
          {person.team && (
            <div className='text-xs text-neutral-500 mt-1'>
              Team: {person.team.name}
            </div>
          )}
        </div>
        {showActions && currentPerson && (
          <PersonActionsDropdown
            person={{
              ...person,
              team:
                person.team && 'createdAt' in person.team ? person.team : null,
              reports: person.reports || [],
              manager: person.manager || null,
            }}
            currentPerson={currentPerson}
            isAdmin={isAdmin}
            size='sm'
          />
        )}
      </div>
    </div>
  )
}
