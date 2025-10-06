import { getPeopleHierarchy } from '@/lib/actions/person'
import { PeoplePageClient } from '@/components/people/people-page-client'
import { requireAuth } from '@/lib/auth-utils'

export default async function PeoplePage() {
  await requireAuth({ requireOrganization: true })

  const people = await getPeopleHierarchy()

  return <PeoplePageClient people={people} />
}
