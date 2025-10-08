'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { MessageCircle } from 'lucide-react'
import { PersonSelect } from '@/components/ui/person-select'

export function PersonSelectorModal() {
  const [open, setOpen] = useState(false)
  const [selectedPersonId, setSelectedPersonId] = useState('')
  const router = useRouter()

  useEffect(() => {
    function onOpen() {
      setOpen(true)
    }
    window.addEventListener('command:openPersonSelectorModal', onOpen)
    return () =>
      window.removeEventListener('command:openPersonSelectorModal', onOpen)
  }, [])

  const handleCreateFeedback = () => {
    if (!selectedPersonId) return

    router.push(`/people/${selectedPersonId}/feedback/new`)
    setOpen(false)
    setSelectedPersonId('')
  }

  const handleCancel = () => {
    setOpen(false)
    setSelectedPersonId('')
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <MessageCircle className='h-5 w-5' />
            Create Feedback
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-4'>
          <div className='space-y-2'>
            <label htmlFor='person-select' className='text-sm font-medium'>
              Select a person to give feedback to:
            </label>
            <PersonSelect
              value={selectedPersonId}
              onValueChange={setSelectedPersonId}
              placeholder='Choose a person...'
              autoFocus={true}
            />
          </div>

          <div className='flex gap-2 justify-end'>
            <Button variant='outline' onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleCreateFeedback} disabled={!selectedPersonId}>
              <MessageCircle className='h-4 w-4 mr-2' />
              Create Feedback
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
