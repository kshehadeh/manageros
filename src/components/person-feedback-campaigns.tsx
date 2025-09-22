'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FeedbackCampaignStatusBadge } from '@/components/feedback-campaign-status-badge'
import { Calendar, Users, Mail, Eye, Edit, MoreHorizontal } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'

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
}

export function PersonFeedbackCampaigns({
  campaigns,
}: PersonFeedbackCampaignsProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  const handleDropdownClick = (e: React.MouseEvent, campaignId: string) => {
    e.stopPropagation()
    setOpenDropdown(openDropdown === campaignId ? null : campaignId)
  }

  const closeDropdown = () => {
    setOpenDropdown(null)
  }

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

  const isCampaignActive = (campaign: FeedbackCampaign) => {
    const now = new Date()
    return (
      campaign.status === 'active' &&
      now >= campaign.startDate &&
      now <= campaign.endDate
    )
  }

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
    <div className='space-y-3'>
      {campaigns.map(campaign => (
        <div key={campaign.id} className='border rounded-xl p-3'>
          <div className='flex items-center justify-between mb-2'>
            <div className='flex items-center gap-2'>
              {campaign.name && (
                <div className='font-medium text-foreground'>
                  {campaign.name}
                </div>
              )}
              <FeedbackCampaignStatusBadge
                status={campaign.status}
                isCurrentlyActive={isCampaignActive(campaign)}
              />
            </div>
            <div className='relative'>
              <Button
                variant='ghost'
                size='sm'
                className='h-8 w-8 p-0'
                onClick={e => handleDropdownClick(e, campaign.id)}
              >
                <MoreHorizontal className='h-4 w-4' />
              </Button>

              {openDropdown === campaign.id && (
                <div
                  className='absolute top-full right-0 mt-2 bg-popover text-popover-foreground border rounded-md shadow-lg z-10 min-w-48'
                  onClick={e => e.stopPropagation()}
                >
                  <div className='py-1'>
                    {campaign.status === 'draft' && (
                      <Link
                        href={`/people/${campaign.targetPersonId}/feedback-campaigns/${campaign.id}/edit`}
                        className='flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors'
                        onClick={closeDropdown}
                      >
                        <Edit className='w-4 h-4' />
                        Edit
                      </Link>
                    )}
                    {(campaign.status === 'active' ||
                      campaign.status === 'completed') && (
                      <Link
                        href={`/people/${campaign.targetPersonId}/feedback-campaigns/${campaign.id}/responses`}
                        className='flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors'
                        onClick={closeDropdown}
                      >
                        <Eye className='w-4 h-4' />
                        View Responses
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className='grid grid-cols-3 gap-4 text-sm'>
            <div>
              <span className='text-muted-foreground'>Period:</span>
              <div className='text-xs text-foreground'>
                {format(campaign.startDate, 'MMM d')} -{' '}
                {format(campaign.endDate, 'MMM d')}
              </div>
            </div>
            <div>
              <span className='text-muted-foreground'>Invited:</span>
              <div className='flex items-center gap-1 text-xs text-foreground'>
                <Users className='h-3 w-3' />
                {campaign.inviteEmails.length}
              </div>
            </div>
            <div>
              <span className='text-muted-foreground'>Responses:</span>
              <div className='flex items-center gap-1 text-xs text-foreground'>
                <Mail className='h-3 w-3' />
                {campaign.responses.length}/{campaign.inviteEmails.length}
              </div>
            </div>
          </div>

          {campaign.template && (
            <div className='mt-2'>
              <Badge variant='outline' className='text-xs'>
                {campaign.template.name}
              </Badge>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
