'use client'

import { useState } from 'react'
import { Link } from '@/components/ui/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RagCircle } from '@/components/rag'
import {
  initiativeStatusUtils,
  type InitiativeStatus,
} from '@/lib/initiative-status'
import { Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { removeInitiativeFromSlot } from '@/lib/actions/initiative'
import { toast } from 'sonner'

interface SlotInitiative {
  id: string
  title: string
  status: string
  rag: string
  slot: number | null
  team?: {
    id: string
    name: string
  } | null
  owners?: Array<{
    person: {
      id: string
      name: string
      avatar: string | null
    }
  }>
}

interface SlotCardProps {
  slotNumber: number
  initiative?: SlotInitiative
  onAssignClick: (slotNumber: number) => void
}

export function SlotCard({
  slotNumber,
  initiative,
  onAssignClick,
}: SlotCardProps) {
  const [isRemoving, setIsRemoving] = useState(false)

  const handleRemove = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!initiative) return

    setIsRemoving(true)
    try {
      await removeInitiativeFromSlot(initiative.id)
      toast.success(
        `${initiative.title} has been removed from slot ${slotNumber}`
      )
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to remove from slot'
      )
    } finally {
      setIsRemoving(false)
    }
  }

  if (!initiative) {
    return (
      <button
        onClick={() => onAssignClick(slotNumber)}
        className={cn(
          'group relative flex flex-col items-center justify-center',
          'min-h-[140px] p-4 rounded-lg border-2 border-dashed',
          'border-muted-foreground/25 hover:border-primary/50',
          'bg-muted/20 hover:bg-muted/40',
          'transition-all duration-200',
          'cursor-pointer'
        )}
      >
        <div className='flex flex-col items-center gap-2 text-muted-foreground group-hover:text-primary transition-colors'>
          <Plus className='h-8 w-8' />
          <span className='text-sm font-medium'>Slot {slotNumber}</span>
          <span className='text-xs'>Click to assign initiative</span>
        </div>
      </button>
    )
  }

  const statusVariant = initiativeStatusUtils.getVariant(
    initiative.status as InitiativeStatus
  )

  return (
    <div className='group relative'>
      <Link
        href={`/initiatives/${initiative.id}`}
        className={cn(
          'block min-h-[140px] p-4 rounded-lg border',
          'bg-card hover:bg-muted/50',
          'transition-colors duration-200'
        )}
      >
        <div className='flex flex-col h-full'>
          <div className='flex items-start justify-between gap-2 mb-2'>
            <span className='text-xs text-muted-foreground font-mono'>
              #{slotNumber}
            </span>
            <RagCircle rag={initiative.rag} size='small' />
          </div>

          <h3 className='font-medium text-sm line-clamp-2 mb-2 flex-1'>
            {initiative.title}
          </h3>

          <div className='flex items-center gap-2 flex-wrap'>
            <Badge variant={statusVariant} className='text-xs'>
              {initiativeStatusUtils.getLabel(
                initiative.status as InitiativeStatus
              )}
            </Badge>
            {initiative.team && (
              <span className='text-xs text-muted-foreground truncate'>
                {initiative.team.name}
              </span>
            )}
          </div>
        </div>
      </Link>

      <Button
        variant='ghost'
        size='sm'
        className={cn(
          'absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full',
          'bg-destructive/10 hover:bg-destructive/20 text-destructive',
          'opacity-0 group-hover:opacity-100 transition-opacity',
          'shadow-sm'
        )}
        onClick={handleRemove}
        disabled={isRemoving}
        title='Remove from slot'
      >
        <X className='h-3.5 w-3.5' />
      </Button>
    </div>
  )
}
