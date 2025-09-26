import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { PersonSynopsisList } from '@/components/person-synopsis-list'
import { SynopsesBreadcrumbClient } from '@/components/synopses-breadcrumb-client'

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

  return (
    <SynopsesBreadcrumbClient personName={person.name} personId={person.id}>
      <div className='page-container'>
        <div className='page-header'>
          <h1 className='page-title'>Synopses for {person.name}</h1>
        </div>

        <PersonSynopsisList personId={person.id} />
      </div>
    </SynopsesBreadcrumbClient>
  )
}
