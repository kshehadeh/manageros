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
      <div className='space-y-2'>
        <div className='flex items-center gap-3'>
          <h3 className='font-medium text-sm truncate'>{initiative.title}</h3>
        </div>

        <div className='flex items-center gap-2 text-xs text-muted-foreground'>
          <Badge variant={statusInfo} className='text-xs shrink-0'>
            {initiativeStatusUtils.getLabel(
              initiative.status as InitiativeStatus
            )}
          </Badge>
          <RagCircle rag={initiative.rag} size='small' />
          {initiative.team && (
            <>
              <span className='truncate'>{initiative.team.name}</span>
              <span>•</span>
            </>
          )}
          <span>
            Updated{' '}
            {formatDistanceToNow(initiative.updatedAt, { addSuffix: true })}
          </span>
        </div>
      </div>
    </Link>
  )
}
