import { Link } from '@/components/ui/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { PageSection } from '@/components/ui/page-section'
import { SectionHeader } from '@/components/ui/section-header'
import { SectionHeaderAction } from '@/components/ui/section-header-action'
import { PersonAvatar } from '@/components/people/person-avatar'
import {
  ClipboardList,
  ArrowRight,
  AlertTriangle,
  CheckCircle,
  Clock,
} from 'lucide-react'
import { getDirectReportOnboardingInstances } from '@/lib/actions/onboarding-instance'

export async function OnboardingManagerSection() {
  const instances = await getDirectReportOnboardingInstances()

  // Filter to only show active onboardings
  const activeInstances = instances.filter(
    i => i.status === 'NOT_STARTED' || i.status === 'IN_PROGRESS'
  )

  if (activeInstances.length === 0) {
    return null
  }

  return (
    <PageSection
      header={
        <SectionHeader
          icon={ClipboardList}
          title='Team Onboarding'
          action={
            <SectionHeaderAction href='/onboarding/overview'>
              View All
              <ArrowRight className='w-3.5 h-3.5' />
            </SectionHeaderAction>
          }
        />
      }
    >
      <div className='flex flex-col gap-xl'>
        {activeInstances.slice(0, 5).map(instance => (
          <Card
            key={instance.id}
            className='p-lg rounded-md shadow-none bg-muted/20 border-0'
          >
            <div className='flex items-center gap-lg'>
              <PersonAvatar
                name={instance.person.name}
                avatar={instance.person.avatar}
                size='sm'
                className='shrink-0'
              />

              <div className='flex-1 min-w-0'>
                <div className='flex items-center gap-2'>
                  <Link
                    href={`/people/${instance.person.id}`}
                    className='font-medium text-sm hover:underline truncate'
                  >
                    {instance.person.name}
                  </Link>
                  {instance.isStuck && (
                    <Badge variant='destructive' className='text-xs'>
                      <AlertTriangle className='w-3 h-3 mr-1' />
                      Stuck
                    </Badge>
                  )}
                </div>
                <div className='flex items-center gap-2 mt-sm'>
                  <Progress
                    value={instance.progress.percentComplete}
                    className='flex-1 h-2'
                  />
                  <span className='text-xs text-muted-foreground'>
                    {instance.progress.completed}/{instance.progress.total}
                  </span>
                </div>
              </div>

              <div className='text-right shrink-0'>
                {instance.status === 'NOT_STARTED' ? (
                  <Badge variant='secondary'>
                    <Clock className='w-3 h-3 mr-1' />
                    Not Started
                  </Badge>
                ) : (
                  <Badge variant='default'>
                    <CheckCircle className='w-3 h-3 mr-1' />
                    {instance.progress.percentComplete}%
                  </Badge>
                )}
              </div>
            </div>
          </Card>
        ))}

        {activeInstances.length > 5 && (
          <p className='text-sm text-center text-muted-foreground'>
            +{activeInstances.length - 5} more
          </p>
        )}
      </div>
    </PageSection>
  )
}
