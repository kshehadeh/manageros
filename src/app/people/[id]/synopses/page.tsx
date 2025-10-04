import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { SynopsesBreadcrumbClient } from '@/components/synopses-breadcrumb-client'
import { canAccessSynopsesForPerson } from '@/lib/auth-utils'
import { SynopsisCard } from '@/components/synopsis-card'
import { SynopsesPageClient } from '@/components/synopses-page-client'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

interface PersonSynopsesPageProps {
  params: Promise<{
    id: string
  }>
  searchParams: Promise<{
    page?: string
  }>
}

const SYNOPSES_PER_PAGE = 12

async function SynopsesList({
  personId,
  personName,
  canGenerate,
  page = 1,
}: {
  personId: string
  personName: string
  canGenerate: boolean
  page: number
}) {
  const skip = (page - 1) * SYNOPSES_PER_PAGE

  const [synopses, totalCount] = await Promise.all([
    prisma.personSynopsis.findMany({
      where: { personId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: SYNOPSES_PER_PAGE,
    }),
    prisma.personSynopsis.count({
      where: { personId },
    }),
  ])

  const totalPages = Math.ceil(totalCount / SYNOPSES_PER_PAGE)
  const hasNextPage = page < totalPages
  const hasPrevPage = page > 1

  return (
    <div className='space-y-6'>
      {/* Header with count and generate button */}
      <SynopsesPageClient
        personId={personId}
        personName={personName}
        canGenerate={canGenerate}
      >
        {totalCount} synopsis{totalCount !== 1 ? 'es' : ''} found
      </SynopsesPageClient>

      {/* Synopses Grid */}
      {synopses.length === 0 ? (
        <div className='text-center py-12'>
          <div className='text-lg font-medium mb-2'>No synopses yet</div>
          <div className='text-sm text-muted-foreground mb-4'>
            {canGenerate
              ? 'Generate your first synopsis to get started'
              : 'No synopses have been generated yet'}
          </div>
          {canGenerate && (
            <SynopsesPageClient
              personId={personId}
              personName={personName}
              canGenerate={canGenerate}
            >
              <Button>
                <Plus className='w-4 h-4 mr-2' />
                Generate Synopsis
              </Button>
            </SynopsesPageClient>
          )}
        </div>
      ) : (
        <>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {synopses.map(synopsis => (
              <SynopsisCard
                key={synopsis.id}
                synopsis={{
                  id: synopsis.id,
                  content: synopsis.content,
                  createdAt: synopsis.createdAt.toISOString(),
                  fromDate: synopsis.fromDate.toISOString(),
                  toDate: synopsis.toDate.toISOString(),
                  includeFeedback: synopsis.includeFeedback,
                  sources: synopsis.sources,
                }}
                personId={personId}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className='flex items-center justify-center gap-2'>
              {hasPrevPage && (
                <Button variant='outline' asChild>
                  <Link href={`/people/${personId}/synopses?page=${page - 1}`}>
                    Previous
                  </Link>
                </Button>
              )}

              <div className='flex items-center gap-1'>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum =
                    Math.max(1, Math.min(totalPages - 4, page - 2)) + i
                  if (pageNum > totalPages) return null

                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === page ? 'default' : 'outline'}
                      size='sm'
                      asChild
                    >
                      <Link
                        href={`/people/${personId}/synopses?page=${pageNum}`}
                      >
                        {pageNum}
                      </Link>
                    </Button>
                  )
                })}
              </div>

              {hasNextPage && (
                <Button variant='outline' asChild>
                  <Link href={`/people/${personId}/synopses?page=${page + 1}`}>
                    Next
                  </Link>
                </Button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function SynopsesListSkeleton() {
  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <Skeleton className='h-4 w-32' />
        <Skeleton className='h-10 w-40' />
      </div>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className='h-48 w-full' />
        ))}
      </div>
    </div>
  )
}

export default async function PersonSynopsesPage({
  params,
  searchParams,
}: PersonSynopsesPageProps) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/signin')
  }

  const { id } = await params
  const { page: pageParam } = await searchParams
  const page = pageParam ? parseInt(pageParam, 10) : 1

  if (!session.user.organizationId) {
    redirect('/organization/create')
  }

  const person = await prisma.person.findFirst({
    where: {
      id,
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

  return (
    <SynopsesBreadcrumbClient personName={person.name} personId={person.id}>
      <div className='page-container'>
        <div className='page-header'>
          <h1 className='page-title'>Synopses for {person.name}</h1>
        </div>

        {canAccess ? (
          <Suspense fallback={<SynopsesListSkeleton />}>
            <SynopsesList
              personId={person.id}
              personName={person.name}
              canGenerate={canAccess}
              page={page}
            />
          </Suspense>
        ) : (
          <div className='text-center py-12'>
            <div className='text-lg font-medium mb-2'>Access Denied</div>
            <div className='text-sm text-muted-foreground'>
              You can only view synopses for your own linked person or you must
              be an organization administrator.
            </div>
          </div>
        )}
      </div>
    </SynopsesBreadcrumbClient>
  )
}
