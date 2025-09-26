import Link from 'next/link'
import { Rag } from '@/components/rag'

interface InitiativeCardProps {
  initiative: {
    id: string
    title: string
    summary?: string | null
    rag: string
    confidence: number
    objectives: Array<{ id: string }>
    _count: { checkIns: number }
    team?: {
      id: string
      name: string
    } | null
    owners?: Array<{
      person: {
        id: string
        name: string
      }
    }> | null
  }
  variant?: 'compact' | 'default'
  showTeam?: boolean
  showOwners?: boolean
  showSummary?: boolean
  className?: string
}

export function InitiativeCard({
  initiative,
  variant = 'default',
  showTeam = true,
  showOwners = false,
  showSummary = true,
  className = '',
}: InitiativeCardProps) {
  const cardClasses =
    variant === 'compact'
      ? 'flex items-center justify-between'
      : 'card hover:bg-accent/50 transition-colors w-full'

  const titleClasses =
    variant === 'compact' ? 'font-medium hover:text-primary' : 'font-semibold'

  const summaryClasses =
    variant === 'compact'
      ? 'text-muted-foreground text-sm'
      : 'text-sm text-muted-foreground'

  const metadataClasses =
    variant === 'compact'
      ? 'text-xs text-muted-foreground mt-1'
      : 'text-xs text-muted-foreground mt-2'

  const content = (
    <div className={cardClasses}>
      <div className='flex-1 min-w-0 overflow-hidden'>
        <div className='flex items-center gap-2 min-w-0'>
          <Link
            href={`/initiatives/${initiative.id}`}
            className={`${titleClasses} truncate flex-1 min-w-0`}
          >
            {initiative.title}
          </Link>
          <Rag rag={initiative.rag} />
          <span className='badge'>{initiative.confidence}%</span>
        </div>
        {showSummary && (
          <div className={`${summaryClasses} truncate`}>
            {initiative.summary ?? ''}
          </div>
        )}
        <div className={`${metadataClasses} truncate`}>
          {initiative.objectives.length} objectives •{' '}
          {initiative._count.checkIns} check-ins
          {showTeam && initiative.team && (
            <span>
              {' '}
              • Team:{' '}
              <Link
                href={`/teams/${initiative.team.id}`}
                className='hover:text-primary'
              >
                {initiative.team.name}
              </Link>
            </span>
          )}
          {showOwners && initiative.owners && initiative.owners.length > 0 && (
            <span>
              {' '}
              • Owners:{' '}
              {initiative.owners.map((owner, index) => (
                <span key={owner.person.id}>
                  <Link
                    href={`/people/${owner.person.id}`}
                    className='hover:text-primary'
                  >
                    {owner.person.name}
                  </Link>
                  {index < initiative.owners!.length - 1 && ', '}
                </span>
              ))}
            </span>
          )}
        </div>
      </div>
    </div>
  )

  if (variant === 'compact') {
    return <div className={className}>{content}</div>
  }

  return (
    <Link
      href={`/initiatives/${initiative.id}`}
      className={`block ${className}`}
    >
      {content}
    </Link>
  )
}
