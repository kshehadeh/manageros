import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getPeopleHierarchy } from '@/lib/actions'
import { PeoplePageClient } from '@/components/people-page-client'

export default async function PeoplePage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/signin')
  }

  const people = await getPeopleHierarchy()

  return <PeoplePageClient people={people} />
}
