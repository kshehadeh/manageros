import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getOrganizationInvitations } from '@/lib/actions'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, Users, Building, Shield } from 'lucide-react'

export default async function OrganizationSettingsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/signin')
  }

  // Check if user is admin
  if (session.user.role !== 'ADMIN') {
    redirect('/')
  }

  // Check if user belongs to an organization
  if (!session.user.organizationId) {
    redirect('/organization/create')
  }

  // Get open invitations (pending status only)
  const invitations = await getOrganizationInvitations()
  const openInvitations = invitations.filter(inv => inv.status === 'pending')

  return (
    <div className='page-container'>
      <div className='page-header'>
        <h1 className='page-title'>Organization Settings</h1>
        <p className='page-subtitle'>
          Manage your organization's settings and configuration
        </p>
      </div>

      <div className='grid gap-6 md:grid-cols-2'>
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
                      {openInvitations.length} open invitation{openInvitations.length !== 1 ? 's' : ''}
                    </p>
                    <div className='space-y-1'>
                      {openInvitations.slice(0, 3).map(inv => (
                        <div key={inv.id} className='text-sm'>
                          {inv.email} - <span className='text-muted-foreground'>{inv.role}</span>
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
                <p className='text-sm text-muted-foreground'>No open invitations</p>
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
                <p className='text-sm text-muted-foreground'>{session.user.organizationName}</p>
              </div>
              <div>
                <p className='text-sm font-medium'>Your Role</p>
                <p className='text-sm text-muted-foreground'>{session.user.role}</p>
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
              Access Control
            </CardTitle>
            <CardDescription>
              Manage roles and permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className='text-sm text-muted-foreground'>
              Role management coming soon
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}