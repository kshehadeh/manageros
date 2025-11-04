import { getPeopleHierarchy } from '@/lib/actions/person'
import { PeopleChartClient } from '@/components/people/people-chart-client'

export default async function PeopleChartPage() {
  const people = await getPeopleHierarchy()

  return <PeopleChartClient people={people} />
}
