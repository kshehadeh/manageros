'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateOrganizationProfile } from '@/lib/actions/organization'
import { toast } from 'sonner'
import { Building2 } from 'lucide-react'

interface EditOrganizationProfileModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentName: string
}

export function EditOrganizationProfileModal({
  open,
  onOpenChange,
  currentName,
}: EditOrganizationProfileModalProps) {
  const [name, setName] = useState(currentName)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  // Update name when dialog opens or currentName changes
  useEffect(() => {
    if (open) {
      setName(currentName)
    }
  }, [open, currentName])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await updateOrganizationProfile({ name: name.trim() })
      toast.success('Organization profile updated successfully')
      router.refresh()
      onOpenChange(false)
    } catch (error) {
      console.error('Error updating organization profile:', error)
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to update organization profile'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setName(currentName)
    onOpenChange(false)
  }

  const isFormValid = name.trim().length > 0 && name.trim() !== currentName

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size='sm'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Building2 className='h-5 w-5' />
            Edit Organization
          </DialogTitle>
          <DialogDescription>
            Update your organization's name. Other settings cannot be changed
            through this form.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='name'>
              Organization Name <span className='text-destructive'>*</span>
            </Label>
            <Input
              id='name'
              type='text'
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder='Enter organization name'
              required
              disabled={isSubmitting}
              maxLength={100}
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
              {isSubmitting ? 'Updating...' : 'Update'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
