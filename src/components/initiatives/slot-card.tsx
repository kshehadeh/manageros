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
import { InitiativeSlotPopup } from './initiative-slot-popup'

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

export type InsertMarkerDirection = 'left' | 'right' | 'top' | 'bottom' | null
export type DragMode = 'insert' | 'swap' | null

interface DragPositionInfo {
  slotNumber: number
  mode: DragMode
  insertDirection: InsertMarkerDirection
}

interface SlotCardProps {
  slotNumber: number
  initiative?: SlotInitiative
  onAssignClick: (slotNumber: number) => void
  onInitiativeClick?: (initiative: SlotInitiative) => void
  isDragging?: boolean
  isSwapTarget?: boolean
  insertMarkerDirection?: InsertMarkerDirection
  isFilteredOut?: boolean
  onDragStart?: (initiative: SlotInitiative) => void
  onDragEnd?: () => void
  onDragOver?: (info: DragPositionInfo) => void
  onDragLeave?: () => void
  onDrop?: (
    slotNumber: number,
    initiative?: SlotInitiative,
    mode?: DragMode
  ) => void
}

export function SlotCard({
  slotNumber,
  initiative,
  onAssignClick,
  onInitiativeClick,
  isDragging = false,
  isSwapTarget = false,
  insertMarkerDirection = null,
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

  /**
   * Determine drag mode based on mouse position within the card
   * Edge zones (25%) = insert mode, Center zone (50%) = swap mode
   */
  const getDragPositionInfo = (e: React.DragEvent): DragPositionInfo => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const width = rect.width
    const height = rect.height

    // Calculate relative positions (0-1)
    const relX = x / width
    const relY = y / height

    // Edge threshold (25% from each edge)
    const edgeThreshold = 0.25

    // Check if in edge zones
    const inLeftEdge = relX < edgeThreshold
    const inRightEdge = relX > 1 - edgeThreshold
    const inTopEdge = relY < edgeThreshold
    const inBottomEdge = relY > 1 - edgeThreshold

    // Determine insert direction based on edge proximity
    // Prioritize the edge that's closest
    if (inLeftEdge || inRightEdge || inTopEdge || inBottomEdge) {
      // Calculate distances to each edge
      const distToLeft = relX
      const distToRight = 1 - relX
      const distToTop = relY
      const distToBottom = 1 - relY

      const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom)

      let insertDirection: InsertMarkerDirection = null
      if (minDist === distToLeft && inLeftEdge) {
        insertDirection = 'left'
      } else if (minDist === distToRight && inRightEdge) {
        insertDirection = 'right'
      } else if (minDist === distToTop && inTopEdge) {
        insertDirection = 'top'
      } else if (minDist === distToBottom && inBottomEdge) {
        insertDirection = 'bottom'
      }

      if (insertDirection) {
        return {
          slotNumber,
          mode: 'insert',
          insertDirection,
        }
      }
    }

    // Default to swap mode (center area)
    return {
      slotNumber,
      mode: 'swap',
      insertDirection: null,
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    if (isFilteredOut) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'

    const positionInfo = getDragPositionInfo(e)
    onDragOver?.(positionInfo)
  }

  const handleDragLeave = () => {
    onDragLeave?.()
  }

  const handleDrop = (e: React.DragEvent) => {
    if (isFilteredOut) return
    e.preventDefault()
    const positionInfo = getDragPositionInfo(e)
    onDrop?.(slotNumber, initiative, positionInfo.mode)
  }

  // Render insert marker
  const renderInsertMarker = (direction: InsertMarkerDirection) => {
    if (!direction) return null

    const isVertical = direction === 'left' || direction === 'right'
    const baseClasses = 'absolute bg-primary z-10 transition-all duration-150'

    if (isVertical) {
      return (
        <div
          className={cn(
            baseClasses,
            'w-[3px] top-0 bottom-0 rounded-full',
            direction === 'left' ? '-left-[10px]' : '-right-[10px]'
          )}
        />
      )
    }

    return (
      <div
        className={cn(
          baseClasses,
          'h-[3px] left-0 right-0 rounded-full',
          direction === 'top' ? '-top-[10px]' : '-bottom-[10px]'
        )}
      />
    )
  }

  if (!initiative) {
    return (
      <div className='relative'>
        {renderInsertMarker(insertMarkerDirection)}
        <button
          onClick={() => onAssignClick(slotNumber)}
          onDragOver={isFilteredOut ? undefined : handleDragOver}
          onDragLeave={isFilteredOut ? undefined : handleDragLeave}
          onDrop={isFilteredOut ? undefined : handleDrop}
          className={cn(
            'group relative flex flex-col items-center justify-center w-full',
            'min-h-[140px] p-4 rounded-lg border-2 border-dashed',
            'border-muted-foreground/25 hover:border-primary/50',
            'bg-muted/20 hover:bg-muted/40',
            'transition-all duration-200',
            'cursor-pointer',
            isSwapTarget &&
              !isFilteredOut &&
              'border-primary bg-primary/10 scale-[1.02]'
          )}
        >
          <div className='flex flex-col items-center gap-2 text-muted-foreground group-hover:text-primary transition-colors'>
            <Plus className='h-8 w-8' />
            <span className='text-sm font-medium'>Slot {slotNumber}</span>
            <span className='text-xs'>
              {isSwapTarget && !isFilteredOut
                ? 'Drop to assign'
                : 'Click to assign initiative'}
            </span>
          </div>
        </button>
      </div>
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
        isFilteredOut && 'opacity-60'
      )}
      draggable={!isFilteredOut}
      onDragStart={isFilteredOut ? undefined : handleDragStart}
      onDragEnd={isFilteredOut ? undefined : onDragEnd}
      onDragOver={isFilteredOut ? undefined : handleDragOver}
      onDragLeave={isFilteredOut ? undefined : handleDragLeave}
      onDrop={isFilteredOut ? undefined : handleDrop}
    >
      {renderInsertMarker(insertMarkerDirection)}
      {initiative ? (
        <InitiativeSlotPopup initiativeId={initiative.id}>
          <div
            className={cn(
              'block min-h-[140px] p-4 rounded-lg border',
              'bg-card hover:bg-muted/50',
              'transition-all duration-200',
              isFilteredOut
                ? 'cursor-default'
                : 'cursor-grab active:cursor-grabbing',
              isSwapTarget &&
                !isFilteredOut &&
                'border-primary border-2 bg-primary/5 scale-[1.02]'
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
                      isFilteredOut
                        ? 'text-muted-foreground'
                        : 'hover:text-primary'
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
                      isFilteredOut
                        ? 'text-muted-foreground'
                        : 'hover:text-primary'
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
        </InitiativeSlotPopup>
      ) : null}

      {initiative && (
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
      )}
    </div>
  )
}
