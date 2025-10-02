'use client'

import { useState, useEffect } from 'react'
import { FeedbackCampaignCard } from '@/components/feedback/feedback-campaign-card'
import { Calendar } from 'lucide-react'

interface FeedbackCampaign {
  id: string
  name: string | null
  userId: string
  targetPersonId: string
  templateId: string | null
  startDate: Date
  endDate: Date
  inviteEmails: string[]
  inviteLink: string | null
  status: string
  createdAt: Date
  updatedAt: Date
  user: {
    id: string
    name: string
    email: string
  }
  template: {
    id: string
    name: string
  } | null
  responses: {
    id: string
    responderEmail: string
    submittedAt: Date | null
  }[]
}

interface PersonFeedbackCampaignsProps {
  campaigns: FeedbackCampaign[]
  targetPersonId?: string
}

export function PersonFeedbackCampaigns({
  campaigns,
}: PersonFeedbackCampaignsProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenDropdown(null)
    }

    if (openDropdown) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [openDropdown])

  if (campaigns.length === 0) {
    return (
      <div className='text-center py-6'>
        <Calendar className='h-8 w-8 mx-auto text-muted-foreground mb-2' />
        <p className='text-sm text-muted-foreground'>
          No active or draft feedback campaigns
        </p>
      </div>
    )
  }

  return (
    <div className='flex flex-wrap gap-4'>
      {campaigns.slice(0, 1).map(campaign => (
        <FeedbackCampaignCard key={campaign.id} campaign={campaign} />
      ))}
    </div>
  )
}
