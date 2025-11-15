import { getCurrentUser, isAdminOrOwner } from '@/lib/auth-utils'
import { redirect } from 'next/navigation'
import {
  getOrganizationInvitations,
  getOrganizationMembers,
} from '@/lib/actions/organization'
import { getOrganizationSubscription } from '@/lib/subscription-utils'
import { Link } from '@/components/ui/link'
import { Button } from '@/components/ui/button'
import { SectionHeader } from '@/components/ui/section-header'
import { PageSection } from '@/components/ui/page-section'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import {
  Building,
  Bell,
  Briefcase,
  UserCheck,
  User,
  Github,
  Package,
  CreditCard,
} from 'lucide-react'
import { prisma } from '@/lib/db'
import { CreateNotificationModal } from '@/components/notifications/create-notification-modal'
import { OrganizationSettingsBreadcrumbClient } from '@/components/organization/organization-settings-breadcrumb-client'
import { GithubOrganizationsManager } from '@/components/organization/github-organizations-manager'
import { OrganizationSubscriptionButton } from '@/components/organization/organization-subscription-button'

export default async function OrganizationSettingsPage() {
  const user = await getCurrentUser()

  // Check if user is admin
  if (!isAdminOrOwner(user)) {
    redirect('/dashboard')
  }

  // Check if user belongs to an organization
  if (!user.organizationId) {
    redirect('/organization/create')
  }

  // Get open invitations (pending status only) - not currently used
  const invitations = await getOrganizationInvitations()
  const _openInvitations = invitations.filter(inv => inv.status === 'pending')

  // Get members for management
  const members = await getOrganizationMembers()

  // Get subscription information
  const subscription = await getOrganizationSubscription(user.organizationId)

  // Get billing user information
  const billingUser = subscription?.billingUserId
    ? await prisma.user.findUnique({
        where: { id: subscription.billingUserId },
        select: {
          id: true,
          name: true,
          email: true,
          personId: true,
        },
      })
    : null

  return (
    <OrganizationSettingsBreadcrumbClient>
      <PageContainer>
        <PageHeader
          title='Organization Settings'
          subtitle="Manage your organization's settings and configuration"
        />

        <PageContent>
          <div className='grid gap-6 md:grid-cols-2'>
            {/* Organization Info */}
            <PageSection
              header={
                <SectionHeader icon={Building} title='Organization Info' />
              }
            >
              <div className='space-y-4'>
                <div className='space-y-2'>
                  <div>
                    <p className='text-sm font-medium'>Name</p>
                    <p className='text-sm text-muted-foreground'>
                      {user.organizationName}
                    </p>
                  </div>
                  <div>
                    <p className='text-sm font-medium'>Organization ID</p>
                    <p className='text-sm text-muted-foreground'>
                      {user.organizationId}
                    </p>
                  </div>
                  <div>
                    <p className='text-sm font-medium'>Your Role</p>
                    <p className='text-sm text-muted-foreground'>{user.role}</p>
                  </div>
                </div>
                <div className='border-t pt-4 flex flex-wrap gap-3'>
                  <Button asChild variant='outline'>
                    <Link
                      href='/organization/members'
                      className='flex items-center gap-2'
                    >
                      <UserCheck className='w-4 h-4' />
                      Manage Users
                    </Link>
                  </Button>
                  <Button asChild variant='outline'>
                    <Link
                      href='/organization/job-roles'
                      className='flex items-center gap-2'
                    >
                      <Briefcase className='w-4 h-4' />
                      Manage Job Roles
                    </Link>
                  </Button>
                </div>
              </div>
            </PageSection>

            {/* Billing */}
            <PageSection
              header={<SectionHeader icon={CreditCard} title='Billing' />}
            >
              <div className='space-y-4'>
                {/* Subscription Plan Info and Billing User - Side by Side */}
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  {/* Subscription Plan Info */}
                  <div className='space-y-2'>
                    <div className='flex items-center gap-2 mb-2'>
                      <Package className='w-4 h-4 text-muted-foreground' />
                      <p className='text-sm font-medium'>Subscription Plan</p>
                    </div>
                    <div>
                      <p className='text-sm font-medium'>Plan Name</p>
                      <p className='text-sm text-muted-foreground'>
                        {subscription?.subscriptionPlanName || 'Free Plan'}
                      </p>
                    </div>
                    {subscription?.subscriptionStatus && (
                      <div>
                        <p className='text-sm font-medium'>Status</p>
                        <p className='text-sm text-muted-foreground capitalize'>
                          {subscription.subscriptionStatus}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Billing User */}
                  {billingUser && (
                    <div className='space-y-2'>
                      <div className='flex items-center gap-2 mb-2'>
                        <User className='w-4 h-4 text-muted-foreground' />
                        <p className='text-sm font-medium'>Billing User</p>
                      </div>
                      <div>
                        <p className='text-sm font-medium'>Name</p>
                        {billingUser.personId ? (
                          <Link
                            href={`/people/${billingUser.personId}`}
                            className='text-sm text-muted-foreground hover:text-foreground hover:underline'
                          >
                            {billingUser.name}
                          </Link>
                        ) : (
                          <p className='text-sm text-muted-foreground'>
                            {billingUser.name}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className='text-sm font-medium'>Email</p>
                        <p className='text-sm text-muted-foreground'>
                          {billingUser.email}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Clerk Subscription Button */}
                <div className='border-t pt-4'>
                  <OrganizationSubscriptionButton />
                </div>
              </div>
            </PageSection>

            {/* Notifications */}
            <PageSection
              header={<SectionHeader icon={Bell} title='Notifications' />}
            >
              <div className='flex flex-wrap gap-3'>
                <CreateNotificationModal
                  organizationMembers={members.map(member => ({
                    id: member.id,
                    name: member.name,
                    email: member.email,
                  }))}
                />
                <Button asChild variant='outline'>
                  <Link
                    href='/notifications'
                    className='flex items-center gap-2'
                  >
                    <Bell className='w-4 h-4' />
                    View Notifications
                  </Link>
                </Button>
              </div>
            </PageSection>

            {/* GitHub Organizations */}
            <PageSection
              header={
                <SectionHeader icon={Github} title='GitHub Organizations' />
              }
            >
              <GithubOrganizationsManager />
            </PageSection>
          </div>
        </PageContent>
      </PageContainer>
    </OrganizationSettingsBreadcrumbClient>
  )
}
