'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { updateCampaignStatus, deleteFeedbackCampaign } from '@/lib/actions'
import {
  Calendar,
  Users,
  Mail,
  Trash2,
  Play,
  Pause,
  CheckCircle,
} from 'lucide-react'
import { format } from 'date-fns'

interface FeedbackCampaign {
  id: string
  targetPersonId: string
  startDate: Date
  endDate: Date
  inviteEmails: string[]
  status: 'draft' | 'active' | 'completed' | 'cancelled'
  createdAt: Date
  updatedAt: Date
  template?: {
    id: string
    name: string
    description?: string
  }
  responses: {
    id: string
    responderEmail: string
    submittedAt: Date
  }[]
  user: {
    id: string
    name: string
    email: string
  }
}

interface FeedbackCampaignListProps {
  campaigns: FeedbackCampaign[]
  onCampaignUpdate?: () => void
}

export function FeedbackCampaignList({
  campaigns,
  onCampaignUpdate,
}: FeedbackCampaignListProps) {
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const [deletingCampaign, setDeletingCampaign] = useState<string | null>(null)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <Calendar className='h-4 w-4' />
      case 'active':
        return <Play className='h-4 w-4' />
      case 'completed':
        return <CheckCircle className='h-4 w-4' />
      case 'cancelled':
        return <Pause className='h-4 w-4' />
      default:
        return <Calendar className='h-4 w-4' />
    }
  }

  const handleStatusUpdate = async (
    campaignId: string,
    newStatus: 'active' | 'completed' | 'cancelled'
  ) => {
    setUpdatingStatus(campaignId)
    try {
      await updateCampaignStatus(campaignId, newStatus)
      if (onCampaignUpdate) {
        onCampaignUpdate()
      }
    } catch (error) {
      console.error('Failed to update campaign status:', error)
    } finally {
      setUpdatingStatus(null)
    }
  }

  const handleDeleteCampaign = async (campaignId: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this campaign? This action cannot be undone.'
      )
    ) {
      return
    }

    setDeletingCampaign(campaignId)
    try {
      await deleteFeedbackCampaign(campaignId)
      if (onCampaignUpdate) {
        onCampaignUpdate()
      }
    } catch (error) {
      console.error('Failed to delete campaign:', error)
    } finally {
      setDeletingCampaign(null)
    }
  }

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
      <Card>
        <CardContent className='p-6 text-center'>
          <Calendar className='h-12 w-12 mx-auto text-gray-400 mb-4' />
          <h3 className='text-lg font-medium text-gray-900 mb-2'>
            No Feedback Campaigns
          </h3>
          <p className='text-gray-500'>
            No feedback campaigns have been created for this person yet.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className='space-y-4'>
      {campaigns.map(campaign => (
        <Card key={campaign.id}>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-3'>
                <Badge className={getStatusColor(campaign.status)}>
                  {getStatusIcon(campaign.status)}
                  <span className='ml-1 capitalize'>{campaign.status}</span>
                </Badge>
                {isCampaignActive(campaign) && (
                  <Badge
                    variant='outline'
                    className='text-green-600 border-green-600'
                  >
                    Currently Active
                  </Badge>
                )}
              </div>
              <div className='flex items-center gap-2'>
                {campaign.status === 'draft' && (
                  <Button
                    size='sm'
                    onClick={() => handleStatusUpdate(campaign.id, 'active')}
                    disabled={updatingStatus === campaign.id}
                  >
                    {updatingStatus === campaign.id
                      ? 'Activating...'
                      : 'Activate'}
                  </Button>
                )}
                {campaign.status === 'active' && (
                  <>
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() =>
                        handleStatusUpdate(campaign.id, 'completed')
                      }
                      disabled={updatingStatus === campaign.id}
                    >
                      {updatingStatus === campaign.id
                        ? 'Completing...'
                        : 'Complete'}
                    </Button>
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() =>
                        handleStatusUpdate(campaign.id, 'cancelled')
                      }
                      disabled={updatingStatus === campaign.id}
                    >
                      {updatingStatus === campaign.id
                        ? 'Cancelling...'
                        : 'Cancel'}
                    </Button>
                  </>
                )}
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => handleDeleteCampaign(campaign.id)}
                  disabled={deletingCampaign === campaign.id}
                  className='text-red-600 hover:text-red-700'
                >
                  {deletingCampaign === campaign.id ? (
                    'Deleting...'
                  ) : (
                    <Trash2 className='h-4 w-4' />
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <div>
                <h4 className='font-medium text-sm text-gray-500 mb-1'>
                  Campaign Period
                </h4>
                <p className='text-sm'>
                  {format(campaign.startDate, 'MMM d, yyyy')} -{' '}
                  {format(campaign.endDate, 'MMM d, yyyy')}
                </p>
              </div>
              <div>
                <h4 className='font-medium text-sm text-gray-500 mb-1'>
                  Invited
                </h4>
                <div className='flex items-center gap-1 text-sm'>
                  <Users className='h-4 w-4' />
                  {campaign.inviteEmails.length} people
                </div>
              </div>
              <div>
                <h4 className='font-medium text-sm text-gray-500 mb-1'>
                  Responses
                </h4>
                <div className='flex items-center gap-1 text-sm'>
                  <Mail className='h-4 w-4' />
                  {campaign.responses.length} / {campaign.inviteEmails.length}
                </div>
              </div>
            </div>

            <div className='mt-4'>
              <h4 className='font-medium text-sm text-gray-500 mb-2'>
                Invited Emails
              </h4>
              <div className='flex flex-wrap gap-2'>
                {campaign.inviteEmails.map((email, index) => {
                  const hasResponded = campaign.responses.some(
                    r => r.responderEmail === email
                  )
                  return (
                    <Badge
                      key={index}
                      variant={hasResponded ? 'default' : 'outline'}
                      className={
                        hasResponded ? 'bg-green-100 text-green-800' : ''
                      }
                    >
                      {email}
                      {hasResponded && <CheckCircle className='h-3 w-3 ml-1' />}
                    </Badge>
                  )
                })}
              </div>
            </div>

            <div className='mt-4 pt-4 border-t'>
              <div className='flex items-center justify-between'>
                <p className='text-xs text-gray-500'>
                  Created by {campaign.user.name} on{' '}
                  {format(campaign.createdAt, 'MMM d, yyyy')}
                </p>
                {campaign.template && (
                  <Badge variant='outline' className='text-xs'>
                    {campaign.template.name}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
