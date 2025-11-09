'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { createOrganization } from '@/lib/actions/organization'
import { useRouter } from 'next/navigation'
import { AlertCircle } from 'lucide-react'

interface OrganizationCreationDialogProps {
  open: boolean
  onOpenChange: (_open: boolean) => void
}

export function OrganizationCreationDialog({
  open,
  onOpenChange,
}: OrganizationCreationDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      await createOrganization(formData)

      // Close dialog and redirect to dashboard
      // Clerk will automatically update the user data
      onOpenChange(false)
      router.push('/dashboard')
      router.refresh() // Refresh to get updated user data
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'An error occurred. Please try again.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset form when closing
      setFormData({ name: '', slug: '' })
      setError('')
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Organization</DialogTitle>
          <DialogDescription>
            Create a new organization to get started with mpath. You&apos;ll
            become the admin of this organization.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4'>
          {error && (
            <div className='flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 text-sm'>
              <AlertCircle className='h-4 w-4 flex-shrink-0' />
              <span>{error}</span>
            </div>
          )}

          <div className='space-y-2'>
            <Label htmlFor='name'>Organization Name</Label>
            <Input
              id='name'
              name='name'
              type='text'
              required
              placeholder='Acme Corp'
              value={formData.name}
              onChange={handleInputChange}
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='slug'>Organization Slug</Label>
            <Input
              id='slug'
              name='slug'
              type='text'
              required
              placeholder='acme-corp'
              value={formData.slug}
              onChange={handleInputChange}
            />
            <p className='text-xs text-muted-foreground'>
              Used in URLs. Only lowercase letters, numbers, and hyphens
              allowed.
            </p>
          </div>

          <div className='flex justify-end gap-2'>
            <Button
              type='button'
              variant='outline'
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Organization'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
