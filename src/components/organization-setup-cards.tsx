'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { HelpBlock } from '@/components/common/help-block'
import { acceptInvitationForUser } from '@/lib/actions/organization'
import { Building2, Users, Mail, CheckCircle2, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

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

interface OrganizationSetupCardsProps {
  pendingInvitations: PendingInvitation[]
  onInvitationAccepted?: () => void
}

export function OrganizationSetupCards({
  pendingInvitations,
}: OrganizationSetupCardsProps) {
  const [acceptingInvitation, setAcceptingInvitation] = useState<string | null>(
    null
  )
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Handle create organization - redirect to subscription page first
  const handleCreateOrganization = () => {
    router.push('/organization/subscribe')
  }

  const handleAcceptInvitation = async (invitationId: string) => {
    try {
      setAcceptingInvitation(invitationId)
      setError(null)

      await acceptInvitationForUser(invitationId)

      // Redirect to dashboard after successful acceptance
      // Clerk will automatically update the user data
      router.push('/dashboard')
      router.refresh() // Refresh to get updated user data
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

  return (
    <div className='space-y-2xl'>
      <div className='space-y-6'>
        <HelpBlock
          title='Create New Organization'
          description={
            <div className='space-y-2'>
              <p>Start fresh with your own organization.</p>
              <ul className='text-sm space-y-1 list-disc list-inside'>
                <li>You&apos;re starting a new company or team</li>
                <li>You want to be the organization admin</li>
                <li>You need full control over settings and members</li>
                <li>You&apos;re setting up a demo or test environment</li>
              </ul>
            </div>
          }
          icon={Building2}
          variant='info'
          action={{
            label: 'Create Organization',
            onClick: handleCreateOrganization,
            variant: 'default',
            size: 'default',
          }}
        />

        {error && (
          <HelpBlock
            title='Error'
            description={error}
            icon={AlertCircle}
            variant='warning'
          />
        )}

        {pendingInvitations.length > 0 ? (
          <div className='space-y-4'>
            <HelpBlock
              title='Join Existing Organization'
              description='You have pending invitations. Accept an invitation to join an organization.'
              icon={Users}
              variant='info'
            />
            <div className='space-y-2'>
              {pendingInvitations.map(invitation => (
                <Card key={invitation.id} className='p-4'>
                  <div className='flex items-start justify-between'>
                    <div className='flex-1'>
                      <div className='flex items-center gap-2 mb-1'>
                        <h5 className='font-medium text-sm'>
                          {invitation.organization.name}
                        </h5>
                        {isExpiringSoon(invitation.expiresAt) && (
                          <span className='badge rag-amber text-xs'>
                            EXPIRES SOON
                          </span>
                        )}
                      </div>
                      {invitation.organization.description && (
                        <p className='text-xs text-muted-foreground mb-2'>
                          {invitation.organization.description}
                        </p>
                      )}
                      <div className='text-xs text-muted-foreground'>
                        <div>
                          Invited by{' '}
                          <span className='text-foreground'>
                            {invitation.invitedBy.name}
                          </span>
                        </div>
                        <div>Expires {formatDate(invitation.expiresAt)}</div>
                      </div>
                    </div>
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => handleAcceptInvitation(invitation.id)}
                      disabled={acceptingInvitation === invitation.id}
                    >
                      {acceptingInvitation === invitation.id ? (
                        <>
                          <svg
                            className='animate-spin -ml-1 mr-2 h-4 w-4'
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
                        <>
                          <CheckCircle2 className='h-4 w-4 mr-1' />
                          Accept
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <HelpBlock
            title='Join Existing Organization'
            description={
              <div className='space-y-3'>
                <div className='flex items-center gap-2 text-sm'>
                  <Mail className='h-4 w-4' />
                  <span>No pending invitations</span>
                </div>
                <div className='space-y-2'>
                  <h4 className='font-medium text-sm'>
                    How to join an existing organization:
                  </h4>
                  <ol className='text-sm space-y-1 list-decimal list-inside'>
                    <li>
                      Contact the admin of the organization you want to join
                    </li>
                    <li>
                      Ask them to send you an invitation using your email
                      address
                    </li>
                    <li>Once invited, you&apos;ll see the invitation here</li>
                    <li>Click &quot;Accept&quot; to join the organization</li>
                  </ol>
                </div>
                <div className='p-3 bg-muted/50 rounded-lg'>
                  <p className='text-xs text-muted-foreground'>
                    <strong>Your email:</strong> You&apos;ll need to provide the
                    email address you used to create this account to the
                    organization admin.
                  </p>
                </div>
              </div>
            }
            icon={Users}
            variant='info'
          />
        )}
      </div>
    </div>
  )
}
