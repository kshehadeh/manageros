'use client'

import { useState } from 'react'
import { SlotCard } from './slot-card'
import { SlotInitiativeSelectorModal } from './slot-initiative-selector-modal'

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

  const handleAssignClick = (slotNumber: number) => {
    setSelectedSlotNumber(slotNumber)
    setSelectorModalOpen(true)
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
        {slotNumbers.map(slotNumber => (
          <SlotCard
            key={slotNumber}
            slotNumber={slotNumber}
            initiative={slotMap.get(slotNumber)}
            onAssignClick={handleAssignClick}
          />
        ))}
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
