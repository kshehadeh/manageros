'use client'

import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import {
  MoreHorizontal,
  Edit,
  Eye,
  Trash2,
  Copy,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { updateCampaignStatus, deleteFeedbackCampaign } from '@/lib/actions'

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
  const [openDropdown, setOpenDropdown] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const [deletingCampaign, setDeletingCampaign] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
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
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openDropdown])

  const handleStatusUpdate = async (
    newStatus: 'active' | 'completed' | 'cancelled'
  ) => {
    setUpdatingStatus(newStatus)
    try {
      await updateCampaignStatus(campaignId, newStatus)
      if (onCampaignUpdate) {
        onCampaignUpdate()
      }
    } catch (error) {
      console.error('Failed to update campaign status:', error)
    } finally {
      setUpdatingStatus(null)
      closeDropdown()
    }
  }

  const handleDeleteCampaign = async () => {
    if (
      !confirm(
        'Are you sure you want to delete this campaign? This action cannot be undone.'
      )
    ) {
      return
    }

    setDeletingCampaign(true)
    try {
      await deleteFeedbackCampaign(campaignId)
      if (onCampaignUpdate) {
        onCampaignUpdate()
      }
    } catch (error) {
      console.error('Failed to delete campaign:', error)
    } finally {
      setDeletingCampaign(false)
      closeDropdown()
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
    <div className='relative' ref={dropdownRef}>
      <Button
        variant='outline'
        size='sm'
        onClick={handleDropdownClick}
        className='h-8 w-8 p-0'
      >
        <MoreHorizontal className='h-4 w-4' />
      </Button>

      {openDropdown && (
        <div className='absolute right-0 top-9 z-50 min-w-[200px] rounded-md border bg-background shadow-lg'>
          <div className='py-1'>
            {/* Edit Campaign - Only show for draft campaigns */}
            {campaign.status === 'draft' && (
              <Link
                href={`/people/${personId}/feedback-campaigns/${campaignId}/edit`}
                className='flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors'
                onClick={closeDropdown}
              >
                <Edit className='w-4 h-4' />
                Edit Campaign
              </Link>
            )}

            {/* View Responses */}
            <Link
              href={`/people/${personId}/feedback-campaigns/${campaignId}/responses`}
              className='flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors'
              onClick={closeDropdown}
            >
              <Eye className='w-4 h-4' />
              View Responses
            </Link>

            {/* Copy Invite Link - Only show for active campaigns with invite link */}
            {campaign.status === 'active' && campaign.inviteLink && (
              <button
                onClick={copyInviteLink}
                className='flex w-full items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors'
              >
                {copiedLink ? (
                  <CheckCircle className='w-4 h-4 text-green-500' />
                ) : (
                  <Copy className='w-4 h-4' />
                )}
                {copiedLink ? 'Link Copied!' : 'Copy Invite Link'}
              </button>
            )}

            {/* Status Actions - Only show for draft and active campaigns */}
            {campaign.status === 'draft' && (
              <button
                onClick={() => handleStatusUpdate('active')}
                disabled={updatingStatus === 'active'}
                className='flex w-full items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50'
              >
                <AlertCircle className='w-4 h-4' />
                {updatingStatus === 'active'
                  ? 'Activating...'
                  : 'Activate Campaign'}
              </button>
            )}

            {campaign.status === 'active' && (
              <>
                <button
                  onClick={() => handleStatusUpdate('completed')}
                  disabled={updatingStatus === 'completed'}
                  className='flex w-full items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50'
                >
                  <CheckCircle className='w-4 h-4' />
                  {updatingStatus === 'completed'
                    ? 'Completing...'
                    : 'Mark as Completed'}
                </button>
                <button
                  onClick={() => handleStatusUpdate('cancelled')}
                  disabled={updatingStatus === 'cancelled'}
                  className='flex w-full items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50'
                >
                  <XCircle className='w-4 h-4' />
                  {updatingStatus === 'cancelled'
                    ? 'Cancelling...'
                    : 'Cancel Campaign'}
                </button>
              </>
            )}

            {/* Delete Campaign - Only show for draft campaigns */}
            {campaign.status === 'draft' && (
              <>
                <div className='border-t my-1' />
                <button
                  onClick={handleDeleteCampaign}
                  disabled={deletingCampaign}
                  className='flex w-full items-center gap-3 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50'
                >
                  <Trash2 className='w-4 h-4' />
                  {deletingCampaign ? 'Deleting...' : 'Delete Campaign'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
