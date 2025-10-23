import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { RagCircle } from '@/components/rag'
import { initiativeStatusUtils } from '@/lib/initiative-status'
import type { InitiativeStatus } from '@/lib/initiative-status'
import { formatDistanceToNow } from 'date-fns'

interface InitiativeCardProps {
  initiative: {
    id: string
    title: string
    status: string
    rag: string
    updatedAt: Date
    team?: {
      name: string
    } | null
  }
}

export function InitiativeCard({ initiative }: InitiativeCardProps) {
  const statusInfo = initiativeStatusUtils.getVariant(
    initiative.status as InitiativeStatus
  )

  return (
    <Link
      href={`/initiatives/${initiative.id}`}
      className='block p-4 border rounded-lg hover:bg-muted/50 transition-colors'
    >
      <div className='flex items-start justify-between gap-3'>
        <div className='flex-1 min-w-0'>
          <div className='flex items-center justify-between mb-2'>
            <div className='flex items-center gap-2'>
              <h3 className='font-medium text-sm truncate'>
                {initiative.title}
              </h3>
              <RagCircle rag={initiative.rag} size='small' />
            </div>
            <Badge variant={statusInfo} className='text-xs'>
              {initiativeStatusUtils.getLabel(
                initiative.status as InitiativeStatus
              )}
            </Badge>
          </div>

          <div className='flex items-center gap-2 text-xs text-muted-foreground'>
            {initiative.team && (
              <span className='truncate'>{initiative.team.name}</span>
            )}
            <span>•</span>
            <span>
              Updated{' '}
              {formatDistanceToNow(initiative.updatedAt, { addSuffix: true })}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
