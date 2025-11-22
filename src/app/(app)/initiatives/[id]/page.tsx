import { redirect } from 'next/navigation'
import { InitiativeDetailClient } from '@/components/initiatives/initiative-detail-client'
import { InitiativeActionsDropdown } from '@/components/initiatives/initiative-actions-dropdown'
import { InitiativeObjectivesServer } from '@/components/initiatives/initiative-objectives-server'
import { InitiativeTasks } from '@/components/initiatives/initiative-tasks-server'
import { InitiativeCheckInsServer } from '@/components/initiatives/initiative-checkins-server'
import { InitiativeMeetingsServer } from '@/components/initiatives/initiative-meetings-server'
import { InitiativeSidebar } from '@/components/initiatives/initiative-sidebar'
import { NotesSectionServer } from '@/components/notes/notes-section-server'
import { InitiativeCompletionRate } from '@/components/initiatives/initiative-completion-rate'
import { SectionHeader } from '@/components/ui/section-header'
import { PageSection } from '@/components/ui/page-section'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { PageMain } from '@/components/ui/page-main'
import { PageSidebar } from '@/components/ui/page-sidebar'
import { ReadonlyNotesField } from '@/components/readonly-notes-field'
import { Suspense } from 'react'
import { FileText, Rocket } from 'lucide-react'
import { getCurrentUser, getActionPermission } from '@/lib/auth-utils'
import { prisma } from '@/lib/db'
import {
  InitiativeTasksSkeleton,
  InitiativeObjectivesSkeleton,
  InitiativeMeetingsSkeleton,
  InitiativeNotesSkeleton,
  InitiativeCheckInsSkeleton,
  InitiativeSidebarSkeleton,
  InitiativeCompletionRateSkeleton,
} from '@/components/initiatives/initiative-detail-skeletons'
import { Rag } from '../../../../components/rag'

export default async function InitiativeDetail({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await getCurrentUser()

  const { id } = await params
  const canView = await getActionPermission(user, 'initiative.view', id)
  if (!canView) {
    redirect('/initiatives')
  }

  // Only fetch the initiative with minimal data needed for the page
  // Filter by organizationId to ensure organization isolation
  const init = await prisma.initiative.findFirst({
    where: {
      id,
      organizationId: user.managerOSOrganizationId || '',
    },
    select: {
      id: true,
      title: true,
      summary: true,
      rag: true,
    },
  })

  if (!init) return <div>Not found</div>

  // Check permissions for edit and delete
  const canEdit = await getActionPermission(user, 'initiative.edit', init.id)
  const canDelete = await getActionPermission(
    user,
    'initiative.delete',
    init.id
  )

  return (
    <InitiativeDetailClient initiativeTitle={init.title} initiativeId={init.id}>
      <PageContainer>
        <PageHeader
          title={init.title}
          titleIcon={Rocket}
          subtitle={
            <div className='flex items-center gap-2'>
              <Rag rag={init.rag} size='small' />
              <Suspense fallback={<InitiativeCompletionRateSkeleton />}>
                <InitiativeCompletionRate initiativeId={init.id} />
              </Suspense>
            </div>
          }
          actions={
            <InitiativeActionsDropdown
              initiativeId={init.id}
              canEdit={canEdit}
              canDelete={canDelete}
            />
          }
        />

        <PageContent>
          <PageMain>
            <div className='space-y-6'>
              {/* Summary Section */}
              {init.summary && (
                <PageSection
                  header={<SectionHeader icon={FileText} title='Summary' />}
                >
                  <ReadonlyNotesField
                    content={init.summary}
                    variant='default'
                    emptyStateText='No summary provided'
                    truncateMode={true}
                    maxHeight='200px'
                  />
                </PageSection>
              )}

              <Suspense fallback={<InitiativeTasksSkeleton />}>
                <InitiativeTasks initiativeId={init.id} />
              </Suspense>

              <Suspense fallback={<InitiativeObjectivesSkeleton />}>
                <InitiativeObjectivesServer initiativeId={init.id} />
              </Suspense>

              <Suspense fallback={<InitiativeMeetingsSkeleton />}>
                <InitiativeMeetingsServer initiativeId={init.id} />
              </Suspense>

              <Suspense fallback={<InitiativeNotesSkeleton />}>
                <NotesSectionServer
                  entityType='Initiative'
                  entityId={init.id}
                />
              </Suspense>

              <Suspense fallback={<InitiativeCheckInsSkeleton />}>
                <InitiativeCheckInsServer initiativeId={init.id} />
              </Suspense>
            </div>
          </PageMain>

          <PageSidebar>
            <Suspense fallback={<InitiativeSidebarSkeleton />}>
              <InitiativeSidebar initiativeId={init.id} />
            </Suspense>
          </PageSidebar>
        </PageContent>
      </PageContainer>
    </InitiativeDetailClient>
  )
}
