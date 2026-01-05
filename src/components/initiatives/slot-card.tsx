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
import { initiativeSizeUtils, type InitiativeSize } from '@/lib/initiative-size'
import {
  GripVertical,
  Plus,
  X,
  Users,
  Ruler,
  Calendar,
  TrendingUp,
} from 'lucide-react'
import { formatShortDate } from '@/lib/utils/date-utils'
import { cn } from '@/lib/utils'
import { removeInitiativeFromSlot } from '@/lib/actions/initiative'
import { toast } from 'sonner'

export interface SlotInitiative {
  id: string
  title: string
  status: string
  rag: string
  slot: number | null
  size?: string | null
  targetDate?: Date | null
  progress?: number
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
  onInitiativeClick?: (initiative: SlotInitiative) => void
  isDragging?: boolean
  isDragOver?: boolean
  isFilteredOut?: boolean
  onDragStart?: (initiative: SlotInitiative) => void
  onDragEnd?: () => void
  onDragOver?: (e: React.DragEvent) => void
  onDragLeave?: () => void
  onDrop?: (slotNumber: number, initiative?: SlotInitiative) => void
}

export function SlotCard({
  slotNumber,
  initiative,
  onAssignClick,
  onInitiativeClick,
  isDragging = false,
  isDragOver = false,
  isFilteredOut = false,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
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

  const handleDragStart = (e: React.DragEvent) => {
    if (!initiative || isFilteredOut) return
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', initiative.id)
    onDragStart?.(initiative)
  }

  const handleDragOver = (e: React.DragEvent) => {
    if (isFilteredOut) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    onDragOver?.(e)
  }

  const handleDrop = (e: React.DragEvent) => {
    if (isFilteredOut) return
    e.preventDefault()
    onDrop?.(slotNumber, initiative)
  }

  if (!initiative) {
    return (
      <button
        onClick={() => onAssignClick(slotNumber)}
        onDragOver={isFilteredOut ? undefined : handleDragOver}
        onDragLeave={isFilteredOut ? undefined : onDragLeave}
        onDrop={isFilteredOut ? undefined : handleDrop}
        className={cn(
          'group relative flex flex-col items-center justify-center',
          'min-h-[140px] p-4 rounded-lg border-2 border-dashed',
          'border-muted-foreground/25 hover:border-primary/50',
          'bg-muted/20 hover:bg-muted/40',
          'transition-all duration-200',
          'cursor-pointer',
          isDragOver &&
            !isFilteredOut &&
            'border-primary bg-primary/10 scale-[1.02]'
        )}
      >
        <div className='flex flex-col items-center gap-2 text-muted-foreground group-hover:text-primary transition-colors'>
          <Plus className='h-8 w-8' />
          <span className='text-sm font-medium'>Slot {slotNumber}</span>
          <span className='text-xs'>
            {isDragOver && !isFilteredOut
              ? 'Drop to assign'
              : 'Click to assign initiative'}
          </span>
        </div>
      </button>
    )
  }

  const statusVariant = initiativeStatusUtils.getVariant(
    initiative.status as InitiativeStatus
  )

  return (
    <div
      className={cn(
        'group relative',
        isDragging && 'opacity-50 scale-95',
        isDragOver && !isFilteredOut && 'scale-[1.02]',
        isFilteredOut && 'opacity-60'
      )}
      draggable={!isFilteredOut}
      onDragStart={isFilteredOut ? undefined : handleDragStart}
      onDragEnd={isFilteredOut ? undefined : onDragEnd}
      onDragOver={isFilteredOut ? undefined : handleDragOver}
      onDragLeave={isFilteredOut ? undefined : onDragLeave}
      onDrop={isFilteredOut ? undefined : handleDrop}
    >
      <div
        className={cn(
          'block min-h-[140px] p-4 rounded-lg border',
          'bg-card hover:bg-muted/50',
          'transition-all duration-200',
          isFilteredOut
            ? 'cursor-default'
            : 'cursor-grab active:cursor-grabbing',
          isDragOver && !isFilteredOut && 'border-primary border-2 bg-primary/5'
        )}
      >
        <div className='flex flex-col h-full'>
          <div className='flex items-start justify-between gap-2 mb-2'>
            <div className='flex items-center gap-1'>
              {!isFilteredOut && (
                <GripVertical className='h-3.5 w-3.5 text-muted-foreground/50' />
              )}
              <span
                className={cn(
                  'text-xs font-mono',
                  isFilteredOut
                    ? 'text-muted-foreground'
                    : 'text-muted-foreground'
                )}
              >
                #{slotNumber}
              </span>
            </div>
            <RagCircle rag={initiative.rag} size='small' />
          </div>

          {onInitiativeClick ? (
            <button
              type='button'
              className='flex-1 text-left'
              onClick={e => {
                e.stopPropagation()
                onInitiativeClick(initiative)
              }}
              draggable={false}
            >
              <h3
                className={cn(
                  'font-medium text-sm line-clamp-2 mb-2 transition-colors',
                  isFilteredOut ? 'text-muted-foreground' : 'hover:text-primary'
                )}
              >
                {initiative.title}
              </h3>
            </button>
          ) : (
            <Link
              href={`/initiatives/${initiative.id}`}
              className='flex-1'
              onClick={e => e.stopPropagation()}
              draggable={false}
            >
              <h3
                className={cn(
                  'font-medium text-sm line-clamp-2 mb-2 transition-colors',
                  isFilteredOut ? 'text-muted-foreground' : 'hover:text-primary'
                )}
              >
                {initiative.title}
              </h3>
            </Link>
          )}

          <div className='flex items-center gap-2 flex-wrap'>
            <Badge
              variant={statusVariant}
              className={cn('text-xs', isFilteredOut && 'opacity-60')}
            >
              {initiativeStatusUtils.getLabel(
                initiative.status as InitiativeStatus
              )}
            </Badge>
            {initiative.team && (
              <span
                className={cn(
                  'text-xs truncate',
                  isFilteredOut
                    ? 'text-muted-foreground'
                    : 'text-muted-foreground'
                )}
              >
                {initiative.team.name}
              </span>
            )}
          </div>

          {/* People count, size, target date, and progress */}
          <div
            className={cn(
              'flex items-center gap-3 mt-2 pt-2 border-t flex-wrap',
              isFilteredOut ? 'border-border/30' : 'border-border/50'
            )}
          >
            {initiative.owners && initiative.owners.length > 0 && (
              <div
                className={cn(
                  'flex items-center gap-1 text-xs',
                  isFilteredOut
                    ? 'text-muted-foreground'
                    : 'text-muted-foreground'
                )}
              >
                <Users className='h-3 w-3' />
                <span>
                  {initiative.owners.length}{' '}
                  {initiative.owners.length === 1 ? 'person' : 'people'}
                </span>
              </div>
            )}
            {initiative.size &&
              initiativeSizeUtils.isValid(initiative.size) && (
                <div
                  className={cn(
                    'flex items-center gap-1 text-xs',
                    isFilteredOut
                      ? 'text-muted-foreground'
                      : 'text-muted-foreground'
                  )}
                >
                  <Ruler className='h-3 w-3' />
                  <span>
                    {initiativeSizeUtils.getShortLabel(
                      initiative.size as InitiativeSize
                    )}
                  </span>
                </div>
              )}
            {initiative.targetDate && (
              <div
                className={cn(
                  'flex items-center gap-1 text-xs',
                  isFilteredOut
                    ? 'text-muted-foreground'
                    : 'text-muted-foreground'
                )}
              >
                <Calendar className='h-3 w-3' />
                <span>{formatShortDate(initiative.targetDate)}</span>
              </div>
            )}
            {initiative.progress !== undefined && (
              <div
                className={cn(
                  'flex items-center gap-1 text-xs',
                  isFilteredOut
                    ? 'text-muted-foreground'
                    : 'text-muted-foreground'
                )}
              >
                <TrendingUp className='h-3 w-3' />
                <span>{initiative.progress}%</span>
              </div>
            )}
          </div>
        </div>
      </div>

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
