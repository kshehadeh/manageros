import { getPeopleHierarchy } from '@/lib/actions/person'
import { PeopleChartClient } from '@/components/people/people-chart-client'
import { Suspense } from 'react'
import { RequireAuthServer } from '@/components/auth/require-auth-server'

async function PeopleChartPageContent() {
  const people = await getPeopleHierarchy()

  return <PeopleChartClient people={people} />
}

export default function PeopleChartPage() {
  return (
    <Suspense fallback={<div className='page-container'>Loading...</div>}>
      <RequireAuthServer requireOrganization={true}>
        <PeopleChartPageContent />
      </RequireAuthServer>
    </Suspense>
  )
}
