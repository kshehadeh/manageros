'use client'

import { useEffect, useState } from 'react'
import { PageSection } from '@/components/ui/page-section'
import { SectionHeader } from '@/components/ui/section-header'
import { Building2, Users, Mail, AlertTriangle } from 'lucide-react'
import { CreateOrganizationForm } from '@/components/organization/create-organization-form'
import { InvitationList } from '@/components/organization/invitation-list'
import { OrganizationSelector } from '@/components/organization/organization-selector'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import type { PendingInvitation } from '@/types/organization'

interface Organization {
  id: string
  name: string
  slug: string | null
}

interface OrganizationNewPageClientProps {
  pendingInvitations: PendingInvitation[]
  wasRemovedFromOrganization?: boolean
}

export function OrganizationNewPageClient({
  pendingInvitations: initialPendingInvitations,
  wasRemovedFromOrganization = false,
}: OrganizationNewPageClientProps) {
  const [loading, setLoading] = useState(true)
  const [showRemovedAlert, setShowRemovedAlert] = useState(
    wasRemovedFromOrganization
  )
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

  // Render the organization removal alert if applicable
  const RemovedAlert = showRemovedAlert ? (
    <Alert variant='destructive' className='mb-6 relative'>
      <AlertTriangle className='h-4 w-4' />
      <AlertTitle>Organization Access Removed</AlertTitle>
      <AlertDescription>
        You have been removed from your organization. This may have been done by
        an administrator. If you believe this was a mistake, please contact your
        organization admin. You can join another organization or create a new
        one below.
      </AlertDescription>
      <button
        onClick={() => setShowRemovedAlert(false)}
        className='absolute top-3 right-3 text-muted-foreground hover:text-foreground text-lg leading-none'
        aria-label='Dismiss'
      >
        ×
      </button>
    </Alert>
  ) : null

  // Scenario 1: User is already a member of organizations - show switcher
  if (hasMemberships && !hasInvitations) {
    return (
      <>
        {RemovedAlert}
        <PageSection
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
      </>
    )
  }

  // Scenario 2: User has pending invitations (may also have memberships)
  if (hasInvitations) {
    return (
      <>
        {RemovedAlert}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          <PageSection
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
      </>
    )
  }

  // Scenario 3: User has no memberships and no invitations - show create
  return (
    <>
      {RemovedAlert}
      <PageSection
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
    </>
  )
}
