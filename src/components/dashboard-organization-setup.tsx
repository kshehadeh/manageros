'use client'

import { useEffect, useState } from 'react'
import { OrganizationSetupCards } from '@/components/organization-setup-cards'
import { PageContainer } from '@/components/ui/page-container'
import type { PendingInvitation } from '@/types/organization'

export function DashboardOrganizationSetup() {
  const [invitations, setInvitations] = useState<PendingInvitation[]>([])
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
      <PageContainer>
        <div className='flex items-center justify-center py-12'>
          <div className='text-muted-foreground'>Loading...</div>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <OrganizationSetupCards pendingInvitations={invitations} />
    </PageContainer>
  )
}
