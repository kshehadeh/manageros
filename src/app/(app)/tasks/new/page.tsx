import { TaskForm } from '@/components/tasks/task-form'
import { PageSection } from '@/components/ui/page-section'
import { getPeopleForOrganization } from '@/lib/data/people'
import { getObjectivesForOrganization } from '@/lib/data/objectives'
import { requireOrganization } from '@/lib/auth-utils'

export default async function NewTaskPage() {
  // Require organization membership
  const user = await requireOrganization()

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
