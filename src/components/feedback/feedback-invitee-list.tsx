'use client'

import { Badge } from '@/components/ui/badge'
import { CheckCircle, Clock, Mail, Send } from 'lucide-react'
import { format } from 'date-fns'

interface FeedbackResponse {
  id: string
  responderEmail: string
  submittedAt: Date
}

interface NotificationRecord {
  recipientEmail: string
  sentAt: Date
  metadata: unknown
}

interface FeedbackInviteeListProps {
  inviteEmails: string[]
  responses: FeedbackResponse[]
  notificationRecords?: NotificationRecord[]
}

export function FeedbackInviteeList({
  inviteEmails,
  responses,
  notificationRecords = [],
}: FeedbackInviteeListProps) {
  // Create a map of responses by email for quick lookup
  const responseMap = new Map(
    responses.map(response => [response.responderEmail, response])
  )

  // Create maps for email notifications
  const inviteSentMap = new Map<string, Date>()
  const lastReminderMap = new Map<string, Date>()

  notificationRecords.forEach(record => {
    const metadata = record.metadata as { emailType?: string } | null
    if (metadata && metadata.emailType === 'invite') {
      const existing = inviteSentMap.get(record.recipientEmail)
      if (!existing || record.sentAt > existing) {
        inviteSentMap.set(record.recipientEmail, record.sentAt)
      }
    } else if (metadata && metadata.emailType === 'reminder') {
      const existing = lastReminderMap.get(record.recipientEmail)
      if (!existing || record.sentAt > existing) {
        lastReminderMap.set(record.recipientEmail, record.sentAt)
      }
    }
  })

  // Create list of invitees with their response status
  const inviteesWithStatus = inviteEmails.map(email => ({
    email,
    hasResponded: responseMap.has(email),
    response: responseMap.get(email),
    inviteSent: inviteSentMap.get(email),
    lastReminder: lastReminderMap.get(email),
  }))

  // Deterministic shuffle based on email for consistent randomization
  // This ensures privacy by randomizing order while maintaining stability
  const hashString = (str: string) => {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32bit integer
    }
    return hash
  }

  // Sort by a hash of the email to randomize order deterministically
  inviteesWithStatus.sort((a, b) => {
    const hashA = hashString(a.email)
    const hashB = hashString(b.email)
    return hashA - hashB
  })

  return (
    <div className='space-y-3'>
      {inviteesWithStatus.map(
        (
          { email, hasResponded, response, inviteSent, lastReminder },
          index
        ) => (
          <div key={email} className='p-3 border rounded-md'>
            <div className='flex items-center gap-3 mb-2'>
              <Mail className='h-4 w-4 text-muted-foreground shrink-0' />
              <span className='text-sm font-medium truncate'>
                Invitee {index + 1}
              </span>
            </div>
            <div className='space-y-2'>
              <div className='flex items-center gap-2'>
                {hasResponded ? (
                  <>
                    <Badge
                      variant='success'
                      className='flex items-center gap-1'
                    >
                      <CheckCircle className='h-3 w-3' />
                      Responded
                    </Badge>
                    <span className='text-xs text-muted-foreground'>
                      {format(response!.submittedAt, 'MMM d, yyyy')}
                    </span>
                  </>
                ) : (
                  <Badge
                    variant='secondary'
                    className='flex items-center gap-1'
                  >
                    <Clock className='h-3 w-3' />
                    Pending
                  </Badge>
                )}
              </div>
              {inviteSent && (
                <div className='flex items-center gap-1 text-xs text-muted-foreground'>
                  <Send className='h-3 w-3' />
                  <span>Invite sent {format(inviteSent, 'MMM d')}</span>
                </div>
              )}
              {lastReminder && (
                <div className='flex items-center gap-1 text-xs text-muted-foreground'>
                  <Send className='h-3 w-3' />
                  <span>Reminder sent {format(lastReminder, 'MMM d')}</span>
                </div>
              )}
            </div>
          </div>
        )
      )}
    </div>
  )
}
