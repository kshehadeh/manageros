'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Rocket, Loader2 } from 'lucide-react'
import { addInitiativeOwner } from '@/lib/actions/initiative'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface Initiative {
  id: string
  title: string
  status: string
}

interface AssociateInitiativeModalProps {
  isOpen: boolean
  onClose: () => void
  personId: string
  organizationId: string
  existingInitiativeIds: string[] // IDs of initiatives the person already owns
}

export function AssociateInitiativeModal({
  isOpen,
  onClose,
  personId,
  existingInitiativeIds,
}: AssociateInitiativeModalProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [initiatives, setInitiatives] = useState<Initiative[]>([])
  const [selectedInitiativeId, setSelectedInitiativeId] = useState<string>('')

  const loadInitiatives = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/initiatives?limit=100`)
      if (!response.ok) {
        throw new Error('Failed to load initiatives')
      }
      const data = await response.json()

      // Filter out initiatives the person already owns
      const availableInitiatives = data.initiatives.filter(
        (init: Initiative) => !existingInitiativeIds.includes(init.id)
      )

      setInitiatives(availableInitiatives)
    } catch (error) {
      console.error('Error loading initiatives:', error)
      toast.error('Failed to load initiatives')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadInitiatives()
    } else {
      // Reset when closing
      setSelectedInitiativeId('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, existingInitiativeIds])

  const handleSubmit = async () => {
    if (!selectedInitiativeId) {
      toast.error('Please select an initiative')
      return
    }

    setIsSubmitting(true)
    try {
      await addInitiativeOwner(selectedInitiativeId, personId, 'owner')
      toast.success('Initiative associated successfully')
      onClose()
      router.refresh()
    } catch (error) {
      console.error('Error associating initiative:', error)
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to associate initiative'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Rocket className='w-5 h-5' />
            Associate Existing Initiative
          </DialogTitle>
          <DialogDescription>
            Select an initiative to associate with this person as an owner.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-4'>
          {isLoading ? (
            <div className='flex items-center justify-center py-8'>
              <Loader2 className='w-6 h-6 animate-spin text-muted-foreground' />
            </div>
          ) : initiatives.length === 0 ? (
            <div className='text-center py-8 text-sm text-muted-foreground'>
              No available initiatives to associate. All initiatives are already
              associated with this person, or there are no initiatives in the
              organization.
            </div>
          ) : (
            <div className='space-y-2'>
              <label className='text-sm font-medium'>Select Initiative</label>
              <Select
                value={selectedInitiativeId}
                onValueChange={setSelectedInitiativeId}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Choose an initiative...' />
                </SelectTrigger>
                <SelectContent>
                  {initiatives.map(initiative => (
                    <SelectItem key={initiative.id} value={initiative.id}>
                      {initiative.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className='flex justify-end gap-2'>
          <Button variant='outline' onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedInitiativeId || isSubmitting || isLoading}
          >
            {isSubmitting ? (
              <>
                <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                Associating...
              </>
            ) : (
              'Associate Initiative'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
