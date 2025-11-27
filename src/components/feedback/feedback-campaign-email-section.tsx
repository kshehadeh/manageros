'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  sendFeedbackCampaignInvites,
  sendFeedbackCampaignReminder,
} from '@/lib/actions/feedback-campaign'
import { toast } from 'sonner'
import { Send, RefreshCw, CheckCircle, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'

interface NotificationRecord {
  id: string
  recipientEmail: string
  subject: string
  sentAt: Date
  metadata: unknown
}

interface FeedbackCampaignEmailSectionProps {
  campaignId: string
  inviteEmails: string[]
  responses: Array<{
    responderEmail: string
  }>
  status: string
  notificationRecords: NotificationRecord[]
}

export function FeedbackCampaignEmailSection({
  campaignId,
  inviteEmails,
  responses,
  status,
  notificationRecords,
}: FeedbackCampaignEmailSectionProps) {
  const router = useRouter()
  const [sendingInvites, setSendingInvites] = useState(false)
  const [sendingReminder, setSendingReminder] = useState(false)

  // Group notifications by email type
  const inviteNotifications = notificationRecords.filter(n => {
    const metadata = n.metadata as { emailType?: string } | null
    return metadata && metadata.emailType === 'invite'
  })
  const reminderNotifications = notificationRecords.filter(n => {
    const metadata = n.metadata as { emailType?: string } | null
    return metadata && metadata.emailType === 'reminder'
  })

  // Check if invites have been sent
  const invitesSent = inviteNotifications.length > 0

  // Get emails that have responded
  const respondedEmails = new Set(responses.map(r => r.responderEmail))

  // Get emails that need reminders (invited but haven't responded)
  const emailsNeedingReminders = inviteEmails.filter(
    email => !respondedEmails.has(email)
  )

  // Get the most recent reminder sent date for each email
  const lastReminderByEmail = new Map<string, Date>()
  reminderNotifications.forEach(notification => {
    const existing = lastReminderByEmail.get(notification.recipientEmail)
    if (!existing || notification.sentAt > existing) {
      lastReminderByEmail.set(notification.recipientEmail, notification.sentAt)
    }
  })

  const handleSendInvites = async () => {
    setSendingInvites(true)
    try {
      const result = await sendFeedbackCampaignInvites(campaignId)
      if (result.success) {
        toast.success(
          `Successfully sent ${result.sent} invite${result.sent !== 1 ? 's' : ''}`
        )
        if (result.errors && result.errors.length > 0) {
          toast.warning(
            `Failed to send ${result.failed} invite${result.failed !== 1 ? 's' : ''}`
          )
        }
        // Refresh the page to show updated notification records
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to send invites:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to send invites'
      )
    } finally {
      setSendingInvites(false)
    }
  }

  const handleSendReminder = async () => {
    setSendingReminder(true)
    try {
      const result = await sendFeedbackCampaignReminder(campaignId)
      if (result.success) {
        toast.success(
          `Successfully sent ${result.sent} reminder${result.sent !== 1 ? 's' : ''}`
        )
        if (result.errors && result.errors.length > 0) {
          toast.warning(
            `Failed to send ${result.failed} reminder${result.failed !== 1 ? 's' : ''}`
          )
        }
        // Refresh the page to show updated notification records
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to send reminders:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to send reminders'
      )
    } finally {
      setSendingReminder(false)
    }
  }

  const canSendInvites =
    (status === 'draft' || status === 'active') && !invitesSent
  const canSendReminder =
    status === 'active' && emailsNeedingReminders.length > 0

  return (
    <div className='space-y-4'>
      {/* Send Initial Invites */}
      {canSendInvites && (
        <div className='p-4 border rounded-md bg-muted/50'>
          <div className='flex items-center justify-between mb-2'>
            <div>
              <p className='font-medium'>Send Initial Invites</p>
              <p className='text-sm text-muted-foreground'>
                Send invitation emails to all {inviteEmails.length} invitee
                {inviteEmails.length !== 1 ? 's' : ''}
              </p>
            </div>
            <Button
              onClick={handleSendInvites}
              disabled={sendingInvites}
              size='sm'
            >
              {sendingInvites ? (
                <>
                  <RefreshCw className='h-4 w-4 mr-2 animate-spin' />
                  Sending...
                </>
              ) : (
                <>
                  <Send className='h-4 w-4 mr-2' />
                  Send Invites
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Invites Sent Status */}
      {invitesSent && (
        <div className='p-4 border rounded-md'>
          <div className='flex items-center gap-2 mb-2'>
            <CheckCircle className='h-4 w-4 text-success' />
            <p className='font-medium'>Initial Invites Sent</p>
          </div>
          <p className='text-sm text-muted-foreground'>
            Sent on{' '}
            {format(
              new Date(
                Math.max(...inviteNotifications.map(n => n.sentAt.getTime()))
              ),
              'MMM d, yyyy h:mm a'
            )}
          </p>
          <p className='text-sm text-muted-foreground mt-1'>
            {inviteNotifications.length} invite
            {inviteNotifications.length !== 1 ? 's' : ''} sent
          </p>
        </div>
      )}

      {/* Send Reminder */}
      {canSendReminder && (
        <div className='p-4 border rounded-md bg-muted/50'>
          <div className='flex items-center justify-between mb-2'>
            <div>
              <p className='font-medium'>Send Reminder</p>
              <p className='text-sm text-muted-foreground'>
                Send reminder emails to {emailsNeedingReminders.length} invitee
                {emailsNeedingReminders.length !== 1 ? 's' : ''} who haven't
                responded yet
              </p>
            </div>
            <Button
              onClick={handleSendReminder}
              disabled={sendingReminder}
              size='sm'
              variant='outline'
            >
              {sendingReminder ? (
                <>
                  <RefreshCw className='h-4 w-4 mr-2 animate-spin' />
                  Sending...
                </>
              ) : (
                <>
                  <RefreshCw className='h-4 w-4 mr-2' />
                  Send Reminder
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Reminder History */}
      {reminderNotifications.length > 0 && (
        <div className='p-4 border rounded-md'>
          <div className='flex items-center gap-2 mb-3'>
            <Clock className='h-4 w-4 text-muted-foreground' />
            <p className='font-medium'>Reminder History</p>
          </div>
          <div className='space-y-2'>
            {Array.from(lastReminderByEmail.entries()).map(([email, date]) => (
              <div
                key={email}
                className='flex items-center justify-between text-sm'
              >
                <span className='text-muted-foreground truncate'>{email}</span>
                <Badge variant='secondary' className='ml-2 shrink-0'>
                  {format(date, 'MMM d, yyyy')}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No actions available */}
      {!canSendInvites && !canSendReminder && !invitesSent && (
        <div className='p-4 border rounded-md bg-muted/50'>
          <p className='text-sm text-muted-foreground'>
            Email notifications are only available for draft or active
            campaigns.
          </p>
        </div>
      )}
    </div>
  )
}
