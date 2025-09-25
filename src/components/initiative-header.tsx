import { Rag } from '@/components/rag'
import Link from 'next/link'
import { InitiativeActionsDropdown } from '@/components/initiative-actions-dropdown'

interface InitiativeHeaderProps {
  initiative: {
    id: string
    title: string
    summary: string | null
    rag: string
    confidence: number
    team: {
      id: string
      name: string
    } | null
    owners: Array<{
      person: {
        id: string
        name: string
      }
      role: string
    }>
  }
}

export function InitiativeHeader({ initiative }: InitiativeHeaderProps) {
  return (
    <div className='page-header'>
      <div className='flex items-center justify-between'>
        <div className='flex-1'>
          <div className='flex items-center gap-3 mb-2'>
            <h1 className='page-title'>{initiative.title}</h1>
            <div className='flex items-center gap-2'>
              <Rag rag={initiative.rag} />
              <span className='badge'>{initiative.confidence}%</span>
            </div>
          </div>
          {initiative.summary && (
            <p className='page-subtitle'>{initiative.summary}</p>
          )}

          {/* Team and Owner Details */}
          <div className='space-y-2 mt-4'>
            {initiative.team && (
              <div className='flex items-center gap-2'>
                <span className='text-sm font-medium text-muted-foreground'>
                  Team:
                </span>
                <Link
                  href={`/teams/${initiative.team.id}`}
                  className='link-hover'
                >
                  {initiative.team.name}
                </Link>
              </div>
            )}

            {initiative.owners.length > 0 && (
              <div className='flex items-center gap-2'>
                <span className='text-sm font-medium text-muted-foreground'>
                  Owners:
                </span>
                <div className='flex items-center gap-2'>
                  {initiative.owners.map((owner, index) => (
                    <span
                      key={owner.person.id}
                      className='flex items-center gap-1'
                    >
                      <Link
                        href={`/people/${owner.person.id}`}
                        className='link-hover'
                      >
                        {owner.person.name}
                      </Link>
                      <span className='text-xs text-muted-foreground'>
                        ({owner.role})
                      </span>
                      {index < initiative.owners.length - 1 && (
                        <span className='text-muted-foreground'>,</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <InitiativeActionsDropdown initiativeId={initiative.id} />
      </div>
    </div>
  )
}
