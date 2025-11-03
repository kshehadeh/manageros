import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { TaskForm } from '@/components/tasks/task-form'
import { PageSection } from '@/components/ui/page-section'
import { getPeopleForOrganization } from '@/lib/data/people'
import { getObjectivesForOrganization } from '@/lib/data/objectives'

export default async function NewTaskPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/signin')
  }

  if (!session.user.organizationId) {
    redirect('/organization/create')
  }

  // Get all people and objectives for the form
  const [people, objectives] = await Promise.all([
    getPeopleForOrganization(session.user.organizationId),
    getObjectivesForOrganization(session.user.organizationId),
  ])

  return (
    <div className='page-container'>
      <div className='page-header'>
        <div>
          <h1 className='page-title'>Create New Task</h1>
          <p className='page-subtitle'>
            Create a new task for your organization
          </p>
        </div>
      </div>

      <PageSection>
        <div className='card'>
          <TaskForm people={people} objectives={objectives} />
        </div>
      </PageSection>
    </div>
  )
}
