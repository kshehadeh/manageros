'use client'

import { useEffect, useState } from 'react'
import { PageSection } from '@/components/ui/page-section'
import { SectionHeader } from '@/components/ui/section-header'
import { Building2, Users, Mail } from 'lucide-react'
import { CreateOrganizationForm } from '@/components/organization/create-organization-form'
import { InvitationList } from '@/components/organization/invitation-list'
import { OrganizationSelector } from '@/components/organization/organization-selector'
import type { PendingInvitation } from '@/types/organization'

interface Organization {
  id: string
  name: string
  slug: string | null
}

interface OrganizationNewPageClientProps {
  pendingInvitations: PendingInvitation[]
}

export function OrganizationNewPageClient({
  pendingInvitations: initialPendingInvitations,
}: OrganizationNewPageClientProps) {
  const [loading, setLoading] = useState(true)
  const [invitations, setInvitations] = useState<PendingInvitation[]>(
    initialPendingInvitations
  )
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
      <div className='flex items-center justify-center py-4'>
        <div className='text-sm text-muted-foreground'>Loading...</div>
      </div>
    )
  }

  const hasMemberships = organizations.length > 0
  const hasInvitations = invitations.length > 0

  // Scenario 1: User is already a member of organizations - show switcher
  if (hasMemberships && !hasInvitations) {
    return (
      <PageSection
        variant='bordered'
        header={
          <SectionHeader
            icon={Users}
            title='Select Your Organization'
            description='Choose which organization you want to work with.'
          />
        }
      >
        <OrganizationSelector organizations={organizations} />
      </PageSection>
    )
  }

  // Scenario 2: User has pending invitations (may also have memberships)
  if (hasInvitations) {
    return (
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <PageSection
          variant='bordered'
          header={
            <SectionHeader
              icon={Mail}
              title='Organization Invitations'
              description='You have been invited to join organizations.'
            />
          }
        >
          <InvitationList invitations={invitations} />
        </PageSection>

        {hasMemberships ? (
          <PageSection
            variant='bordered'
            header={
              <SectionHeader
                icon={Users}
                title='Your Organizations'
                description='Or select from your existing organizations.'
              />
            }
          >
            <OrganizationSelector organizations={organizations} />
          </PageSection>
        ) : (
          <PageSection
            variant='bordered'
            header={
              <SectionHeader
                icon={Building2}
                title='Create Your Organization'
                description='Or create your own organization to get started.'
              />
            }
          >
            <CreateOrganizationForm />
          </PageSection>
        )}
      </div>
    )
  }

  // Scenario 3: User has no memberships and no invitations - show create
  return (
    <PageSection
      variant='bordered'
      header={
        <SectionHeader
          icon={Building2}
          title='Welcome to ManagerOS'
          description="You don't have any organizations yet. Create your first organization to get started."
        />
      }
    >
      <CreateOrganizationForm />
    </PageSection>
  )
}
