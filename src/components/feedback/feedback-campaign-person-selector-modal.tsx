'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { MessageSquare } from 'lucide-react'
import { PersonSelect } from '@/components/ui/person-select'

interface FeedbackCampaignPersonSelectorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FeedbackCampaignPersonSelectorModal({
  open,
  onOpenChange,
}: FeedbackCampaignPersonSelectorModalProps) {
  const [selectedPersonId, setSelectedPersonId] = useState('')
  const router = useRouter()

  const handleCreateCampaign = () => {
    if (!selectedPersonId) return

    router.push(`/people/${selectedPersonId}/feedback-campaigns/new`)
    onOpenChange(false)
    setSelectedPersonId('')
  }

  const handleCancel = () => {
    onOpenChange(false)
    setSelectedPersonId('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <MessageSquare className='h-5 w-5' />
            Create Feedback 360 Campaign
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-4'>
          <div className='space-y-2'>
            <label htmlFor='person-select' className='text-sm font-medium'>
              Select a person for the Feedback 360 campaign:
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
            <Button onClick={handleCreateCampaign} disabled={!selectedPersonId}>
              <MessageSquare className='h-4 w-4 mr-2' />
              Create Campaign
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
