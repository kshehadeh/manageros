'use client'

import { useState } from 'react'
import { revokeOrganizationInvitation } from '@/lib/actions'

interface Invitation {
  id: string
  email: string
  status: string
  expiresAt: string
  acceptedAt?: string
  createdAt: string
  invitedBy: {
    name: string
    email: string
  }
}

interface InvitationListProps {
  invitations: Invitation[]
  onInvitationRevoked?: () => void
}

export default function InvitationList({
  invitations,
  onInvitationRevoked,
}: InvitationListProps) {
  const [revokingId, setRevokingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const handleRevoke = async (invitationId: string) => {
    setRevokingId(invitationId)
    setError('')

    try {
      await revokeOrganizationInvitation(invitationId)
      onInvitationRevoked?.()
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Failed to revoke invitation'
      )
    } finally {
      setRevokingId(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-900/30 border-amber-700 text-amber-300'
      case 'accepted':
        return 'bg-green-900/30 border-green-700 text-green-300'
      case 'expired':
        return 'bg-neutral-900/30 border-neutral-700 text-neutral-300'
      case 'revoked':
        return 'bg-red-900/30 border-red-700 text-red-300'
      default:
        return 'bg-neutral-900/30 border-neutral-700 text-neutral-300'
    }
  }

  const formatDate = (dateString: string, compact: boolean = false) => {
    const date = new Date(dateString)
    if (compact) {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    }
    return date.toLocaleDateString('en-US', {
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

  if (invitations.length === 0) {
    return (
      <div className='card'>
        <h3 className='text-lg font-medium text-neutral-100 mb-4'>
          Organization Invitations
        </h3>
        <p className='text-neutral-400'>No invitations have been sent yet.</p>
      </div>
    )
  }

  return (
    <div className='card'>
      <h3 className='text-lg font-medium text-neutral-100 mb-4'>
        Organization Invitations
      </h3>

      {error && (
        <div className='mb-4 bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded'>
          {error}
        </div>
      )}

      {/* Mobile Card View */}
      <div className='block sm:hidden space-y-3'>
        {invitations.map(invitation => (
          <div
            key={invitation.id}
            className='border border-neutral-700 rounded-lg p-4'
          >
            <div className='flex items-center justify-between mb-2'>
              <div
                className='font-medium text-neutral-100 truncate max-w-xs'
                title={invitation.email}
              >
                {invitation.email}
              </div>
              <span className={`badge ${getStatusColor(invitation.status)}`}>
                {invitation.status}
                {invitation.status === 'pending' &&
                  isExpired(invitation.expiresAt) &&
                  ' (Expired)'}
              </span>
            </div>
            <div className='text-sm text-neutral-400 space-y-1'>
              <div>Invited by: {invitation.invitedBy.name}</div>
              <div>Sent: {formatDate(invitation.createdAt, true)}</div>
              <div>Expires: {formatDate(invitation.expiresAt, true)}</div>
            </div>
            {invitation.status === 'pending' &&
              !isExpired(invitation.expiresAt) && (
                <div className='mt-3'>
                  <button
                    onClick={() => handleRevoke(invitation.id)}
                    disabled={revokingId === invitation.id}
                    className='text-red-400 hover:text-red-300 disabled:opacity-50 text-sm'
                  >
                    {revokingId === invitation.id ? 'Revoking...' : 'Revoke'}
                  </button>
                </div>
              )}
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className='hidden sm:block overflow-x-auto -mx-4 sm:mx-0'>
        <table className='min-w-full divide-y divide-neutral-700'>
          <thead className='bg-neutral-800'>
            <tr>
              <th className='px-3 sm:px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider'>
                Email
              </th>
              <th className='px-3 sm:px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider'>
                Status
              </th>
              <th className='hidden sm:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider'>
                Invited By
              </th>
              <th className='hidden md:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider'>
                Sent
              </th>
              <th className='hidden lg:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider'>
                Expires
              </th>
              <th className='px-3 sm:px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider'>
                Actions
              </th>
            </tr>
          </thead>
          <tbody className='divide-y divide-neutral-700'>
            {invitations.map(invitation => (
              <tr key={invitation.id}>
                <td className='px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-100'>
                  <div className='max-w-xs truncate' title={invitation.email}>
                    {invitation.email}
                  </div>
                </td>
                <td className='px-3 sm:px-6 py-4 whitespace-nowrap'>
                  <span
                    className={`badge ${getStatusColor(invitation.status)}`}
                  >
                    {invitation.status}
                    {invitation.status === 'pending' &&
                      isExpired(invitation.expiresAt) &&
                      ' (Expired)'}
                  </span>
                </td>
                <td className='hidden sm:table-cell px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-neutral-400'>
                  {invitation.invitedBy.name}
                </td>
                <td className='hidden md:table-cell px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-neutral-400'>
                  <span className='hidden lg:inline'>
                    {formatDate(invitation.createdAt)}
                  </span>
                  <span className='lg:hidden'>
                    {formatDate(invitation.createdAt, true)}
                  </span>
                </td>
                <td className='hidden lg:table-cell px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-neutral-400'>
                  {formatDate(invitation.expiresAt)}
                </td>
                <td className='px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium'>
                  {invitation.status === 'pending' &&
                    !isExpired(invitation.expiresAt) && (
                      <button
                        onClick={() => handleRevoke(invitation.id)}
                        disabled={revokingId === invitation.id}
                        className='text-red-400 hover:text-red-300 disabled:opacity-50'
                      >
                        {revokingId === invitation.id
                          ? 'Revoking...'
                          : 'Revoke'}
                      </button>
                    )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
