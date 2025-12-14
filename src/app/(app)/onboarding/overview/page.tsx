import { redirect } from 'next/navigation'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getCurrentUser, isAdminOrOwner } from '@/lib/auth-utils'
import {
  getOnboardingInstances,
  getOnboardingStats,
  getDirectReportOnboardingInstances,
} from '@/lib/actions/onboarding-instance'
import { OnboardingOversightTable } from '@/components/onboarding/onboarding-oversight-table'
import { Users, Clock, CheckCircle, AlertTriangle } from 'lucide-react'

export default async function OnboardingOverviewPage() {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId) {
    redirect('/dashboard')
  }

  const isAdmin = isAdminOrOwner(user)

  // For admins, show all instances; for managers, show their direct reports
  const [instances, stats] = await Promise.all([
    isAdmin ? getOnboardingInstances() : getDirectReportOnboardingInstances(),
    getOnboardingStats(),
  ])

  // Count stuck instances
  const stuckCount = instances.filter(i => 'isStuck' in i && i.isStuck).length

  return (
    <PageContainer>
      <PageHeader
        title='Onboarding Overview'
        subtitle={
          isAdmin
            ? 'Monitor all onboarding progress across your organization'
            : 'Track onboarding progress for your direct reports'
        }
      />

      <PageContent>
        <div className='space-y-6'>
          {/* Stats Cards */}
          {stats && (
            <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
              <Card>
                <CardHeader className='pb-2'>
                  <CardTitle className='text-sm font-medium text-muted-foreground'>
                    Active Onboardings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='flex items-center gap-2'>
                    <Users className='w-4 h-4 text-muted-foreground' />
                    <span className='text-2xl font-bold'>
                      {stats.totalActive}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className='pb-2'>
                  <CardTitle className='text-sm font-medium text-muted-foreground'>
                    In Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='flex items-center gap-2'>
                    <Clock className='w-4 h-4 text-blue-500' />
                    <span className='text-2xl font-bold'>
                      {stats.inProgress}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className='pb-2'>
                  <CardTitle className='text-sm font-medium text-muted-foreground'>
                    Completed (30d)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='flex items-center gap-2'>
                    <CheckCircle className='w-4 h-4 text-green-500' />
                    <span className='text-2xl font-bold'>
                      {stats.completedLast30Days}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className='pb-2'>
                  <CardTitle className='text-sm font-medium text-muted-foreground'>
                    Stuck
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='flex items-center gap-2'>
                    <AlertTriangle
                      className={`w-4 h-4 ${stuckCount > 0 ? 'text-amber-500' : 'text-muted-foreground'}`}
                    />
                    <span className='text-2xl font-bold'>{stuckCount}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Onboarding Table */}
          <Card>
            <CardHeader>
              <CardTitle>
                {isAdmin ? 'All Onboardings' : "Your Team's Onboardings"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <OnboardingOversightTable instances={instances} />
            </CardContent>
          </Card>
        </div>
      </PageContent>
    </PageContainer>
  )
}
