'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FeedbackCampaignStatusBadge } from '@/components/feedback/feedback-campaign-status-badge'
import {
  updateCampaignStatus,
  deleteFeedbackCampaign,
} from '@/lib/actions/feedback-campaign'
import {
  Calendar,
  Users,
  Mail,
  Play,
  Pause,
  CheckCircle,
  Link as LinkIcon,
  Copy,
  Eye,
  Edit,
  MoreHorizontal,
} from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import { useDataTableContextMenu } from '@/components/common/data-table-context-menu'
import {
  ContextMenuItem,
  DeleteMenuItem,
} from '@/components/common/context-menu-items'
import { DeleteModal } from '@/components/common/delete-modal'

interface FeedbackCampaign {
  id: string
  name?: string | null
  targetPersonId: string
  startDate: Date
  endDate: Date
  inviteEmails: string[]
  inviteLink?: string
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
  const router = useRouter()
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const [copiedLink, setCopiedLink] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)

  const { handleButtonClick, ContextMenuComponent } = useDataTableContextMenu()

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

  const handleDeleteCampaign = async () => {
    if (!deleteTargetId) return

    try {
      await deleteFeedbackCampaign(deleteTargetId)
      if (onCampaignUpdate) {
        onCampaignUpdate()
      }
    } catch (error) {
      console.error('Failed to delete campaign:', error)
    }
  }

  const copyInviteLink = async (inviteLink: string, campaignId: string) => {
    try {
      const baseUrl = window.location.origin
      const fullUrl = `${baseUrl}/feedback-form/${inviteLink}`
      await navigator.clipboard.writeText(fullUrl)
      setCopiedLink(campaignId)
      setTimeout(() => setCopiedLink(null), 2000)
    } catch (error) {
      console.error('Failed to copy link:', error)
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

  const isCampaignPending = (campaign: FeedbackCampaign) => {
    const now = new Date()
    return campaign.status === 'active' && now < campaign.startDate
  }

  if (campaigns.length === 0) {
    return (
      <div className='p-6 text-center border rounded-md'>
        <Calendar className='h-12 w-12 mx-auto text-muted-foreground mb-4' />
        <h3 className='text-lg font-medium text-foreground mb-2'>
          No Feedback Campaigns
        </h3>
        <p className='text-muted-foreground'>
          No feedback campaigns have been created for this person yet.
        </p>
      </div>
    )
  }

  return (
    <div className='space-y-4'>
      {campaigns.map(campaign => (
        <Card key={campaign.id}>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-3'>
                {campaign.name && (
                  <Link
                    href={`/people/${campaign.targetPersonId}/feedback-campaigns/${campaign.id}`}
                    className='text-lg font-semibold text-foreground hover:text-blue-600 transition-colors'
                  >
                    {campaign.name}
                  </Link>
                )}
                <FeedbackCampaignStatusBadge
                  status={campaign.status}
                  isCurrentlyActive={isCampaignActive(campaign)}
                  isPending={isCampaignPending(campaign)}
                />
              </div>
              <Button
                variant='ghost'
                size='sm'
                className='h-8 w-8 p-0'
                onClick={e => handleButtonClick(e, campaign.id)}
              >
                <MoreHorizontal className='h-4 w-4' />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <div>
                <h4 className='font-medium text-sm text-muted-foreground mb-1'>
                  Campaign Period
                </h4>
                <p className='text-sm'>
                  {format(campaign.startDate, 'MMM d, yyyy')} -{' '}
                  {format(campaign.endDate, 'MMM d, yyyy')}
                </p>
              </div>
              <div>
                <h4 className='font-medium text-sm text-muted-foreground mb-1'>
                  Invited
                </h4>
                <div className='flex items-center gap-1 text-sm'>
                  <Users className='h-4 w-4' />
                  {campaign.inviteEmails.length} people
                </div>
              </div>
              <div>
                <h4 className='font-medium text-sm text-muted-foreground mb-1'>
                  Responses
                </h4>
                <div className='flex items-center gap-1 text-sm'>
                  <Mail className='h-4 w-4' />
                  {campaign.responses.length} / {campaign.inviteEmails.length}
                </div>
              </div>
            </div>

            <div className='mt-4'>
              <h4 className='font-medium text-sm text-muted-foreground mb-2'>
                Invitees
              </h4>
              <div className='flex flex-wrap gap-2'>
                {campaign.inviteEmails
                  .sort((a, b) => {
                    // Deterministic shuffle based on email for consistent randomization
                    const hashString = (str: string) => {
                      let hash = 0
                      for (let i = 0; i < str.length; i++) {
                        const char = str.charCodeAt(i)
                        hash = (hash << 5) - hash + char
                        hash = hash & hash
                      }
                      return hash
                    }
                    return hashString(a) - hashString(b)
                  })
                  .map((email, index) => {
                    const hasResponded = campaign.responses.some(
                      r => r.responderEmail === email
                    )
                    return (
                      <Badge
                        key={email}
                        variant={hasResponded ? 'success' : 'outline'}
                      >
                        Invitee {index + 1}
                        {hasResponded && (
                          <CheckCircle className='h-3 w-3 ml-1' />
                        )}
                      </Badge>
                    )
                  })}
              </div>
            </div>

            {campaign.inviteLink && (
              <div className='mt-4'>
                <h4 className='font-medium text-sm text-muted-foreground mb-2'>
                  Invite Link
                </h4>
                <div className='flex items-center gap-2 p-3 bg-muted rounded-md'>
                  <LinkIcon className='h-4 w-4 text-muted-foreground' />
                  <span className='text-sm text-foreground flex-1 truncate'>
                    {`/feedback-form/${campaign.inviteLink}`}
                  </span>
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={() =>
                      copyInviteLink(campaign.inviteLink!, campaign.id)
                    }
                    className='shrink-0'
                  >
                    {copiedLink === campaign.id ? (
                      <>
                        <CheckCircle className='h-3 w-3 mr-1' />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className='h-3 w-3 mr-1' />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <p className='text-xs text-muted-foreground mt-1'>
                  Share this link with invitees to allow them to submit feedback
                </p>
              </div>
            )}

            <div className='mt-4 pt-4 border-t'>
              <div className='flex items-center justify-between'>
                <p className='text-xs text-muted-foreground'>
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

      {/* Context Menu */}
      <ContextMenuComponent>
        {({ entityId, close }) => {
          const campaign = campaigns.find(c => c.id === entityId)
          if (!campaign) return null

          return (
            <>
              <ContextMenuItem
                onClick={() => {
                  router.push(
                    `/people/${campaign.targetPersonId}/feedback-campaigns/${campaign.id}`
                  )
                  close()
                }}
                icon={<Eye className='w-4 h-4' />}
              >
                View Details
              </ContextMenuItem>

              {campaign.status === 'draft' && (
                <>
                  <ContextMenuItem
                    onClick={() => {
                      router.push(
                        `/people/${campaign.targetPersonId}/feedback-campaigns/${campaign.id}/edit`
                      )
                      close()
                    }}
                    icon={<Edit className='w-4 h-4' />}
                  >
                    Edit
                  </ContextMenuItem>
                  <ContextMenuItem
                    onClick={() => {
                      handleStatusUpdate(campaign.id, 'active')
                      close()
                    }}
                    icon={<Play className='w-4 h-4' />}
                  >
                    {updatingStatus === campaign.id
                      ? 'Activating...'
                      : 'Activate'}
                  </ContextMenuItem>
                </>
              )}

              {campaign.status === 'active' && (
                <>
                  <ContextMenuItem
                    onClick={() => {
                      handleStatusUpdate(campaign.id, 'completed')
                      close()
                    }}
                    icon={<CheckCircle className='w-4 h-4' />}
                  >
                    {updatingStatus === campaign.id
                      ? 'Completing...'
                      : 'Complete'}
                  </ContextMenuItem>
                  <ContextMenuItem
                    onClick={() => {
                      handleStatusUpdate(campaign.id, 'cancelled')
                      close()
                    }}
                    icon={<Pause className='w-4 h-4' />}
                  >
                    {updatingStatus === campaign.id
                      ? 'Cancelling...'
                      : 'Cancel'}
                  </ContextMenuItem>
                </>
              )}

              {(campaign.status === 'active' ||
                campaign.status === 'completed') && (
                <ContextMenuItem
                  onClick={() => {
                    router.push(
                      `/people/${campaign.targetPersonId}/feedback-campaigns/${campaign.id}/responses`
                    )
                    close()
                  }}
                  icon={<Eye className='w-4 h-4' />}
                >
                  View Responses
                </ContextMenuItem>
              )}

              <DeleteMenuItem
                onDelete={() => {
                  setDeleteTargetId(entityId)
                  setShowDeleteModal(true)
                }}
                close={close}
              />
            </>
          )
        }}
      </ContextMenuComponent>

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setDeleteTargetId(null)
        }}
        onConfirm={handleDeleteCampaign}
        title='Delete Campaign'
        entityName='feedback campaign'
      />
    </div>
  )
}
