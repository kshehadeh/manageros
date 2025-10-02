'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Bell, Plus } from 'lucide-react'
import { createNotification } from '@/lib/actions/notification'
import { toast } from 'sonner'

interface CreateNotificationModalProps {
  organizationMembers: Array<{
    id: string
    name: string
    email: string
  }>
}

export function CreateNotificationModal({
  organizationMembers,
}: CreateNotificationModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info' as 'info' | 'warning' | 'success' | 'error',
    targetUser: 'all',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await createNotification({
        title: formData.title,
        message: formData.message,
        type: formData.type,
        userId: formData.targetUser === 'all' ? undefined : formData.targetUser,
      })

      toast.success('Notification created successfully')
      setIsOpen(false)
      setFormData({
        title: '',
        message: '',
        type: 'info',
        targetUser: 'all',
      })
    } catch (error) {
      console.error('Failed to create notification:', error)
      toast.error('Failed to create notification')
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
          Add
        </Button>
      </DialogTrigger>

      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Bell className='h-5 w-5' />
            Create New Notification
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='title'>Title</Label>
            <Input
              id='title'
              value={formData.title}
              onChange={e => handleInputChange('title', e.target.value)}
              placeholder='Enter notification title'
              required
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='message'>Message</Label>
            <Textarea
              id='message'
              value={formData.message}
              onChange={e => handleInputChange('message', e.target.value)}
              placeholder='Enter notification message'
              rows={4}
              required
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='type'>Type</Label>
            <Select
              value={formData.type}
              onValueChange={value => handleInputChange('type', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='info'>Info</SelectItem>
                <SelectItem value='success'>Success</SelectItem>
                <SelectItem value='warning'>Warning</SelectItem>
                <SelectItem value='error'>Error</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='target'>Target</Label>
            <Select
              value={formData.targetUser}
              onValueChange={value => handleInputChange('targetUser', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Organization Members</SelectItem>
                {organizationMembers.map(member => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name} ({member.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='flex justify-end gap-2 pt-4'>
            <Button
              type='button'
              variant='outline'
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
