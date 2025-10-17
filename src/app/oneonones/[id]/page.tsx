import { getOneOnOneById } from '@/lib/actions/oneonone'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import { ReadonlyNotesField } from '@/components/readonly-notes-field'
import { OneOnOneDetailClient } from '@/components/oneonone-detail-client'
import { EditIconButton } from '@/components/edit-icon-button'
import { MessageCircle, Info, StickyNote } from 'lucide-react'
import { SectionHeader } from '@/components/ui/section-header'
import { PersonListItem } from '@/components/people/person-list-item'

interface OneOnOneViewPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function OneOnOneViewPage({
  params,
}: OneOnOneViewPageProps) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/signin')
  }

  const { id } = await params

  try {
    const oneOnOne = await getOneOnOneById(id)

    return (
      <OneOnOneDetailClient
        managerName={oneOnOne.manager.name}
        reportName={oneOnOne.report.name}
        oneOnOneId={oneOnOne.id}
      >
        <div className='space-y-6'>
          {/* Header - Full Width */}
          <div className='px-4 lg:px-6'>
            <div className='page-header'>
              <div className='flex items-start justify-between'>
                <div className='flex-1'>
                  <div className='flex items-center gap-3 mb-2'>
                    <MessageCircle className='h-6 w-6 text-muted-foreground' />
                    <h1 className='page-title'>1:1 Meeting</h1>
                  </div>
                  <p className='page-subtitle'>
                    Meeting between {oneOnOne.manager.name} and{' '}
                    {oneOnOne.report.name}
                  </p>
                </div>
                <EditIconButton
                  href={`/oneonones/${oneOnOne.id}/edit`}
                  variant='outline'
                  size='default'
                />
              </div>
            </div>
          </div>

          {/* Main Content and Sidebar */}
          <div className='flex flex-col lg:flex-row gap-6 px-4 lg:px-6'>
            {/* Main Content */}
            <div className='flex-1 min-w-0'>
              <div className='space-y-6'>
                {/* Meeting Notes */}
                <div className='page-section'>
                  <SectionHeader icon={StickyNote} title='Meeting Notes' />
                  <div className='text-sm text-neutral-400'>
                    {oneOnOne.notes ? (
                      <ReadonlyNotesField
                        content={oneOnOne.notes}
                        variant='default'
                        emptyStateText='No notes recorded yet'
                      />
                    ) : (
                      <div className='text-center py-8 text-neutral-500'>
                        No notes recorded yet
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className='w-full lg:w-80 lg:flex-shrink-0'>
              <div className='page-section'>
                <SectionHeader icon={Info} title='Meeting Details' />
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
              </div>
            </div>
          </div>
        </div>
      </OneOnOneDetailClient>
    )
  } catch (error) {
    console.error('Error loading one-on-one:', error)
    notFound()
  }
}
