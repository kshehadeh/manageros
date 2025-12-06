import { Link } from '@/components/ui/link'
import { Button } from '@/components/ui/button'
import { FileText, Plus } from 'lucide-react'
import { PageSection } from '@/components/ui/page-section'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { getCurrentUser } from '@/lib/auth-utils'
import { getStandaloneNotes } from '@/lib/actions/notes'
import { NotesList } from '@/components/notes/notes-list'

export default async function NotesPage() {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId) {
    return (
      <PageContainer>
        <PageHeader
          title='Notes'
          titleIcon={FileText}
          subtitle='Your personal notes and documents'
        />
        <PageContent>
          <PageSection>
            <p className='text-muted-foreground'>
              You must belong to an organization to view notes.
            </p>
          </PageSection>
        </PageContent>
      </PageContainer>
    )
  }

  const notes = await getStandaloneNotes()

  return (
    <PageContainer>
      <PageHeader
        title='Notes'
        titleIcon={FileText}
        subtitle='Your personal notes and documents'
        actions={
          <Button asChild className='flex items-center gap-md'>
            <Link href='/notes/new'>
              <Plus className='h-4 w-4' />
              New Note
            </Link>
          </Button>
        }
      />
      <PageContent>
        <PageSection>
          <NotesList notes={notes} />
        </PageSection>
      </PageContent>
    </PageContainer>
  )
}
