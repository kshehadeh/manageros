import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import {
  getOrganizationInvitations,
  getOrganizationMembers,
} from '@/lib/actions/organization'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { SectionHeader } from '@/components/ui/section-header'
import { PageSection } from '@/components/ui/page-section'
import { Building, Shield, Bell, Briefcase, Calendar } from 'lucide-react'
import { CreateNotificationModal } from '@/components/notifications/create-notification-modal'
import { OrganizationSettingsBreadcrumbClient } from '@/components/organization/organization-settings-breadcrumb-client'

export default async function OrganizationSettingsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/signin')
  }

  // Check if user is admin
  if (session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  // Check if user belongs to an organization
  if (!session.user.organizationId) {
    redirect('/organization/create')
  }

  // Get open invitations (pending status only) - not currently used
  const invitations = await getOrganizationInvitations()
  const _openInvitations = invitations.filter(inv => inv.status === 'pending')

  // Get members for management
  const members = await getOrganizationMembers()

  return (
    <OrganizationSettingsBreadcrumbClient>
      <div className='page-container'>
        <div className='page-header'>
          <h1 className='page-title'>Organization Settings</h1>
          <p className='page-subtitle'>
            Manage your organization&apos;s settings and configuration
          </p>
        </div>

        <div className='grid gap-6 md:grid-cols-2'>
          {/* Organization Info */}
          <PageSection
            header={<SectionHeader icon={Building} title='Organization Info' />}
          >
            <p className='text-sm text-muted-foreground mb-4'>
              Basic information about your organization
            </p>
            <div className='space-y-2'>
              <div>
                <p className='text-sm font-medium'>Name</p>
                <p className='text-sm text-muted-foreground'>
                  {session.user.organizationName}
                </p>
              </div>
              <div>
                <p className='text-sm font-medium'>Your Role</p>
                <p className='text-sm text-muted-foreground'>
                  {session.user.role}
                </p>
              </div>
            </div>
          </PageSection>

          {/* User Management */}
          <PageSection
            header={<SectionHeader icon={Shield} title='User Management' />}
          >
            <p className='text-sm text-muted-foreground mb-4'>
              Manage user roles and permissions
            </p>
            <div className='space-y-3'>
              <Button asChild variant='outline' className='w-full'>
                <Link href='/organization/members'>Manage Users</Link>
              </Button>
              <Button asChild variant='outline' className='w-full'>
                <Link href='/people'>People</Link>
              </Button>
              <Button asChild variant='outline' className='w-full'>
                <Link href='/teams'>Teams</Link>
              </Button>
              <p className='text-sm text-muted-foreground'>
                Change user roles and remove users from your organization
              </p>
            </div>
          </PageSection>

          {/* Job Role Management */}
          <PageSection
            header={
              <SectionHeader icon={Briefcase} title='Job Role Management' />
            }
          >
            <p className='text-sm text-muted-foreground mb-4'>
              Configure job levels, domains, and roles for your organization
            </p>
            <div className='space-y-3'>
              <Button asChild variant='outline' className='w-full'>
                <Link href='/organization/job-roles'>Manage Job Roles</Link>
              </Button>
              <p className='text-sm text-muted-foreground'>
                Set up job levels, domains, and roles to organize your team
                structure
              </p>
            </div>
          </PageSection>

          {/* Planning */}
          <PageSection
            header={<SectionHeader icon={Calendar} title='Planning' />}
          >
            <p className='text-sm text-muted-foreground mb-4'>
              Manage tasks, meetings, and initiatives for your organization
            </p>
            <div className='space-y-3'>
              <Button asChild variant='outline' className='w-full'>
                <Link href='/tasks'>Tasks</Link>
              </Button>
              <Button asChild variant='outline' className='w-full'>
                <Link href='/meetings'>Meetings</Link>
              </Button>
              <Button asChild variant='outline' className='w-full'>
                <Link href='/initiatives'>Initiatives</Link>
              </Button>
              <p className='text-sm text-muted-foreground'>
                Organize and track work across your organization
              </p>
            </div>
          </PageSection>

          {/* Notifications */}
          <PageSection
            header={<SectionHeader icon={Bell} title='Notifications' />}
          >
            <p className='text-sm text-muted-foreground mb-4'>
              Create and manage organization notifications
            </p>
            <div className='space-y-3'>
              <div className='flex gap-2'>
                <CreateNotificationModal
                  organizationMembers={members.map(member => ({
                    id: member.id,
                    name: member.name,
                    email: member.email,
                  }))}
                />
                <Button asChild variant='outline' className='flex-1'>
                  <Link href='/notifications'>View Notifications</Link>
                </Button>
              </div>
              <p className='text-sm text-muted-foreground'>
                Send notifications to specific users or broadcast to all
                organization members
              </p>
            </div>
          </PageSection>
        </div>
      </div>
    </OrganizationSettingsBreadcrumbClient>
  )
}
