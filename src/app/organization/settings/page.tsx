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
import {
  Building,
  Shield,
  Bell,
  Briefcase,
  Calendar,
  UserCheck,
  User,
  Users2,
  ListTodo,
  Rocket,
} from 'lucide-react'
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
            header={
              <SectionHeader
                icon={Building}
                title='Organization Info'
                description='Basic information about your organization'
              />
            }
          >
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
            header={
              <SectionHeader
                icon={Shield}
                title='User Management'
                description='Change user roles and remove users from your organization'
              />
            }
          >
            <div className='flex flex-wrap gap-3'>
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
                <Link href='/people' className='flex items-center gap-2'>
                  <User className='w-4 h-4' />
                  People
                </Link>
              </Button>
              <Button asChild variant='outline'>
                <Link href='/teams' className='flex items-center gap-2'>
                  <Users2 className='w-4 h-4' />
                  Teams
                </Link>
              </Button>
            </div>
          </PageSection>

          {/* Job Role Management */}
          <PageSection
            header={
              <SectionHeader
                icon={Briefcase}
                title='Job Role Management'
                description='Set up job levels, domains, and roles to organize your team structure'
              />
            }
          >
            <div className='flex flex-wrap gap-3'>
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
          </PageSection>

          {/* Planning */}
          <PageSection
            header={
              <SectionHeader
                icon={Calendar}
                title='Planning'
                description='Organize and track work across your organization'
              />
            }
          >
            <div className='flex flex-wrap gap-3'>
              <Button asChild variant='outline'>
                <Link href='/tasks' className='flex items-center gap-2'>
                  <ListTodo className='w-4 h-4' />
                  Tasks
                </Link>
              </Button>
              <Button asChild variant='outline'>
                <Link href='/meetings' className='flex items-center gap-2'>
                  <Calendar className='w-4 h-4' />
                  Meetings
                </Link>
              </Button>
              <Button asChild variant='outline'>
                <Link href='/initiatives' className='flex items-center gap-2'>
                  <Rocket className='w-4 h-4' />
                  Initiatives
                </Link>
              </Button>
            </div>
          </PageSection>

          {/* Notifications */}
          <PageSection
            header={
              <SectionHeader
                icon={Bell}
                title='Notifications'
                description='Send notifications to specific users or broadcast to all organization members'
              />
            }
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
                <Link href='/notifications' className='flex items-center gap-2'>
                  <Bell className='w-4 h-4' />
                  View Notifications
                </Link>
              </Button>
            </div>
          </PageSection>
        </div>
      </div>
    </OrganizationSettingsBreadcrumbClient>
  )
}
