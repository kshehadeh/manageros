'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Target } from 'lucide-react'
import { createObjective } from '@/lib/actions/initiative'
import { toast } from 'sonner'

interface CreateObjectiveModalProps {
  initiativeId: string
}

export function CreateObjectiveModal({
  initiativeId,
}: CreateObjectiveModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    keyResult: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await createObjective(
        initiativeId,
        formData.title,
        formData.keyResult || undefined
      )

      toast.success('Objective created successfully')
      setIsOpen(false)
      setFormData({
        title: '',
        keyResult: '',
      })
    } catch (error) {
      console.error('Failed to create objective:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to create objective'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant='outline' className='flex items-center gap-2'>
          <Plus className='h-4 w-4' />
          Add Objective
        </Button>
      </DialogTrigger>

      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Target className='h-5 w-5' />
            Add New Objective
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='title'>Objective Title</Label>
            <Input
              id='title'
              value={formData.title}
              onChange={e => handleInputChange('title', e.target.value)}
              placeholder='Enter objective title'
              required
              disabled={isLoading}
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='keyResult'>Key Result (Optional)</Label>
            <Textarea
              id='keyResult'
              value={formData.keyResult}
              onChange={e => handleInputChange('keyResult', e.target.value)}
              placeholder='Enter key result description'
              rows={3}
              disabled={isLoading}
            />
          </div>

          <div className='flex justify-end gap-2'>
            <Button
              type='button'
              variant='outline'
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              disabled={isLoading || !formData.title.trim()}
            >
              {isLoading ? 'Creating...' : 'Create Objective'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
