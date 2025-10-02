import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { PersonSynopsisList } from '@/components/people/person-synopsis-list'
import { SynopsesBreadcrumbClient } from '@/components/synopses-breadcrumb-client'
import { canAccessSynopsesForPerson } from '@/lib/auth-utils'

interface PersonSynopsesPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function PersonSynopsesPage({
  params,
}: PersonSynopsesPageProps) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/signin')
  }

  const { id } = await params

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
          <PersonSynopsisList personId={person.id} canGenerate={canAccess} />
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
