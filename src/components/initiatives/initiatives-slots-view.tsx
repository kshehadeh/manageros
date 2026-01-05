'use client'

import { useState, useMemo } from 'react'
import { SlotCard, type SlotInitiative } from './slot-card'
import { SlotInitiativeSelectorModal } from './slot-initiative-selector-modal'
import { InitiativeDetailModal } from './initiative-detail-modal'
import { swapInitiativeSlots } from '@/lib/actions/initiative'
import { toast } from 'sonner'
import type { InitiativeSlotsFilters } from './initiatives-slots-filters'

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
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedInitiativeId, setSelectedInitiativeId] = useState<
    string | null
  >(null)

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

  const handleInitiativeClick = (initiative: SlotInitiative) => {
    setSelectedInitiativeId(initiative.id)
    setDetailModalOpen(true)
  }

  const handleDragStart = (initiative: SlotInitiative) => {
    // Don't allow drag if filters are active
    if (hasActiveFilters) return
    setDraggedInitiative(initiative)
  }

  const handleDragEnd = () => {
    setDraggedInitiative(null)
    setDragOverSlot(null)
  }

  const handleDragOver = (slotNumber: number) => {
    // Don't allow drag over if filters are active
    if (hasActiveFilters) return
    if (draggedInitiative && draggedInitiative.slot !== slotNumber) {
      setDragOverSlot(slotNumber)
    }
  }

  const handleDragLeave = () => {
    setDragOverSlot(null)
  }

  const handleDrop = async (
    targetSlotNumber: number,
    targetInitiative?: SlotInitiative
  ) => {
    // Don't allow drop if filters are active
    if (hasActiveFilters) return
    if (!draggedInitiative) return
    if (draggedInitiative.slot === targetSlotNumber) return

    try {
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
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to move initiative'
      )
    } finally {
      setDraggedInitiative(null)
      setDragOverSlot(null)
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
                onDragOver: () => handleDragOver(slotNumber),
                onDragLeave: handleDragLeave,
                onDrop: handleDrop,
              }

          return (
            <SlotCard
              key={slotNumber}
              slotNumber={slotNumber}
              initiative={initiative}
              onAssignClick={handleAssignClick}
              onInitiativeClick={handleInitiativeClick}
              isDragging={draggedInitiative?.slot === slotNumber}
              isDragOver={dragOverSlot === slotNumber}
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

      {selectedInitiativeId && (
        <InitiativeDetailModal
          initiativeId={selectedInitiativeId}
          isOpen={detailModalOpen}
          onClose={() => {
            setDetailModalOpen(false)
            setSelectedInitiativeId(null)
          }}
        />
      )}
    </>
  )
}
