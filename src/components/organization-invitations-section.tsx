'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { SectionHeader } from '@/components/ui/section-header'
import { PageSection } from '@/components/ui/page-section'
import {
  UserPlus,
  MoreHorizontal,
  Trash2,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react'
import {
  createOrganizationInvitation,
  revokeOrganizationInvitation,
  reactivateOrganizationInvitation,
} from '@/lib/actions/organization'
import { toast } from 'sonner'

interface Invitation {
  id: string
  email: string
  status: string
  createdAt: string
  expiresAt: string
  acceptedAt?: string
  invitedBy: {
    name: string
    email: string
  }
}

interface OrganizationInvitationsSectionProps {
  invitations: Invitation[]
}

export default function OrganizationInvitationsSection({
  invitations,
}: OrganizationInvitationsSectionProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isRevoking, setIsRevoking] = useState<string | null>(null)
  const [isReactivating, setIsReactivating] = useState<string | null>(null)
  const [invitationToRevoke, setInvitationToRevoke] =
    useState<Invitation | null>(null)
  const [invitationToReactivate, setInvitationToReactivate] =
    useState<Invitation | null>(null)
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  const handleCreateInvitation = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)
    setError('')

    try {
      await createOrganizationInvitation(email)
      toast.success(`Invitation sent to ${email}`)
      setEmail('')
      setIsDialogOpen(false)
      // Refresh the page to show updated data
      window.location.reload()
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Failed to send invitation'
      )
    } finally {
      setIsCreating(false)
    }
  }

  const handleRevokeInvitation = async () => {
    if (!invitationToRevoke) return

    setIsRevoking(invitationToRevoke.id)
    try {
      await revokeOrganizationInvitation(invitationToRevoke.id)
      toast.success('Invitation revoked')
      // Refresh the page to show updated data
      window.location.reload()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to revoke invitation'
      )
    } finally {
      setIsRevoking(null)
      setInvitationToRevoke(null)
    }
  }

  const handleReactivateInvitation = async () => {
    if (!invitationToReactivate) return

    setIsReactivating(invitationToReactivate.id)
    try {
      await reactivateOrganizationInvitation(invitationToReactivate.id)
      toast.success('Invitation reactivated')
      // Refresh the page to show updated data
      window.location.reload()
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to reactivate invitation'
      )
    } finally {
      setIsReactivating(null)
      setInvitationToReactivate(null)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className='h-4 w-4' />
      case 'accepted':
        return <CheckCircle className='h-4 w-4' />
      case 'expired':
        return <AlertCircle className='h-4 w-4' />
      case 'revoked':
        return <XCircle className='h-4 w-4' />
      default:
        return <Clock className='h-4 w-4' />
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: {
        variant: 'default' as const,
        className: 'bg-amber-100 text-amber-800 border-amber-200',
      },
      accepted: {
        variant: 'default' as const,
        className: 'bg-green-100 text-green-800 border-green-200',
      },
      expired: {
        variant: 'secondary' as const,
        className: 'bg-gray-100 text-gray-800 border-gray-200',
      },
      revoked: {
        variant: 'destructive' as const,
        className: 'bg-red-100 text-red-800 border-red-200',
      },
    }

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.pending

    return (
      <Badge variant={config.variant} className={config.className}>
        {getStatusIcon(status)}
        <span className='ml-1 capitalize'>{status}</span>
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date()
  }

  // Sort invitations: pending first, then by creation date, excluding accepted and revoked invitations
  const sortedInvitations = [...invitations]
    .filter(inv => inv.status !== 'accepted' && inv.status !== 'revoked')
    .sort((a, b) => {
      if (a.status === 'pending' && b.status !== 'pending') return -1
      if (a.status !== 'pending' && b.status === 'pending') return 1
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

  return (
    <>
      <PageSection
        header={
          <SectionHeader
            icon={Mail}
            title={`Invitations (${invitations.length})`}
            action={
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant='outline' className='flex items-center gap-2'>
                    <UserPlus className='h-4 w-4' />
                    Invite User
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invite User to Organization</DialogTitle>
                    <DialogDescription>
                      Enter the email address of the user you want to invite to
                      your organization.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateInvitation} className='space-y-4'>
                    {error && (
                      <div className='bg-destructive/20 border border-destructive text-destructive px-4 py-3 rounded'>
                        {error}
                      </div>
                    )}
                    <div>
                      <label
                        htmlFor='email'
                        className='block text-sm font-medium text-muted-foreground'
                      >
                        Email Address
                      </label>
                      <input
                        type='email'
                        id='email'
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        className='input mt-1'
                        placeholder='user@example.com'
                      />
                      <p className='mt-1 text-sm text-muted-foreground'>
                        The user will receive an invitation to join your
                        organization. They can accept it when they create their
                        account.
                      </p>
                    </div>
                    <div className='flex justify-end gap-2'>
                      <Button
                        type='button'
                        variant='outline'
                        onClick={() => setIsDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type='submit' disabled={isCreating}>
                        {isCreating ? 'Sending...' : 'Send Invitation'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            }
          />
        }
      >
        {invitations.length === 0 ? (
          <div className='flex flex-col items-center justify-center py-8 text-center'>
            <Mail className='h-8 w-8 text-muted-foreground mb-2' />
            <p className='text-muted-foreground text-sm mb-4'>
              No invitations have been sent yet
            </p>
            <p className='text-xs text-muted-foreground'>
              Click &quot;Invite User&quot; to send your first invitation.
            </p>
          </div>
        ) : (
          <div className='space-y-3'>
            {sortedInvitations.map(invitation => (
              <div
                key={invitation.id}
                className='flex items-start justify-between p-3 border rounded-lg'
              >
                <div className='flex-1 min-w-0'>
                  <div className='font-medium text-sm truncate'>
                    {invitation.email}
                  </div>
                  <div className='mt-1'>
                    {getStatusBadge(invitation.status)}
                  </div>
                  {invitation.status === 'pending' && (
                    <div className='text-xs text-muted-foreground mt-1'>
                      Expires{' '}
                      {isExpired(invitation.expiresAt) ? (
                        <span className='text-red-600'>Expired</span>
                      ) : (
                        formatDate(invitation.expiresAt)
                      )}
                    </div>
                  )}
                </div>
                <div className='ml-3'>
                  {(invitation.status === 'pending' ||
                    invitation.status === 'expired') && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant='ghost'
                          size='sm'
                          disabled={
                            isRevoking === invitation.id ||
                            isReactivating === invitation.id
                          }
                        >
                          <MoreHorizontal className='h-4 w-4' />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align='end'>
                        {invitation.status === 'pending' && (
                          <DropdownMenuItem
                            onClick={() => setInvitationToRevoke(invitation)}
                            className='text-red-600 focus:text-red-600'
                            disabled={isRevoking === invitation.id}
                          >
                            <Trash2 className='h-4 w-4 mr-2' />
                            Revoke Invitation
                          </DropdownMenuItem>
                        )}
                        {invitation.status === 'expired' && (
                          <DropdownMenuItem
                            onClick={() =>
                              setInvitationToReactivate(invitation)
                            }
                            className='text-green-600 focus:text-green-600'
                            disabled={isReactivating === invitation.id}
                          >
                            <UserPlus className='h-4 w-4 mr-2' />
                            Reactivate Invitation
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </PageSection>

      <AlertDialog
        open={!!invitationToRevoke}
        onOpenChange={() => setInvitationToRevoke(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Invitation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke the invitation for{' '}
              <strong>{invitationToRevoke?.email}</strong>? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevokeInvitation}
              className='bg-red-600 hover:bg-red-700'
              disabled={isRevoking === invitationToRevoke?.id}
            >
              {isRevoking === invitationToRevoke?.id
                ? 'Revoking...'
                : 'Revoke Invitation'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!invitationToReactivate}
        onOpenChange={() => setInvitationToReactivate(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reactivate Invitation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reactivate the invitation for{' '}
              <strong>{invitationToReactivate?.email}</strong>? This will send a
              new invitation that expires in 7 days.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReactivateInvitation}
              className='bg-green-600 hover:bg-green-700'
              disabled={isReactivating === invitationToReactivate?.id}
            >
              {isReactivating === invitationToReactivate?.id
                ? 'Reactivating...'
                : 'Reactivate Invitation'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
