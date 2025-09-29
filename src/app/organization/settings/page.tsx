import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import {
  getOrganizationInvitations,
  getJobRoles,
  getJobLevels,
  getJobDomains,
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
import { Mail, Users, Building, Shield, Bell } from 'lucide-react'
import { JobRoleManagement } from '@/components/job-role-management'
import { JobLevelManagement } from '@/components/job-level-management'
import { JobDomainManagement } from '@/components/job-domain-management'
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

  // Get open invitations (pending status only)
  const invitations = await getOrganizationInvitations()
  const openInvitations = invitations.filter(inv => inv.status === 'pending')

  // Get job roles, levels, domains, and members for management
  const [jobRoles, levels, domains, members] = await Promise.all([
    getJobRoles(),
    getJobLevels(),
    getJobDomains(),
    getOrganizationMembers(),
  ])

  return (
    <div className='page-container'>
      <div className='page-header'>
        <h1 className='page-title'>Organization Settings</h1>
        <p className='page-subtitle'>
          Manage your organization&apos;s settings and configuration
        </p>
      </div>

      <div className='grid gap-6 md:grid-cols-2'>
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
              <CreateNotificationModal
                organizationMembers={members.map(member => ({
                  id: member.id,
                  name: member.name,
                  email: member.email,
                }))}
              />
              <p className='text-sm text-muted-foreground'>
                Send notifications to specific users or broadcast to all
                organization members
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Invitations Card */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Mail className='h-5 w-5' />
              Invitations
            </CardTitle>
            <CardDescription>
              Manage user invitations to your organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {openInvitations.length > 0 ? (
                <>
                  <div className='space-y-2'>
                    <p className='text-sm text-muted-foreground'>
                      {openInvitations.length} open invitation
                      {openInvitations.length !== 1 ? 's' : ''}
                    </p>
                    <div className='space-y-1'>
                      {openInvitations.slice(0, 3).map(inv => (
                        <div key={inv.id} className='text-sm'>
                          {inv.email}
                        </div>
                      ))}
                      {openInvitations.length > 3 && (
                        <p className='text-sm text-muted-foreground'>
                          and {openInvitations.length - 3} more...
                        </p>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <p className='text-sm text-muted-foreground'>
                  No open invitations
                </p>
              )}
              <Button asChild variant='outline' className='w-full'>
                <Link href='/organization/invitations'>
                  View All Invitations
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

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

        {/* Team Management Card */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Users className='h-5 w-5' />
              Team Management
            </CardTitle>
            <CardDescription>
              Manage teams and organizational structure
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant='outline' className='w-full'>
              <Link href='/teams'>Manage Teams</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Access Control Card */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Shield className='h-5 w-5' />
              Member Management
            </CardTitle>
            <CardDescription>
              Manage member roles and permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              <Button asChild variant='outline' className='w-full'>
                <Link href='/organization/members'>Manage Members</Link>
              </Button>
              <p className='text-sm text-muted-foreground'>
                Change member roles and remove users from your organization
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Job Role Management Section */}
      <div className='space-y-6 mt-8'>
        <div>
          <h2 className='text-xl font-semibold'>Job Role Management</h2>
          <p className='text-muted-foreground'>
            Configure job levels, domains, and roles for your organization.
          </p>
        </div>

        <div className='grid gap-6 lg:grid-cols-3'>
          {/* Job Level Management */}
          <div className='card'>
            <JobLevelManagement levels={levels} />
          </div>

          {/* Job Domain Management */}
          <div className='card'>
            <JobDomainManagement domains={domains} />
          </div>

          {/* Job Role Management */}
          <div className='card lg:col-span-1'>
            <JobRoleManagement
              jobRoles={jobRoles}
              levels={levels}
              domains={domains}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
