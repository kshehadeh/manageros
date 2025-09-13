import { PersonForm } from '@/components/person-form'
import { getTeams, getPeople } from '@/lib/actions'
import Link from 'next/link'

export default async function NewPersonPage() {
  const [teams, people] = await Promise.all([
    getTeams(),
    getPeople(),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">New Person</h2>
        <Link href="/people" className="btn">
          Back to People
        </Link>
      </div>
      
      <PersonForm teams={teams} people={people} />
    </div>
  )
}
