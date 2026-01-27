'use client'

import { useState, useMemo } from 'react'
import {
  SlotCard,
  type SlotInitiative,
  type InsertMarkerDirection,
  type DragMode,
} from './slot-card'
import { SlotInitiativeSelectorModal } from './slot-initiative-selector-modal'
import {
  swapInitiativeSlots,
  insertInitiativeAtSlot,
} from '@/lib/actions/initiative'
import { toast } from 'sonner'
import type { InitiativeSlotsFilters } from './initiatives-slots-filters'

interface InsertPosition {
  slotNumber: number
  direction: InsertMarkerDirection
}

interface InitiativesSlotsViewProps {
  slottedInitiatives: SlotInitiative[]
  unslottedInitiatives: SlotInitiative[]
  totalSlots: number
  filters?: InitiativeSlotsFilters
}

export function InitiativesSlotsView({
  slottedInitiatives,
  unslottedInitiatives,
  totalSlots,
  filters = { teamIds: [], personIds: [] },
}: InitiativesSlotsViewProps) {
  const [selectorModalOpen, setSelectorModalOpen] = useState(false)
  const [selectedSlotNumber, setSelectedSlotNumber] = useState<number>(1)
  const [draggedInitiative, setDraggedInitiative] =
    useState<SlotInitiative | null>(null)
  const [swapTargetSlot, setSwapTargetSlot] = useState<number | null>(null)
  const [insertPosition, setInsertPosition] = useState<InsertPosition | null>(
    null
  )

  // Check if any filters are active
  const hasActiveFilters =
    filters.teamIds.length > 0 || filters.personIds.length > 0

  // Filter matching logic
  const matchesFilters = (initiative: SlotInitiative): boolean => {
    // If no filters are active, all initiatives match
    if (!hasActiveFilters) {
      return true
    }

    // Check team filter
    const matchesTeam =
      filters.teamIds.length === 0 ||
      Boolean(initiative.team && filters.teamIds.includes(initiative.team.id))

    // Check person/owner filter
    const matchesPerson =
      filters.personIds.length === 0 ||
      Boolean(
        initiative.owners &&
        initiative.owners.some(owner =>
          filters.personIds.includes(owner.person.id)
        )
      )

    // Initiative matches if it matches ALL active filters (AND logic)
    return matchesTeam && matchesPerson
  }

  const handleAssignClick = (slotNumber: number) => {
    setSelectedSlotNumber(slotNumber)
    setSelectorModalOpen(true)
  }

  const handleDragStart = (initiative: SlotInitiative) => {
    // Don't allow drag if filters are active
    if (hasActiveFilters) return
    setDraggedInitiative(initiative)
  }

  const handleDragEnd = () => {
    setDraggedInitiative(null)
    setSwapTargetSlot(null)
    setInsertPosition(null)
  }

  const handleDragOver = (info: {
    slotNumber: number
    mode: DragMode
    insertDirection: InsertMarkerDirection
  }) => {
    // Don't allow drag over if filters are active
    if (hasActiveFilters) return
    if (!draggedInitiative) return
    if (draggedInitiative.slot === info.slotNumber) {
      // Clear states when hovering over source
      setSwapTargetSlot(null)
      setInsertPosition(null)
      return
    }

    if (info.mode === 'swap') {
      setSwapTargetSlot(info.slotNumber)
      setInsertPosition(null)
    } else if (info.mode === 'insert' && info.insertDirection) {
      setSwapTargetSlot(null)
      setInsertPosition({
        slotNumber: info.slotNumber,
        direction: info.insertDirection,
      })
    }
  }

  const handleDragLeave = () => {
    setSwapTargetSlot(null)
    setInsertPosition(null)
  }

  /**
   * Calculate the target slot number for insert operations
   * Based on the current slot and insert direction
   */
  const calculateInsertTargetSlot = (
    currentSlot: number,
    direction: InsertMarkerDirection
  ): number => {
    if (direction === 'left' || direction === 'top') {
      // Insert before this slot
      return currentSlot
    }
    // Insert after this slot (right or bottom)
    return currentSlot + 1
  }

  const handleDrop = async (
    targetSlotNumber: number,
    targetInitiative?: SlotInitiative,
    mode?: DragMode
  ) => {
    // Don't allow drop if filters are active
    if (hasActiveFilters) return
    if (!draggedInitiative) return
    if (draggedInitiative.slot === targetSlotNumber && mode === 'swap') return

    try {
      if (mode === 'insert' && insertPosition?.direction) {
        // Insert operation - shift slots
        const insertTargetSlot = calculateInsertTargetSlot(
          targetSlotNumber,
          insertPosition.direction
        )

        // Don't insert at the same position
        if (draggedInitiative.slot === insertTargetSlot) {
          return
        }

        await insertInitiativeAtSlot(draggedInitiative.id, insertTargetSlot)
        toast.success(
          `Inserted "${draggedInitiative.title}" at slot ${insertTargetSlot}`
        )
      } else {
        // Swap operation
        await swapInitiativeSlots(
          draggedInitiative.id,
          targetSlotNumber,
          targetInitiative?.id
        )

        if (targetInitiative) {
          toast.success(
            `Swapped "${draggedInitiative.title}" with "${targetInitiative.title}"`
          )
        } else {
          toast.success(
            `Moved "${draggedInitiative.title}" to slot ${targetSlotNumber}`
          )
        }
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to move initiative'
      )
    } finally {
      setDraggedInitiative(null)
      setSwapTargetSlot(null)
      setInsertPosition(null)
    }
  }

  // Create a map of slot number to initiative
  const slotMap = useMemo(() => {
    const map = new Map<number, SlotInitiative>()
    slottedInitiatives.forEach(initiative => {
      if (initiative.slot !== null) {
        map.set(initiative.slot, initiative)
      }
    })
    return map
  }, [slottedInitiatives])

  // Generate slot numbers from 1 to totalSlots
  const slotNumbers = Array.from({ length: totalSlots }, (_, i) => i + 1)

  if (totalSlots === 0) {
    return (
      <div className='text-center text-muted-foreground py-12'>
        <p className='text-sm'>No active initiatives available.</p>
        <p className='text-xs mt-1'>
          Create initiatives to start using the slots view.
        </p>
      </div>
    )
  }

  /**
   * Determine the insert marker direction for a specific slot
   */
  const getInsertMarkerDirection = (
    slotNumber: number
  ): InsertMarkerDirection => {
    if (!insertPosition) return null
    if (insertPosition.slotNumber !== slotNumber) return null
    return insertPosition.direction
  }

  return (
    <>
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
        {slotNumbers.map(slotNumber => {
          const initiative = slotMap.get(slotNumber)
          const isFilteredOut =
            initiative !== undefined && !matchesFilters(initiative)

          const dragHandlers = hasActiveFilters
            ? {}
            : {
                onDragStart: handleDragStart,
                onDragEnd: handleDragEnd,
                onDragOver: handleDragOver,
                onDragLeave: handleDragLeave,
                onDrop: handleDrop,
              }

          return (
            <SlotCard
              key={slotNumber}
              slotNumber={slotNumber}
              initiative={initiative}
              onAssignClick={handleAssignClick}
              isDragging={draggedInitiative?.slot === slotNumber}
              isSwapTarget={swapTargetSlot === slotNumber}
              insertMarkerDirection={getInsertMarkerDirection(slotNumber)}
              isFilteredOut={isFilteredOut}
              {...dragHandlers}
            />
          )
        })}
      </div>

      <SlotInitiativeSelectorModal
        isOpen={selectorModalOpen}
        onClose={() => setSelectorModalOpen(false)}
        slotNumber={selectedSlotNumber}
        unslottedInitiatives={unslottedInitiatives}
      />
    </>
  )
}
