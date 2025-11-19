'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useOrganizationList } from '@clerk/nextjs'
import { Mail, Building2, User, CheckCircle2 } from 'lucide-react'
import { syncOrgDataToClerk } from '@/lib/actions/organization'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import type { PendingInvitation } from '@/types/organization'

interface InvitationListProps {
  invitations: PendingInvitation[]
}

export function InvitationList({ invitations }: InvitationListProps) {
  const router = useRouter()
  const { userInvitations, setActive } = useOrganizationList({
    userInvitations: {
      infinite: true,
    },
  })
  const [acceptingId, setAcceptingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  console.log(userInvitations)
  const handleAcceptInvitation = async (
    invitationId: string,
    clerkOrgId: string
  ) => {
    if (!userInvitations || !setActive) {
      setError('Organization management is not available')
      return
    }

    try {
      setAcceptingId(invitationId)
      setError(null)

      // Find the invitation in Clerk's data
      const invitation = userInvitations.data?.find(
        inv => inv.id === invitationId
      )

      if (!invitation) {
        setError('Invitation not found')
        setAcceptingId(null)
        return
      }

      // Accept the invitation using Clerk's method
      await invitation.accept()

      // Set the newly joined organization as active
      await setActive({
        organization: clerkOrgId,
      })

      // Call server action to sync metadata after acceptance
      if (await syncOrgDataToClerk()) {
        setAcceptingId(null)
        router.push('/dashboard')
        router.refresh()
      } else {
        setError('Failed to accept invitation')
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to accept invitation'
      )
      setAcceptingId(null)
    }
  }

  if (invitations.length === 0) {
    return (
      <div className='text-center py-8 text-muted-foreground'>
        <Mail className='w-12 h-12 mx-auto mb-4 opacity-50' />
        <p>No pending invitations</p>
      </div>
    )
  }

  return (
    <div className='space-y-4'>
      {error && (
        <Alert variant='destructive'>
          <AlertCircle className='h-4 w-4' />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className='space-y-3'>
        {invitations.map(invitation => (
          <Card
            key={invitation.id}
            className='p-4 hover:border-primary/50 transition-colors'
          >
            <div className='space-y-3'>
              <div className='flex items-start justify-between gap-4'>
                <div className='flex-1 space-y-2'>
                  <div className='flex items-center gap-2'>
                    <Building2 className='w-4 h-4 text-muted-foreground' />
                    <h3 className='font-semibold'>
                      {invitation.organization.name}
                    </h3>
                  </div>

                  <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                    <User className='w-3 h-3' />
                    <span>Invited by {invitation.invitedBy.name}</span>
                  </div>
                </div>

                <Button
                  onClick={() =>
                    handleAcceptInvitation(
                      invitation.id,
                      invitation.organization.clerkOrganizationId
                    )
                  }
                  disabled={acceptingId === invitation.id}
                  size='sm'
                >
                  <CheckCircle2 className='w-4 h-4 mr-2' />
                  {acceptingId === invitation.id ? 'Accepting...' : 'Accept'}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
