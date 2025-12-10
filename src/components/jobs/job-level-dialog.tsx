'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  type JobLevelFormData,
  createJobLevel,
  updateJobLevel,
} from '@/lib/actions/job-roles'

interface JobLevelDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  levelId?: string | null
  initialData?: JobLevelFormData
  onSuccess: () => void
}

export function JobLevelDialog({
  open,
  onOpenChange,
  levelId,
  initialData,
  onSuccess,
}: JobLevelDialogProps) {
  const [formData, setFormData] = useState<JobLevelFormData>({
    name: '',
    order: 0,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Update form data when dialog opens with initial data
  useEffect(() => {
    if (open && initialData) {
      setFormData(initialData)
    } else if (open && !initialData) {
      setFormData({
        name: '',
        order: 0,
      })
    }
  }, [open, initialData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (levelId) {
        await updateJobLevel(levelId, formData)
      } else {
        await createJobLevel(formData)
      }
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error('Error submitting job level:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  const isFormValid = formData.name.trim().length > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {levelId ? 'Edit Job Level' : 'Create Job Level'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div>
            <Label htmlFor='name'>Level Name *</Label>
            <Input
              id='name'
              type='text'
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder='e.g., Senior, Staff, Principal'
              required
            />
          </div>

          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={isSubmitting || !isFormValid}>
              {isSubmitting
                ? levelId
                  ? 'Updating...'
                  : 'Creating...'
                : levelId
                  ? 'Update'
                  : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
