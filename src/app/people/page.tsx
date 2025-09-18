import { redirect } from 'next/navigation'
import { getPeopleHierarchy } from '@/lib/actions'
import { PeoplePageClient } from '@/components/people-page-client'
import { getCurrentUser } from '@/lib/auth-utils'

export default async function PeoplePage() {
  try {
    await getCurrentUser()
  } catch {
    redirect('/auth/signin')
  }

  const people = await getPeopleHierarchy()

  return <PeoplePageClient people={people} />
}
