'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { updatePersonPartial } from '@/lib/actions/person'

interface JobRole {
  id: string
  title: string
  level: { id: string; name: string }
  domain: { id: string; name: string }
}

interface JobRoleEditModalProps {
  personId: string
  personName: string
  currentJobRole: JobRole | null
  availableJobRoles: JobRole[]
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function JobRoleEditModal({
  personId,
  personName,
  currentJobRole,
  availableJobRoles,
  isOpen,
  onClose,
  onSuccess,
}: JobRoleEditModalProps) {
  const [selectedJobRoleId, setSelectedJobRoleId] = useState(
    currentJobRole?.id || 'none'
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    setIsSubmitting(true)

    try {
      await updatePersonPartial(personId, {
        jobRoleId: selectedJobRoleId === 'none' ? undefined : selectedJobRoleId,
      })
      onSuccess()
    } catch (error) {
      console.error('Error updating job role:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedJobRoleId(currentJobRole?.id || 'none')
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className='md:max-w-[50vw]'>
        <DialogHeader>
          <DialogTitle>Edit Job Role</DialogTitle>
          <DialogDescription>
            Update the job role for {personName}.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='job-role'>Job Role</Label>
            <Select
              value={selectedJobRoleId}
              onValueChange={setSelectedJobRoleId}
            >
              <SelectTrigger id='job-role'>
                <SelectValue placeholder='Select a job role' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='none'>No job role</SelectItem>
                {availableJobRoles.map(jobRole => (
                  <SelectItem key={jobRole.id} value={jobRole.id}>
                    {jobRole.title} - {jobRole.level.name} (
                    {jobRole.domain.name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
          <Button type='button' onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Updating...' : 'Update Job Role'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
