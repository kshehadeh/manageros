import { Link } from '@/components/ui/link'
import { SectionHeader } from '@/components/ui/section-header'
import { SectionHeaderAction } from '@/components/ui/section-header-action'
import { PageSection } from '@/components/ui/page-section'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { SimpleListItem } from '@/components/common/simple-list-item'
import { SimpleListContainer } from '@/components/common/simple-list-container'
import {
  ClipboardList,
  CheckCircle,
  Clock,
  Circle,
  XCircle,
  ArrowRight,
} from 'lucide-react'
import { getOnboardingForPerson } from '@/lib/actions/onboarding-instance'
import type { OnboardingStatus } from '@/generated/prisma'

interface OnboardingSectionProps {
  personId: string
  personName: string
}

const STATUS_CONFIG: Record<
  OnboardingStatus,
  {
    label: string
    variant: 'default' | 'secondary' | 'destructive' | 'outline'
    icon: typeof Circle
  }
> = {
  NOT_STARTED: { label: 'Not Started', variant: 'secondary', icon: Circle },
  IN_PROGRESS: { label: 'In Progress', variant: 'default', icon: Clock },
  COMPLETED: { label: 'Completed', variant: 'outline', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', variant: 'destructive', icon: XCircle },
}

export async function OnboardingSection({ personId }: OnboardingSectionProps) {
  const onboarding = await getOnboardingForPerson(personId)

  if (!onboarding) {
    return null
  }

  const statusConfig = STATUS_CONFIG[onboarding.status]
  const StatusIcon = statusConfig.icon
  const isActive =
    onboarding.status === 'NOT_STARTED' || onboarding.status === 'IN_PROGRESS'

  return (
    <PageSection
      className='flex-1 min-w-[300px]'
      header={
        <SectionHeader
          icon={ClipboardList}
          title='Onboarding'
          action={
            <SectionHeaderAction href={`/people/${personId}/onboarding`}>
              View Details
              <ArrowRight className='w-3.5 h-3.5' />
            </SectionHeaderAction>
          }
        />
      }
    >
      <SimpleListContainer>
        <Link href={`/people/${personId}/onboarding`}>
          <SimpleListItem>
            <div className='flex-1 min-w-0'>
              <div className='flex items-center gap-2'>
                <span className='font-medium text-sm truncate'>
                  {onboarding.template.name}
                </span>
                <Badge variant={statusConfig.variant} className='text-xs'>
                  <StatusIcon className='w-3 h-3 mr-1' />
                  {statusConfig.label}
                </Badge>
              </div>
              <div className='flex items-center gap-3 mt-2'>
                <Progress
                  value={onboarding.progress.percentComplete}
                  className='flex-1 h-2'
                />
                <span className='text-xs text-muted-foreground whitespace-nowrap'>
                  {onboarding.progress.completed}/{onboarding.progress.total}
                </span>
              </div>
              {isActive && onboarding.currentPhase && (
                <p className='text-xs text-muted-foreground mt-1'>
                  Current: {onboarding.currentPhase.name}
                </p>
              )}
            </div>
          </SimpleListItem>
        </Link>
      </SimpleListContainer>
    </PageSection>
  )
}
