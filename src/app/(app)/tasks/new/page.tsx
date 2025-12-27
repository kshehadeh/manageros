import { TaskForm } from '@/components/tasks/task-form'
import { PageSection } from '@/components/ui/page-section'
import { getPeopleForOrganization } from '@/lib/data/people'
import { getObjectivesForOrganization } from '@/lib/data/objectives'
import { requireOrganization } from '@/lib/auth-utils'

interface NewTaskPageProps {
  searchParams: Promise<{
    assigneeId?: string
    initiativeId?: string
    objectiveId?: string
  }>
}

export default async function NewTaskPage({ searchParams }: NewTaskPageProps) {
  // Require organization membership
  const user = await requireOrganization()

  const { assigneeId, initiativeId, objectiveId } = await searchParams

  // Get all people and objectives for the form
  // user.managerOSOrganizationId is guaranteed to be non-null after requireOrganization()
  const [people, objectives] = await Promise.all([
    getPeopleForOrganization(user.managerOSOrganizationId!),
    getObjectivesForOrganization(user.managerOSOrganizationId!),
  ])

  return (
    <div className='page-container'>
      <PageSection>
        <div className='card'>
          <TaskForm
            people={people}
            objectives={objectives}
            preselectedAssigneeId={assigneeId}
            preselectedInitiativeId={initiativeId}
            preselectedObjectiveId={objectiveId}
            header={{
              title: 'Create New Task',
              subtitle: 'Create a new task for your organization',
            }}
          />
        </div>
      </PageSection>
    </div>
  )
}
