import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { SynopsisDetailBreadcrumbClient } from '@/components/synopsis-detail-breadcrumb-client'
import { canAccessSynopsesForPerson } from '@/lib/auth-utils'
import { ReadonlyNotesField } from '@/components/readonly-notes-field'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Calendar, Clock } from 'lucide-react'
import Link from 'next/link'

interface SynopsisDetailPageProps {
  params: Promise<{
    id: string
    synopsisId: string
  }>
}

export default async function SynopsisDetailPage({
  params,
}: SynopsisDetailPageProps) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/signin')
  }

  const { id: personId, synopsisId } = await params

  if (!session.user.organizationId) {
    redirect('/organization/create')
  }

  const person = await prisma.person.findFirst({
    where: {
      id: personId,
      organizationId: session.user.organizationId,
    },
    select: {
      id: true,
      name: true,
    },
  })

  if (!person) {
    notFound()
  }

  // Check if user can access synopses for this person
  const canAccess = await canAccessSynopsesForPerson(person.id)

  if (!canAccess) {
    return (
      <SynopsisDetailBreadcrumbClient
        personName={person.name}
        personId={person.id}
        synopsisId={synopsisId}
      >
        <div className='page-container'>
          <div className='text-center py-12'>
            <div className='text-lg font-medium mb-2'>Access Denied</div>
            <div className='text-sm text-muted-foreground'>
              You can only view synopses for your own linked person or you must
              be an organization administrator.
            </div>
          </div>
        </div>
      </SynopsisDetailBreadcrumbClient>
    )
  }

  const synopsis = await prisma.personSynopsis.findFirst({
    where: {
      id: synopsisId,
      personId: person.id,
    },
  })

  if (!synopsis) {
    notFound()
  }

  return (
    <SynopsisDetailBreadcrumbClient
      personName={person.name}
      personId={person.id}
      synopsisId={synopsisId}
    >
      <div className='page-container'>
        <div className='page-header'>
          <div className='flex items-center gap-4 mb-4'>
            <Button variant='outline' size='sm' asChild>
              <Link href={`/people/${person.id}/synopses`}>
                <ArrowLeft className='w-4 h-4 mr-2' />
                Back to Synopses
              </Link>
            </Button>
          </div>
          <h1 className='page-title'>Synopsis for {person.name}</h1>
        </div>

        <div className='page-section'>
          <div className='card max-w-4xl'>
            <div className='space-y-6'>
              {/* Synopsis Metadata */}
              <div className='space-y-4'>
                <div className='flex items-center gap-4 text-sm text-muted-foreground'>
                  <div className='flex items-center gap-1'>
                    <Calendar className='w-4 h-4' />
                    Generated{' '}
                    {new Date(synopsis.createdAt).toLocaleDateString()}
                  </div>
                  <div className='flex items-center gap-1'>
                    <Clock className='w-4 h-4' />
                    Period: {new Date(
                      synopsis.fromDate
                    ).toLocaleDateString()} -{' '}
                    {new Date(synopsis.toDate).toLocaleDateString()}
                  </div>
                </div>

                {synopsis.includeFeedback && (
                  <div className='text-sm text-muted-foreground'>
                    Includes feedback and campaign responses
                  </div>
                )}

                <div className='text-sm text-muted-foreground'>
                  Sources: {synopsis.sources.join(', ')}
                </div>
              </div>

              {/* Synopsis Content */}
              <div className='border-t pt-6'>
                <ReadonlyNotesField
                  content={synopsis.content}
                  variant='detailed'
                  emptyStateText='No synopsis content available'
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </SynopsisDetailBreadcrumbClient>
  )
}
