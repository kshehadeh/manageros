'use client'

import { useRouter } from 'next/navigation'
import { SectionHeader } from '@/components/ui/section-header'
import { FeedbackCampaignStatusBadge } from '@/components/feedback/feedback-campaign-status-badge'
import { format } from 'date-fns'
import Link from 'next/link'
import { MessageSquare, Eye, MoreHorizontal, Calendar } from 'lucide-react'
import { useDataTableContextMenu } from '@/components/common/data-table-context-menu'
import { ContextMenuItem } from '@/components/common/context-menu-items'
import { SimpleListContainer } from '@/components/common/simple-list-container'
import { SimpleListItem } from '@/components/common/simple-list-item'
import { SimpleListItemsContainer } from '@/components/common/simple-list-items-container'

export interface FeedbackCampaign {
  id: string
  name?: string | null
  targetPersonId: string
  startDate: Date
  endDate: Date
  inviteEmails: string[]
  status: string
  template?: {
    id: string
    name: string
    description?: string | null
  } | null
  responses: {
    id: string
    responderEmail: string
    submittedAt: Date
  }[]
  targetPerson: {
    id: string
    name: string
    email: string
  }
}

export interface FeedbackCampaignListProps {
  campaigns: FeedbackCampaign[]
  title?: string
  viewAllHref?: string
  viewAllLabel?: string
  emptyStateText?: string
  className?: string
}

export function SimpleFeedbackCampaignList({
  campaigns,
  title = 'Feedback Campaigns',
  viewAllHref,
  viewAllLabel = 'View All',
  emptyStateText = 'No active feedback campaigns.',
  className = '',
}: FeedbackCampaignListProps) {
  const router = useRouter()
  const { handleButtonClick, ContextMenuComponent } = useDataTableContextMenu()

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

  const renderCampaignItem = (campaign: FeedbackCampaign) => (
    <SimpleListItem
      key={campaign.id}
      className='py-3'
      onClick={() => {
        router.push(
          `/people/${campaign.targetPersonId}/feedback-campaigns/${campaign.id}`
        )
      }}
    >
      <div className='flex-1 space-y-1'>
        {/* Campaign Title */}
        <div className='font-medium text-sm text-foreground'>
          {campaign.name || campaign.template?.name || 'Feedback Campaign'}
        </div>

        {/* Person Name */}
        <div className='text-sm text-muted-foreground'>
          <span>{campaign.targetPerson.name}</span>
        </div>

        {/* Campaign Details */}
        <div className='flex items-center gap-4 text-xs text-muted-foreground'>
          <span>
            {campaign.responses.length} / {campaign.inviteEmails.length}{' '}
            responses
          </span>
          <div className='flex items-center gap-1'>
            <Calendar className='h-3 w-3' />
            <span>
              {campaign.status === 'active'
                ? `Ends ${format(campaign.endDate, 'MMM d, yyyy')}`
                : `Started ${format(campaign.startDate, 'MMM d, yyyy')}`}
            </span>
          </div>
        </div>
      </div>

      {/* Status Badge and Actions */}
      <div className='ml-4 shrink-0 flex items-center gap-2'>
        <FeedbackCampaignStatusBadge
          status={campaign.status}
          isCurrentlyActive={isCampaignActive(campaign)}
          isPending={isCampaignPending(campaign)}
        />
        <button
          onClick={e => {
            e.stopPropagation()
            handleButtonClick(e, campaign.id)
          }}
          className='p-1 hover:bg-muted rounded'
        >
          <MoreHorizontal className='h-4 w-4 text-muted-foreground' />
        </button>
      </div>
    </SimpleListItem>
  )

  // Build actions for the section header
  const actions = []
  if (viewAllHref) {
    actions.push(
      <Link
        key='view-all'
        href={viewAllHref}
        className='text-sm text-muted-foreground hover:text-foreground transition-colors'
      >
        {viewAllLabel}
      </Link>
    )
  }

  return (
    <>
      <SimpleListContainer className={className}>
        <SectionHeader
          icon={MessageSquare}
          title={title}
          action={actions.length > 0 ? actions : undefined}
        />

        <SimpleListItemsContainer
          isEmpty={campaigns.length === 0}
          emptyStateText={emptyStateText}
        >
          {campaigns.map(renderCampaignItem)}
        </SimpleListItemsContainer>
      </SimpleListContainer>

      {/* Context Menu */}
      <ContextMenuComponent>
        {({ entityId, close }) => {
          const campaign = campaigns.find(c => c.id === entityId)
          if (!campaign) return null

          return (
            <>
              <ContextMenuItem
                onClick={() => {
                  window.location.href = `/people/${campaign.targetPersonId}/feedback-campaigns/${campaign.id}`
                  close()
                }}
              >
                <Eye className='mr-2 h-4 w-4' />
                View Details
              </ContextMenuItem>
            </>
          )
        }}
      </ContextMenuComponent>
    </>
  )
}
