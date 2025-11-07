import { getOneOnOneById } from '@/lib/actions/oneonone'
import { notFound } from 'next/navigation'
import { ReadonlyNotesField } from '@/components/readonly-notes-field'
import { OneOnOneDetailClient } from '@/components/oneonone-detail-client'
import { OneOnOneActionsDropdown } from '@/components/oneonones/oneonone-actions-dropdown'
import { MessageCircle, Info, StickyNote } from 'lucide-react'
import { SectionHeader } from '@/components/ui/section-header'
import { PageSection } from '@/components/ui/page-section'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { PageMain } from '@/components/ui/page-main'
import { PageSidebar } from '@/components/ui/page-sidebar'
import { PersonListItem } from '@/components/people/person-list-item'

interface OneOnOneViewPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function OneOnOneViewPage({
  params,
}: OneOnOneViewPageProps) {
  const { id } = await params

  try {
    const oneOnOne = await getOneOnOneById(id)

    return (
      <OneOnOneDetailClient
        managerName={oneOnOne.manager.name}
        reportName={oneOnOne.report.name}
        oneOnOneId={oneOnOne.id}
      >
        <PageContainer>
          <PageHeader
            title='1:1 Meeting'
            titleIcon={MessageCircle}
            subtitle={`Meeting between ${oneOnOne.manager.name} and ${oneOnOne.report.name}`}
            actions={<OneOnOneActionsDropdown oneOnOneId={oneOnOne.id} />}
          />

          <PageContent>
            <PageMain>
              <div className='space-y-6'>
                {/* Meeting Notes */}
                <PageSection
                  header={
                    <SectionHeader icon={StickyNote} title='Meeting Notes' />
                  }
                >
                  <div className='text-sm text-neutral-400'>
                    {oneOnOne.notes ? (
                      <ReadonlyNotesField
                        content={oneOnOne.notes}
                        variant='default'
                        emptyStateText='No notes recorded yet'
                        truncateMode={true}
                        maxHeight='200px'
                      />
                    ) : (
                      <div className='text-center py-8 text-neutral-500'>
                        No notes recorded yet
                      </div>
                    )}
                  </div>
                </PageSection>
              </div>
            </PageMain>

            <PageSidebar>
              <PageSection
                header={<SectionHeader icon={Info} title='Meeting Details' />}
              >
                <div className='space-y-4'>
                  <div>
                    <h4 className='text-sm font-medium mb-2'>Participant 1</h4>
                    <PersonListItem
                      person={{
                        id: oneOnOne.manager.id,
                        name: oneOnOne.manager.name,
                        email: oneOnOne.manager.email,
                        avatar: oneOnOne.manager.avatar,
                        role: oneOnOne.manager.role,
                      }}
                      showRole={true}
                      showEmail={true}
                    />
                  </div>

                  <div>
                    <h4 className='text-sm font-medium mb-2'>Participant 2</h4>
                    <PersonListItem
                      person={{
                        id: oneOnOne.report.id,
                        name: oneOnOne.report.name,
                        email: oneOnOne.report.email,
                        avatar: oneOnOne.report.avatar,
                        role: oneOnOne.report.role,
                      }}
                      showRole={true}
                      showEmail={true}
                    />
                  </div>

                  <div className='pt-2 border-t border-muted'>
                    <span className='text-sm font-medium'>Scheduled Date:</span>
                    <div className='text-sm text-neutral-400 mt-1'>
                      {oneOnOne.scheduledAt
                        ? new Date(oneOnOne.scheduledAt).toLocaleString()
                        : 'Not scheduled'}
                    </div>
                  </div>
                </div>
              </PageSection>
            </PageSidebar>
          </PageContent>
        </PageContainer>
      </OneOnOneDetailClient>
    )
  } catch (error) {
    console.error('Error loading one-on-one:', error)
    notFound()
  }
}
