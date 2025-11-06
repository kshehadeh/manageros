'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { PersonSelect } from '@/components/ui/person-select'
import { updatePersonPartial } from '@/lib/actions/person'
import { toast } from 'sonner'
import { Label } from '@/components/ui/label'

interface JobRoleAssignModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  jobRoleId: string
  onSuccess: () => void
  excludePersonIds?: string[]
}

export function JobRoleAssignModal({
  open,
  onOpenChange,
  jobRoleId,
  onSuccess,
  excludePersonIds = [],
}: JobRoleAssignModalProps) {
  const [selectedPersonId, setSelectedPersonId] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset selected person when modal opens
  useEffect(() => {
    if (open) {
      setSelectedPersonId('')
    }
  }, [open])

  const handleSubmit = async () => {
    if (!selectedPersonId) {
      toast.error('Please select a person')
      return
    }

    setIsSubmitting(true)

    try {
      await updatePersonPartial(selectedPersonId, {
        jobRoleId,
      })
      toast.success('Person assigned to job role successfully')
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error('Error assigning person to job role:', error)
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to assign person to job role'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedPersonId('')
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Person to Job Role</DialogTitle>
        </DialogHeader>

        <div className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='person-select'>
              Select a person to assign to this job role
            </Label>
            <PersonSelect
              value={selectedPersonId}
              onValueChange={setSelectedPersonId}
              placeholder='Select a person...'
              disabled={isSubmitting}
              excludePersonIds={excludePersonIds}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type='button'
            variant='outline'
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type='button'
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedPersonId}
          >
            {isSubmitting ? 'Assigning...' : 'Assign'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
