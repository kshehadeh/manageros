import { redirect } from 'next/navigation'
import { getPeopleHierarchy } from '@/lib/actions/person'
import { PeopleChartClient } from '@/components/people/people-chart-client'
import { getCurrentUser } from '@/lib/auth-utils'

export default async function PeopleChartPage() {
  try {
    await getCurrentUser()
  } catch {
    redirect('/auth/signin')
  }

  const people = await getPeopleHierarchy()

  return <PeopleChartClient people={people} />
}
