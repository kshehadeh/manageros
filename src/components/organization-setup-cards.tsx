'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { OrganizationCreationDialog } from '@/components/organization-creation-dialog'
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
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [acceptingInvitation, setAcceptingInvitation] = useState<string | null>(
    null
  )
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

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
    <div className='space-y-6'>
      <div className='text-center'>
        <h2 className='text-2xl font-semibold mb-2'>Welcome to mpath!</h2>
        <p className='text-muted-foreground'>
          To get started, you&apos;ll need to create an organization or join an
          existing one.
        </p>
      </div>

      <div className='grid gap-6 md:grid-cols-2'>
        {/* Create New Organization Card */}
        <Card className='hover:shadow-md transition-shadow'>
          <CardHeader>
            <div className='flex items-center gap-3'>
              <div className='p-2 bg-primary/10 rounded-lg'>
                <Building2 className='h-6 w-6 text-primary' />
              </div>
              <div>
                <CardTitle className='text-lg'>
                  Create New Organization
                </CardTitle>
                <CardDescription>
                  Start fresh with your own organization
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='space-y-2'>
              <h4 className='font-medium text-sm'>
                Why create a new organization?
              </h4>
              <ul className='text-sm text-muted-foreground space-y-1'>
                <li>• You&apos;re starting a new company or team</li>
                <li>• You want to be the organization admin</li>
                <li>• You need full control over settings and members</li>
                <li>• You&apos;re setting up a demo or test environment</li>
              </ul>
            </div>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className='w-full'
            >
              Create Organization
            </Button>
          </CardContent>
        </Card>

        {/* Join Existing Organization Card */}
        <Card className='hover:shadow-md transition-shadow'>
          <CardHeader>
            <div className='flex items-center gap-3'>
              <div className='p-2 bg-blue-500/10 rounded-lg'>
                <Users className='h-6 w-6 text-blue-500' />
              </div>
              <div>
                <CardTitle className='text-lg'>
                  Join Existing Organization
                </CardTitle>
                <CardDescription>
                  Accept an invitation or request to join
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className='space-y-4'>
            {error && (
              <div className='flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 text-sm'>
                <AlertCircle className='h-4 w-4 flex-shrink-0' />
                <span>{error}</span>
              </div>
            )}

            {pendingInvitations.length > 0 ? (
              <div className='space-y-3'>
                <h4 className='font-medium text-sm'>Pending Invitations</h4>
                <div className='space-y-2'>
                  {pendingInvitations.map(invitation => (
                    <div
                      key={invitation.id}
                      className='p-3 border rounded-lg bg-card'
                    >
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
                            <div>
                              Expires {formatDate(invitation.expiresAt)}
                            </div>
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
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className='space-y-3'>
                <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                  <Mail className='h-4 w-4' />
                  <span>No pending invitations</span>
                </div>
                <div className='space-y-2'>
                  <h4 className='font-medium text-sm'>
                    How to join an existing organization:
                  </h4>
                  <ol className='text-sm text-muted-foreground space-y-1 list-decimal list-inside'>
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
            )}
          </CardContent>
        </Card>
      </div>

      <OrganizationCreationDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  )
}
