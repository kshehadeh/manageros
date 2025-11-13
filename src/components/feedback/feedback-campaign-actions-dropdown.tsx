'use client'

import { Link } from '@/components/ui/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Edit,
  Eye,
  Trash2,
  Copy,
  CheckCircle,
  XCircle,
  AlertCircle,
  Sparkles,
} from 'lucide-react'
import {
  updateCampaignStatus,
  deleteFeedbackCampaign,
  generateFeedbackCampaignSummary,
} from '@/lib/actions/feedback-campaign'
import { ActionDropdown } from '@/components/common/action-dropdown'
import { DeleteModal } from '@/components/common/delete-modal'
import { toast } from 'sonner'
import { FeedbackCampaignSummaryModal } from './feedback-campaign-summary-modal'

interface FeedbackCampaignActionsDropdownProps {
  campaignId: string
  campaign: {
    id: string
    status: string
    inviteLink?: string | null
  }
  personId: string
  campaignName: string
  targetPersonName: string
  totalResponses: number
  onCampaignUpdate?: () => void
}

export function FeedbackCampaignActionsDropdown({
  campaignId,
  campaign,
  personId,
  campaignName,
  targetPersonName,
  totalResponses,
  onCampaignUpdate,
}: FeedbackCampaignActionsDropdownProps) {
  const router = useRouter()
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const [copiedLink, setCopiedLink] = useState(false)
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false)
  const [summary, setSummary] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

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
    setIsDeleting(true)
    try {
      await deleteFeedbackCampaign(campaignId)
      toast.success('Feedback campaign deleted successfully')
      onCampaignUpdate?.()
      // Navigate to feedback campaigns list if user has access,
      // otherwise the page will redirect to person detail view
      router.push(`/people/${personId}/feedback-campaigns`)
    } catch (error) {
      console.error('Failed to delete campaign:', error)
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to delete feedback campaign'
      )
      // On error, navigate to person detail view as fallback
      router.push(`/people/${personId}`)
    } finally {
      setIsDeleting(false)
      setShowDeleteModal(false)
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

  const handleGenerateSummary = async (close: () => void) => {
    setIsSummaryModalOpen(true)
    setSummary(null)
    setIsGeneratingSummary(true)
    close()

    try {
      const result = await generateFeedbackCampaignSummary(campaignId)

      if (result.success) {
        setSummary(result.summary)
      } else {
        toast.error('Failed to generate summary')
        setIsSummaryModalOpen(false)
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to generate summary'
      )
      setIsSummaryModalOpen(false)
    } finally {
      setIsGeneratingSummary(false)
    }
  }

  return (
    <>
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
              href={`/people/${personId}/feedback-campaigns/${campaignId}/responses`}
              className='flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors'
              onClick={close}
            >
              <AlertCircle className='w-4 h-4' />
              View Responses
            </Link>

            {totalResponses > 0 && (
              <button
                className='flex w-full items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors text-left'
                onClick={() => handleGenerateSummary(close)}
                disabled={isGeneratingSummary}
              >
                <Sparkles className='w-4 h-4' />
                {isGeneratingSummary
                  ? 'Generating Summary...'
                  : 'Generate Summary'}
              </button>
            )}

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

            <button
              className='flex w-full items-center gap-3 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors text-left'
              onClick={() => {
                setShowDeleteModal(true)
                close()
              }}
            >
              <Trash2 className='w-4 h-4' />
              Delete Campaign
            </button>
          </div>
        )}
      </ActionDropdown>

      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteCampaign}
        title='Delete Feedback Campaign'
        entityName='feedback campaign'
        description='Are you sure you want to delete this feedback campaign? This action cannot be undone.'
        isLoading={isDeleting}
      />

      <FeedbackCampaignSummaryModal
        campaignName={campaignName}
        targetPersonName={targetPersonName}
        content={summary}
        isLoading={isGeneratingSummary}
        isOpen={isSummaryModalOpen}
        onClose={() => {
          setIsSummaryModalOpen(false)
          setSummary(null)
        }}
      />
    </>
  )
}
