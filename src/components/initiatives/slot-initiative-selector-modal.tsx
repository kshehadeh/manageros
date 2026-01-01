'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { RagCircle } from '@/components/rag'
import {
  initiativeStatusUtils,
  type InitiativeStatus,
} from '@/lib/initiative-status'
import { assignInitiativeToSlot } from '@/lib/actions/initiative'
import { toast } from 'sonner'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

interface UnslottedInitiative {
  id: string
  title: string
  status: string
  rag: string
  team?: {
    id: string
    name: string
  } | null
}

interface SlotInitiativeSelectorModalProps {
  isOpen: boolean
  onClose: () => void
  slotNumber: number
  unslottedInitiatives: UnslottedInitiative[]
}

export function SlotInitiativeSelectorModal({
  isOpen,
  onClose,
  slotNumber,
  unslottedInitiatives,
}: SlotInitiativeSelectorModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isAssigning, setIsAssigning] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const filteredInitiatives = unslottedInitiatives.filter(initiative =>
    initiative.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAssign = async (initiativeId: string) => {
    setIsAssigning(true)
    setSelectedId(initiativeId)

    try {
      await assignInitiativeToSlot(initiativeId, slotNumber)
      const initiative = unslottedInitiatives.find(i => i.id === initiativeId)
      toast.success(
        `${initiative?.title || 'Initiative'} assigned to slot ${slotNumber}`
      )
      onClose()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to assign initiative'
      )
    } finally {
      setIsAssigning(false)
      setSelectedId(null)
    }
  }

  const handleClose = () => {
    setSearchQuery('')
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent size='md'>
        <DialogHeader>
          <DialogTitle className='text-lg font-bold font-mono'>
            Assign to Slot {slotNumber}
          </DialogTitle>
        </DialogHeader>

        <div className='mt-4 space-y-4'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
            <Input
              placeholder='Search initiatives...'
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className='pl-9'
            />
          </div>

          <div className='max-h-[50vh] overflow-y-auto space-y-2'>
            {filteredInitiatives.length === 0 ? (
              <div className='text-center text-sm text-muted-foreground py-8'>
                {searchQuery
                  ? 'No matching initiatives found'
                  : 'No unassigned initiatives available'}
              </div>
            ) : (
              filteredInitiatives.map(initiative => {
                const statusVariant = initiativeStatusUtils.getVariant(
                  initiative.status as InitiativeStatus
                )
                const isSelected = selectedId === initiative.id

                return (
                  <button
                    key={initiative.id}
                    onClick={() => handleAssign(initiative.id)}
                    disabled={isAssigning}
                    className={cn(
                      'w-full text-left p-3 rounded-lg border',
                      'hover:bg-muted/50 transition-colors',
                      'disabled:opacity-50 disabled:cursor-not-allowed',
                      isSelected && 'bg-muted/50'
                    )}
                  >
                    <div className='flex items-start gap-3'>
                      <RagCircle rag={initiative.rag} size='small' />
                      <div className='flex-1 min-w-0'>
                        <h4 className='font-medium text-sm truncate'>
                          {initiative.title}
                        </h4>
                        <div className='flex items-center gap-2 mt-1'>
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
                      {isSelected && isAssigning && (
                        <span className='text-xs text-muted-foreground'>
                          Assigning...
                        </span>
                      )}
                    </div>
                  </button>
                )
              })
            )}
          </div>

          <div className='flex justify-end'>
            <Button variant='outline' onClick={handleClose}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
