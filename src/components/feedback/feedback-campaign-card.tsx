'use client'

import { Calendar, Users, Eye, Edit, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FeedbackCampaignStatusBadge } from '@/components/feedback/feedback-campaign-status-badge'
import { format } from 'date-fns'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'

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

interface FeedbackCampaignCardProps {
  campaign: FeedbackCampaign
}

export function FeedbackCampaignCard({ campaign }: FeedbackCampaignCardProps) {
  const [openDropdown, setOpenDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const handleDropdownClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setOpenDropdown(!openDropdown)
  }

  const closeDropdown = () => {
    setOpenDropdown(false)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpenDropdown(false)
      }
    }

    if (openDropdown) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [openDropdown])

  const isCampaignActive = () => {
    const now = new Date()
    return (
      campaign.status === 'active' &&
      now >= campaign.startDate &&
      now <= campaign.endDate
    )
  }

  const isCampaignPending = () => {
    const now = new Date()
    return campaign.status === 'active' && now < campaign.startDate
  }

  const formatDate = (date: Date) => {
    return format(date, 'MMM d, yyyy')
  }

  return (
    <Card className='w-full min-w-[280px] max-w-[400px]'>
      <CardContent className='p-3'>
        <div className='space-y-2'>
          {/* Header with name and status */}
          <div className='flex items-start justify-between'>
            <div className='flex-1 min-w-0'>
              {campaign.name && (
                <Link
                  href={`/people/${campaign.targetPersonId}/feedback-campaigns/${campaign.id}`}
                  className='font-medium text-foreground hover:text-primary transition-colors block truncate'
                >
                  {campaign.name}
                </Link>
              )}
            </div>
            <div className='flex items-center gap-1 ml-2'>
              <FeedbackCampaignStatusBadge
                status={campaign.status}
                isCurrentlyActive={isCampaignActive()}
                isPending={isCampaignPending()}
              />
              <div className='relative' ref={dropdownRef}>
                <Button
                  variant='ghost'
                  size='sm'
                  className='h-6 w-6 p-0'
                  onClick={handleDropdownClick}
                >
                  <MoreHorizontal className='h-3 w-3' />
                </Button>

                {openDropdown && (
                  <div
                    className='absolute top-full right-0 mt-1 bg-popover text-popover-foreground border rounded-md shadow-lg z-10 min-w-32'
                    onClick={e => e.stopPropagation()}
                  >
                    <div className='py-1'>
                      <Link
                        href={`/people/${campaign.targetPersonId}/feedback-campaigns/${campaign.id}`}
                        className='flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-accent hover:text-accent-foreground transition-colors'
                        onClick={closeDropdown}
                      >
                        <Eye className='w-3 h-3' />
                        View
                      </Link>
                      <Link
                        href={`/people/${campaign.targetPersonId}/feedback-campaigns/${campaign.id}/edit`}
                        className='flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-accent hover:text-accent-foreground transition-colors'
                        onClick={closeDropdown}
                      >
                        <Edit className='w-3 h-3' />
                        Edit
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Campaign details */}
          <div className='space-y-1 text-xs text-muted-foreground'>
            <div className='flex items-center gap-1'>
              <Users className='w-3 h-3' />
              <span>
                {campaign.responses.length} / {campaign.inviteEmails.length}{' '}
                responses
              </span>
            </div>
            <div className='flex items-center gap-1'>
              <Calendar className='w-3 h-3' />
              <span>
                {campaign.status === 'active'
                  ? `Ends ${formatDate(campaign.endDate)}`
                  : `Started ${formatDate(campaign.startDate)}`}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
