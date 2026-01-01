'use client'

import { useState } from 'react'
import { SlotCard, type SlotInitiative } from './slot-card'
import { SlotInitiativeSelectorModal } from './slot-initiative-selector-modal'
import { swapInitiativeSlots } from '@/lib/actions/initiative'
import { toast } from 'sonner'

interface InitiativesSlotsViewProps {
  slottedInitiatives: SlotInitiative[]
  unslottedInitiatives: SlotInitiative[]
  totalSlots: number
}

export function InitiativesSlotsView({
  slottedInitiatives,
  unslottedInitiatives,
  totalSlots,
}: InitiativesSlotsViewProps) {
  const [selectorModalOpen, setSelectorModalOpen] = useState(false)
  const [selectedSlotNumber, setSelectedSlotNumber] = useState<number>(1)
  const [draggedInitiative, setDraggedInitiative] =
    useState<SlotInitiative | null>(null)
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null)

  const handleAssignClick = (slotNumber: number) => {
    setSelectedSlotNumber(slotNumber)
    setSelectorModalOpen(true)
  }

  const handleDragStart = (initiative: SlotInitiative) => {
    setDraggedInitiative(initiative)
  }

  const handleDragEnd = () => {
    setDraggedInitiative(null)
    setDragOverSlot(null)
  }

  const handleDragOver = (slotNumber: number) => {
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
  const slotMap = new Map<number, SlotInitiative>()
  slottedInitiatives.forEach(initiative => {
    if (initiative.slot !== null) {
      slotMap.set(initiative.slot, initiative)
    }
  })

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
          return (
            <SlotCard
              key={slotNumber}
              slotNumber={slotNumber}
              initiative={initiative}
              onAssignClick={handleAssignClick}
              isDragging={draggedInitiative?.slot === slotNumber}
              isDragOver={dragOverSlot === slotNumber}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragOver={() => handleDragOver(slotNumber)}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
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
