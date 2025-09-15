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
        return 'bg-yellow-100 text-yellow-800'
      case 'accepted':
        return 'bg-green-100 text-green-800'
      case 'expired':
        return 'bg-gray-100 text-gray-800'
      case 'revoked':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
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

  if (invitations.length === 0) {
    return (
      <div className='bg-white shadow rounded-lg p-6'>
        <h3 className='text-lg font-medium text-gray-900 mb-4'>
          Organization Invitations
        </h3>
        <p className='text-gray-500'>No invitations have been sent yet.</p>
      </div>
    )
  }

  return (
    <div className='bg-white shadow rounded-lg p-6'>
      <h3 className='text-lg font-medium text-gray-900 mb-4'>
        Organization Invitations
      </h3>

      {error && (
        <div className='mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded'>
          {error}
        </div>
      )}

      <div className='overflow-x-auto'>
        <table className='min-w-full divide-y divide-gray-200'>
          <thead className='bg-gray-50'>
            <tr>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Email
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Status
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Invited By
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Sent
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Expires
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Actions
              </th>
            </tr>
          </thead>
          <tbody className='bg-white divide-y divide-gray-200'>
            {invitations.map(invitation => (
              <tr key={invitation.id}>
                <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>
                  {invitation.email}
                </td>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(invitation.status)}`}
                  >
                    {invitation.status}
                    {invitation.status === 'pending' &&
                      isExpired(invitation.expiresAt) &&
                      ' (Expired)'}
                  </span>
                </td>
                <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                  {invitation.invitedBy.name}
                </td>
                <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                  {formatDate(invitation.createdAt)}
                </td>
                <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                  {formatDate(invitation.expiresAt)}
                </td>
                <td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
                  {invitation.status === 'pending' &&
                    !isExpired(invitation.expiresAt) && (
                      <button
                        onClick={() => handleRevoke(invitation.id)}
                        disabled={revokingId === invitation.id}
                        className='text-red-600 hover:text-red-900 disabled:opacity-50'
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
