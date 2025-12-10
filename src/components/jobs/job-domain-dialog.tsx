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
  type JobDomainFormData,
  createJobDomain,
  updateJobDomain,
} from '@/lib/actions/job-roles'

interface JobDomainDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  domainId?: string | null
  initialData?: JobDomainFormData
  onSuccess: () => void
}

export function JobDomainDialog({
  open,
  onOpenChange,
  domainId,
  initialData,
  onSuccess,
}: JobDomainDialogProps) {
  const [formData, setFormData] = useState<JobDomainFormData>({ name: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Update form data when dialog opens with initial data
  useEffect(() => {
    if (open && initialData) {
      setFormData(initialData)
    } else if (open && !initialData) {
      setFormData({ name: '' })
    }
  }, [open, initialData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (domainId) {
        await updateJobDomain(domainId, formData)
      } else {
        await createJobDomain(formData)
      }
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error('Error submitting job domain:', error)
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
            {domainId ? 'Edit Job Domain' : 'Create Job Domain'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div>
            <Label htmlFor='name'>Domain Name *</Label>
            <Input
              id='name'
              type='text'
              value={formData.name}
              onChange={e => setFormData({ name: e.target.value })}
              placeholder='e.g., Engineering, Product, Design, Marketing'
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
                ? domainId
                  ? 'Updating...'
                  : 'Creating...'
                : domainId
                  ? 'Update'
                  : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
