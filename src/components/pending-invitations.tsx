'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { acceptInvitationForUser } from '@/lib/actions/organization'
import { useSession } from 'next-auth/react'

interface PendingInvitation {
  id: string
  email: string
  organizationId: string
  status: string
  expiresAt: string
  createdAt: string
  updatedAt: string
  organization: {
    id: string
    name: string
    slug: string
    description: string | null
  }
  invitedBy: {
    name: string
    email: string
  }
}

interface PendingInvitationsProps {
  invitations: PendingInvitation[]
}

export default function PendingInvitations({
  invitations,
}: PendingInvitationsProps) {
  const [acceptingInvitation, setAcceptingInvitation] = useState<string | null>(
    null
  )
  const [error, setError] = useState<string | null>(null)
  const { update: updateSession } = useSession()

  const handleAcceptInvitation = async (invitationId: string) => {
    try {
      setAcceptingInvitation(invitationId)
      setError(null)

      await acceptInvitationForUser(invitationId)

      // Update the session to reflect the new organization
      await updateSession()

      // Redirect to home page after successful acceptance
      window.location.href = '/'
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to accept invitation'
      )
    } finally {
      setAcceptingInvitation(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const isExpiringSoon = (expiresAt: string) => {
    const expirationDate = new Date(expiresAt)
    const now = new Date()
    const daysUntilExpiration = Math.ceil(
      (expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    )
    return daysUntilExpiration <= 2
  }

  if (invitations.length === 0) {
    return null
  }

  return (
    <div className='card'>
      <div className='mb-4'>
        <h2 className='text-lg font-semibold mb-2'>Pending Invitations</h2>
        <p className='text-muted-foreground text-sm'>
          You have been invited to join the following organizations:
        </p>
      </div>

      {error && (
        <div className='mb-4 p-3 bg-destructive/20 border border-destructive rounded text-destructive text-sm'>
          {error}
        </div>
      )}

      <div className='space-y-4'>
        {invitations.map(invitation => (
          <div key={invitation.id} className='p-4 border rounded-lg bg-card'>
            <div className='flex items-start justify-between'>
              <div className='flex-1'>
                <div className='flex items-center gap-2 mb-2'>
                  <h3 className='font-medium text-foreground'>
                    {invitation.organization.name}
                  </h3>
                  {isExpiringSoon(invitation.expiresAt) && (
                    <span className='badge rag-amber text-xs'>
                      EXPIRES SOON
                    </span>
                  )}
                </div>

                {invitation.organization.description && (
                  <p className='text-muted-foreground text-sm mb-2'>
                    {invitation.organization.description}
                  </p>
                )}

                <div className='text-xs text-muted-foreground space-y-1'>
                  <div>
                    Invited by{' '}
                    <span className='text-foreground'>
                      {invitation.invitedBy.name}
                    </span>{' '}
                    ({invitation.invitedBy.email})
                  </div>
                  <div>
                    Invited on {formatDate(invitation.createdAt)} • Expires{' '}
                    {formatDate(invitation.expiresAt)}
                  </div>
                </div>
              </div>

              <Button
                onClick={() => handleAcceptInvitation(invitation.id)}
                disabled={acceptingInvitation === invitation.id}
                variant='outline'
                size='sm'
              >
                {acceptingInvitation === invitation.id ? (
                  <>
                    <svg
                      className='animate-spin -ml-1 mr-2 h-4 w-4 text-white'
                      xmlns='http://www.w3.org/2000/svg'
                      fill='none'
                      viewBox='0 0 24 24'
                    >
                      <circle
                        className='opacity-25'
                        cx='12'
                        cy='12'
                        r='10'
                        stroke='currentColor'
                        strokeWidth='4'
                      ></circle>
                      <path
                        className='opacity-75'
                        fill='currentColor'
                        d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                      ></path>
                    </svg>
                    Accepting...
                  </>
                ) : (
                  'Accept Invitation'
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
