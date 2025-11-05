import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { TaskForm } from '@/components/tasks/task-form'
import { PageSection } from '@/components/ui/page-section'
import { getPeopleForOrganization } from '@/lib/data/people'
import { getObjectivesForOrganization } from '@/lib/data/objectives'

export default async function NewTaskPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user.organizationId) {
    redirect('/organization/create')
  }

  // Get all people and objectives for the form
  const [people, objectives] = await Promise.all([
    getPeopleForOrganization(session.user.organizationId),
    getObjectivesForOrganization(session.user.organizationId),
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
