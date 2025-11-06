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
import { MarkdownEditor } from '@/components/markdown-editor'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import {
  type JobRoleFormData,
  createJobRole,
  updateJobRole,
} from '@/lib/actions/job-roles'

interface JobLevel {
  id: string
  name: string
}

interface JobDomain {
  id: string
  name: string
}

interface JobRoleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  jobRoleId?: string | null
  initialData?: JobRoleFormData
  levels: JobLevel[]
  domains: JobDomain[]
  onSuccess: () => void
}

export function JobRoleDialog({
  open,
  onOpenChange,
  jobRoleId,
  initialData,
  levels,
  domains,
  onSuccess,
}: JobRoleDialogProps) {
  const [formData, setFormData] = useState<JobRoleFormData>({
    title: '',
    description: '',
    levelId: '',
    domainId: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Update form data when dialog opens with initial data
  useEffect(() => {
    if (open && initialData) {
      setFormData(initialData)
    } else if (open && !initialData) {
      setFormData({
        title: '',
        description: '',
        levelId: '',
        domainId: '',
      })
    }
  }, [open, initialData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (jobRoleId) {
        await updateJobRole(jobRoleId, formData)
      } else {
        await createJobRole(formData)
      }
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error('Error submitting job role:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  const isFormValid =
    formData.title.trim() && formData.levelId && formData.domainId

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>
            {jobRoleId ? 'Edit Job Role' : 'Create Job Role'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <Label htmlFor='title'>Job Title *</Label>
              <Input
                id='title'
                type='text'
                value={formData.title}
                onChange={e =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder='e.g., Senior Software Engineer'
                required
              />
            </div>
            <div>
              <Label htmlFor='level'>Level *</Label>
              <Select
                value={formData.levelId}
                onValueChange={value =>
                  setFormData({ ...formData, levelId: value })
                }
                required
              >
                <SelectTrigger id='level'>
                  <SelectValue placeholder='Select a level' />
                </SelectTrigger>
                <SelectContent>
                  {levels.map(level => (
                    <SelectItem key={level.id} value={level.id}>
                      {level.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor='domain'>Domain *</Label>
            <Select
              value={formData.domainId}
              onValueChange={value =>
                setFormData({ ...formData, domainId: value })
              }
              required
            >
              <SelectTrigger id='domain'>
                <SelectValue placeholder='Select a domain' />
              </SelectTrigger>
              <SelectContent>
                {domains.map(domain => (
                  <SelectItem key={domain.id} value={domain.id}>
                    {domain.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor='description'>Description (Markdown)</Label>
            <MarkdownEditor
              value={formData.description || ''}
              onChange={value =>
                setFormData({ ...formData, description: value })
              }
              placeholder='### Responsibilities...'
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
                ? jobRoleId
                  ? 'Updating...'
                  : 'Creating...'
                : jobRoleId
                  ? 'Update'
                  : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
