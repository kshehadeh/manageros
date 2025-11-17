import { redirect } from 'next/navigation'
import { TaskForm } from '@/components/tasks/task-form'
import { PageSection } from '@/components/ui/page-section'
import { getPeopleForOrganization } from '@/lib/data/people'
import { getObjectivesForOrganization } from '@/lib/data/objectives'
import { getCurrentUser } from '@/lib/auth-utils'

export default async function NewTaskPage() {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId) {
    redirect('/organization/create')
  }

  // Get all people and objectives for the form
  const [people, objectives] = await Promise.all([
    getPeopleForOrganization(user.managerOSOrganizationId),
    getObjectivesForOrganization(user.managerOSOrganizationId),
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
