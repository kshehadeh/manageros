'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { OrganizationSetupCards } from '@/components/organization-setup-cards'
import { Users } from 'lucide-react'
import { Link } from '@/components/ui/link'
import type { PendingInvitation } from '@/types/organization'

interface Organization {
  id: string
  name: string
  slug: string | null
}

interface OrganizationSectionProps {
  organizationId: string | null
  organizationName: string | null
  pendingInvitations: PendingInvitation[]
}

export function OrganizationSection({
  organizationId,
  organizationName,
}: OrganizationSectionProps) {
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

    if (!organizationId) {
      fetchData()
    } else {
      setLoading(false)
    }
  }, [organizationId])

  // If user has an organization, show organization info
  if (organizationId && organizationName) {
    return (
      <div className='space-y-4'>
        <div className='space-y-2'>
          <div>
            <p className='text-sm font-medium'>Organization Name</p>
            <p className='text-sm text-muted-foreground'>{organizationName}</p>
          </div>
          <div>
            <p className='text-sm font-medium'>Organization ID</p>
            <p className='text-sm text-muted-foreground font-mono text-xs'>
              {organizationId}
            </p>
          </div>
        </div>
        <div className='border-t pt-4'>
          <Button asChild variant='outline'>
            <Link
              href='/organization/settings'
              className='flex items-center gap-2'
            >
              <Users className='w-4 h-4' />
              Manage Users
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  // If no organization, show setup cards
  if (loading) {
    return (
      <div className='flex items-center justify-center py-4'>
        <div className='text-sm text-muted-foreground'>Loading...</div>
      </div>
    )
  }

  const hasMemberships = organizations.length > 0
  const hasInvitations = invitations.length > 0

  return (
    <div className='space-y-4'>
      <OrganizationSetupCards
        hasMemberships={hasMemberships}
        hasInvitations={hasInvitations}
        invitations={invitations}
        organizations={organizations}
      />
    </div>
  )
}
