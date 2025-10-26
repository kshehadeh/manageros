'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  Edit,
  Eye,
  Trash2,
  Copy,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  updateCampaignStatus,
  deleteFeedbackCampaign,
} from '@/lib/actions/feedback-campaign'
import { ActionDropdown } from '@/components/common/action-dropdown'
import { ConfirmAction } from '@/components/common/confirm-action'
import { toast } from 'sonner'

interface FeedbackCampaignActionsDropdownProps {
  campaignId: string
  campaign: {
    id: string
    status: string
    inviteLink?: string | null
  }
  personId: string
  onCampaignUpdate?: () => void
}

export function FeedbackCampaignActionsDropdown({
  campaignId,
  campaign,
  personId,
  onCampaignUpdate,
}: FeedbackCampaignActionsDropdownProps) {
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const [copiedLink, setCopiedLink] = useState(false)

  const handleStatusUpdate = async (
    newStatus: 'active' | 'completed' | 'cancelled',
    close: () => void
  ) => {
    setUpdatingStatus(newStatus)
    try {
      await updateCampaignStatus(campaignId, newStatus)
      onCampaignUpdate?.()
    } catch (error) {
      console.error('Failed to update campaign status:', error)
    } finally {
      setUpdatingStatus(null)
      close()
    }
  }

  const handleDeleteCampaign = async () => {
    try {
      await deleteFeedbackCampaign(campaignId)
      toast.success('Feedback campaign deleted successfully')
      onCampaignUpdate?.()
    } catch (error) {
      console.error('Failed to delete campaign:', error)
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to delete feedback campaign'
      )
    }
  }

  const copyInviteLink = async () => {
    if (!campaign.inviteLink) return

    try {
      const baseUrl = window.location.origin
      const fullUrl = `${baseUrl}/feedback-form/${campaign.inviteLink}`
      await navigator.clipboard.writeText(fullUrl)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    } catch (error) {
      console.error('Failed to copy link:', error)
    }
  }

  return (
    <ActionDropdown
      onOpenChange={open => {
        if (!open) {
          setCopiedLink(false)
        }
      }}
    >
      {({ close }) => (
        <div className='py-1'>
          <Link
            href={`/feedback-campaigns/${campaignId}`}
            className='flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors'
            onClick={close}
          >
            <Eye className='w-4 h-4' />
            View Campaign
          </Link>

          <Link
            href={`/people/${personId}/feedback-campaigns/${campaignId}/edit`}
            className='flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors'
            onClick={close}
          >
            <Edit className='w-4 h-4' />
            Edit Campaign
          </Link>

          <Link
            href={`/people/${personId}/feedback-campaigns/${campaignId}`}
            className='flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors'
            onClick={close}
          >
            <AlertCircle className='w-4 h-4' />
            View Responses
          </Link>

          <button
            className='flex w-full items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors text-left'
            onClick={copyInviteLink}
          >
            <Copy className='w-4 h-4' />
            {copiedLink ? 'Copied!' : 'Copy Invite Link'}
          </button>

          <div className='border-t border-border my-1' />

          <button
            className='flex w-full items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors text-left'
            onClick={() => handleStatusUpdate('active', close)}
            disabled={updatingStatus === 'active'}
          >
            <CheckCircle className='w-4 h-4' />
            {updatingStatus === 'active' ? 'Activating…' : 'Mark as Active'}
          </button>

          <button
            className='flex w-full items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors text-left'
            onClick={() => handleStatusUpdate('completed', close)}
            disabled={updatingStatus === 'completed'}
          >
            <CheckCircle className='w-4 h-4' />
            {updatingStatus === 'completed'
              ? 'Completing…'
              : 'Mark as Completed'}
          </button>

          <button
            className='flex w-full items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors text-left'
            onClick={() => handleStatusUpdate('cancelled', close)}
            disabled={updatingStatus === 'cancelled'}
          >
            <XCircle className='w-4 h-4' />
            {updatingStatus === 'cancelled'
              ? 'Cancelling…'
              : 'Mark as Cancelled'}
          </button>

          <div className='border-t border-border my-1' />

          <ConfirmAction
            onConfirm={handleDeleteCampaign}
            renderTrigger={({ open }) => (
              <Button
                onClick={open}
                variant='destructive'
                size='sm'
                className='mx-3 my-2 flex w-[calc(100%-1.5rem)] items-center justify-center gap-2'
              >
                <Trash2 className='w-4 h-4' />
                Delete Campaign
              </Button>
            )}
            confirmMessage='Are you sure you want to delete this campaign?'
            confirmDescription='This action cannot be undone.'
          />
        </div>
      )}
    </ActionDropdown>
  )
}
