'use client'

import { useEffect, useState } from 'react'
import { OrganizationSetupCards } from '@/components/organization-setup-cards'
import { PageContainer } from '@/components/ui/page-container'
import type { PendingInvitation } from '@/types/organization'

interface Organization {
  id: string
  name: string
  slug: string | null
}

export function DashboardOrganizationSetup() {
  const [loading, setLoading] = useState(true)
  const [invitations, setInvitations] = useState<PendingInvitation[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [invitationsRes, orgsRes] = await Promise.all([
          fetch('/api/organization/invitations'),
          fetch('/api/organization/memberships'),
        ])

        if (invitationsRes.ok) {
          const data = await invitationsRes.json()
          setInvitations(data.invitations || [])
        }

        if (orgsRes.ok) {
          const data = await orgsRes.json()
          setOrganizations(data.organizations || [])
        }
      } catch (error) {
        console.error('Error fetching organization data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <PageContainer>
        <div className='flex items-center justify-center py-12'>
          <div className='text-muted-foreground'>Loading...</div>
        </div>
      </PageContainer>
    )
  }

  const hasMemberships = organizations.length > 0
  const hasInvitations = invitations.length > 0

  return (
    <PageContainer>
      <OrganizationSetupCards
        hasMemberships={hasMemberships}
        hasInvitations={hasInvitations}
        invitations={invitations}
        organizations={organizations}
      />
    </PageContainer>
  )
}
