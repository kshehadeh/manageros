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
import { getSuggestedTemplatesForPerson } from '@/lib/actions/onboarding-template'
import { getPeopleForOrganization } from '@/lib/data/people'
import { getCurrentUser } from '@/lib/auth-utils'
import { getFeedbackForPerson } from '@/lib/actions/feedback'
import { getTasksForAssignee } from '@/lib/data/tasks'
import { getOneOnOnesForPerson } from '@/lib/data/one-on-ones'
import { getPersonWithReportsAndManager } from '@/lib/data/people'
import type { OnboardingStatus } from '@/generated/prisma'
import { OnboardingEmptyStateCard } from './onboarding-empty-state-card'
import { prisma } from '@/lib/db'
import { checkIfManagerOrSelf } from '@/lib/utils/people-utils'

interface OnboardingSectionProps {
  personId: string
  personName: string
  currentPersonId?: string | null
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

export async function OnboardingSection({
  personId,
  currentPersonId,
}: OnboardingSectionProps) {
  const onboarding = await getOnboardingForPerson(personId)

  // If no onboarding, check if templates are available and show empty state
  if (!onboarding) {
    const user = await getCurrentUser()
    if (!user.managerOSOrganizationId) {
      return null
    }

    // Check if person has any feedback, tasks, initiatives, or 1:1 meetings
    // Only show onboarding card if they have none of these
    const [feedback, tasks, initiatives, personWithRelations] =
      await Promise.all([
        getFeedbackForPerson(personId).catch(() => []),
        getTasksForAssignee(
          personId,
          user.managerOSOrganizationId,
          user.managerOSUserId || '',
          {
            statusFilter: ['todo', 'in_progress', 'done'],
            include: {},
          }
        ).catch(() => []),
        prisma.initiative
          .findMany({
            where: {
              organizationId: user.managerOSOrganizationId,
              owners: {
                some: { personId },
              },
            },
            take: 1,
          })
          .catch(() => []),
        getPersonWithReportsAndManager(
          personId,
          user.managerOSOrganizationId
        ).catch(() => null),
      ])

    // Check for 1:1 meetings if person has manager or reports
    let hasOneOnOnes = false
    if (
      personWithRelations &&
      (personWithRelations.manager || personWithRelations.reports.length > 0)
    ) {
      try {
        const oneOnOnes = await getOneOnOnesForPerson(
          personId,
          user.managerOSOrganizationId,
          {
            limit: 1,
            includeManager: false,
            includeReport: false,
          }
        )
        hasOneOnOnes = oneOnOnes.length > 0
      } catch {
        // Ignore errors
      }
    }

    // If person has any feedback, tasks, initiatives, or 1:1 meetings, don't show onboarding card
    if (
      feedback.length > 0 ||
      tasks.length > 0 ||
      initiatives.length > 0 ||
      hasOneOnOnes
    ) {
      return null
    }

    // Check if current user is a manager (direct or indirect) of this person
    // Only show onboarding card if user is a manager (not self)
    const isManager =
      currentPersonId && currentPersonId !== personId
        ? await checkIfManagerOrSelf(currentPersonId, personId)
        : false

    if (!isManager || currentPersonId === personId) {
      return null
    }

    // Check if there are any active templates available
    const templates = await getSuggestedTemplatesForPerson(personId)

    // Only show empty state if templates are available
    if (templates.length === 0) {
      return null
    }

    // Get person data for the modal
    const personData = await prisma.person.findFirst({
      where: {
        id: personId,
        organizationId: user.managerOSOrganizationId,
      },
      select: {
        id: true,
        name: true,
        teamId: true,
        jobRoleId: true,
        managerId: true,
      },
    })

    if (!personData) {
      return null
    }

    // Get people list for mentor selection
    const people = await getPeopleForOrganization(user.managerOSOrganizationId)

    return (
      <OnboardingEmptyStateCard
        person={personData}
        people={people.map(p => ({ id: p.id, name: p.name }))}
      />
    )
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
