'use client'

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

interface OrganizationSetupCardsProps {
  hasMemberships: boolean
  hasInvitations: boolean
  invitations: PendingInvitation[]
  organizations: Organization[]
}

export function OrganizationSetupCards({
  hasMemberships,
  hasInvitations,
  invitations,
  organizations,
}: OrganizationSetupCardsProps) {
  // Scenario 1: User is already a member of organizations - show switcher
  if (hasMemberships && !hasInvitations) {
    return (
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
    )
  }

  // Scenario 2: User has pending invitations (may also have memberships)
  if (hasInvitations) {
    return (
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
    )
  }

  // Scenario 3: User has no memberships and no invitations - show create
  return (
    <PageSection
      header={
        <SectionHeader
          icon={Building2}
          title='Welcome to mpath'
          description="You don't have any organizations yet. Create your first organization to get started."
        />
      }
    >
      <CreateOrganizationForm />
    </PageSection>
  )
}
