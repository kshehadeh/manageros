import { getPeopleHierarchy } from '@/lib/actions'
import { PeoplePageClient } from '@/components/people-page-client'
import { requireAuth } from '@/lib/auth-utils'

export default async function PeoplePage() {
  await requireAuth({ requireOrganization: true })

  const people = await getPeopleHierarchy()

  return <PeoplePageClient people={people} />
}
