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
import { Plus, Calendar } from 'lucide-react'
import { createMeeting } from '@/lib/actions/meeting'
import { toast } from 'sonner'
import { DateTimePickerWithNaturalInput } from '@/components/ui/datetime-picker-with-natural-input'
import { PersonSelect } from '@/components/ui/person-select'
import { TeamSelect } from '@/components/ui/team-select'

interface Team {
  id: string
  name: string
}

interface CreateMeetingModalProps {
  initiativeId: string
  currentTeam?: Team | null
}

export function CreateMeetingModal({
  initiativeId,
  currentTeam,
}: CreateMeetingModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    scheduledAt: '',
    duration: 60,
    location: '',
    teamId: currentTeam?.id || 'none',
    ownerId: 'none',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const processedFormData = {
        ...formData,
        teamId: formData.teamId === 'none' ? undefined : formData.teamId,
        ownerId: formData.ownerId === 'none' ? undefined : formData.ownerId,
        initiativeId: initiativeId,
        isRecurring: false,
        isPrivate: true,
        participants: [],
      }

      await createMeeting(processedFormData)

      toast.success('Meeting created successfully')
      setIsOpen(false)
      setFormData({
        title: '',
        description: '',
        scheduledAt: '',
        duration: 60,
        location: '',
        teamId: currentTeam?.id || 'none',
        ownerId: 'none',
      })
    } catch (error) {
      console.error('Failed to create meeting:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to create meeting'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Reset form when closing
      setFormData({
        title: '',
        description: '',
        scheduledAt: '',
        duration: 60,
        location: '',
        teamId: currentTeam?.id || 'none',
        ownerId: 'none',
      })
    }
    setIsOpen(open)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant='outline' className='flex items-center gap-2'>
          <Plus className='h-4 w-4' />
          Add Meeting
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Calendar className='h-5 w-5' />
            Create New Meeting
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='title'>Meeting Title</Label>
            <Input
              id='title'
              value={formData.title}
              onChange={e => handleInputChange('title', e.target.value)}
              placeholder='Enter meeting title'
              required
              disabled={isLoading}
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='description'>Description</Label>
            <Textarea
              id='description'
              value={formData.description}
              onChange={e => handleInputChange('description', e.target.value)}
              placeholder='Enter meeting description'
              rows={3}
              disabled={isLoading}
            />
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <DateTimePickerWithNaturalInput
                value={formData.scheduledAt}
                onChange={value => handleInputChange('scheduledAt', value)}
                label='Date & Time'
                required
                disabled={isLoading}
                placeholder='Pick a date and time'
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='duration'>Duration (minutes)</Label>
              <Input
                id='duration'
                type='number'
                min='15'
                max='480'
                value={formData.duration}
                onChange={e =>
                  handleInputChange('duration', parseInt(e.target.value))
                }
                disabled={isLoading}
              />
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='location'>Location</Label>
            <Input
              id='location'
              value={formData.location}
              onChange={e => handleInputChange('location', e.target.value)}
              placeholder='Meeting room, Zoom link, etc.'
              disabled={isLoading}
            />
          </div>

          <div className='space-y-2'>
            <Label>Team</Label>
            <TeamSelect
              value={formData.teamId === 'none' ? undefined : formData.teamId}
              onValueChange={value =>
                handleInputChange('teamId', value || 'none')
              }
              disabled={isLoading}
              placeholder='Select a team'
              includeNone={true}
              noneLabel='No team'
            />
          </div>

          <div className='space-y-2'>
            <Label>Meeting Owner</Label>
            <PersonSelect
              value={formData.ownerId === 'none' ? undefined : formData.ownerId}
              onValueChange={value =>
                handleInputChange('ownerId', value || 'none')
              }
              disabled={isLoading}
              placeholder='Select an owner'
              includeNone={true}
              noneLabel='No owner'
              showAvatar={true}
              showRole={true}
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
              disabled={
                isLoading || !formData.title.trim() || !formData.scheduledAt
              }
            >
              {isLoading ? 'Creating...' : 'Create Meeting'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
