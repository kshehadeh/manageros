'use client'

import { useEffect, useState } from 'react'
import { OrganizationSetupCards } from '@/components/organization-setup-cards'

interface OrganizationInvitation {
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

export function DashboardOrganizationSetup() {
  const [invitations, setInvitations] = useState<OrganizationInvitation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchInvitations = async () => {
      try {
        const response = await fetch('/api/organization/invitations')
        if (response.ok) {
          const data = await response.json()
          setInvitations(data.invitations || [])
        }
      } catch (error) {
        console.error('Error fetching invitations:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchInvitations()
  }, [])

  if (loading) {
    return (
      <div className='page-container'>
        <div className='flex items-center justify-center py-12'>
          <div className='text-muted-foreground'>Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className='page-container'>
      <OrganizationSetupCards pendingInvitations={invitations} />
    </div>
  )
}
