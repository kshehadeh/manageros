import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import {
  getOrganizationInvitations,
  getOrganizationMembers,
} from '@/lib/actions'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Building, Shield, Bell, Briefcase } from 'lucide-react'
import { CreateNotificationModal } from '@/components/create-notification-modal'

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
    <div className='page-container'>
      <div className='page-header'>
        <h1 className='page-title'>Organization Settings</h1>
        <p className='page-subtitle'>
          Manage your organization&apos;s settings and configuration
        </p>
      </div>

      <div className='grid gap-6 md:grid-cols-2'>
        {/* Organization Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Building className='h-5 w-5' />
              Organization Info
            </CardTitle>
            <CardDescription>
              Basic information about your organization
            </CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        {/* User Management Card */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Shield className='h-5 w-5' />
              User Management
            </CardTitle>
            <CardDescription>Manage user roles and permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              <Button asChild variant='outline' className='w-full'>
                <Link href='/organization/members'>Manage Users</Link>
              </Button>
              <p className='text-sm text-muted-foreground'>
                Change user roles and remove users from your organization
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Job Role Management Card */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Briefcase className='h-5 w-5' />
              Job Role Management
            </CardTitle>
            <CardDescription>
              Configure job levels, domains, and roles for your organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              <Button asChild variant='outline' className='w-full'>
                <Link href='/organization/job-roles'>Manage Job Roles</Link>
              </Button>
              <p className='text-sm text-muted-foreground'>
                Set up job levels, domains, and roles to organize your team
                structure
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Notifications Card */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Bell className='h-5 w-5' />
              Notifications
            </CardTitle>
            <CardDescription>
              Create and manage organization notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
