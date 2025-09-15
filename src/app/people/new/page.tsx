import { PersonForm } from '@/components/person-form'
import { getTeams, getPeople } from '@/lib/actions'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

interface NewPersonPageProps {
  searchParams: Promise<{
    managerId?: string
  }>
}

export default async function NewPersonPage ({ searchParams }: NewPersonPageProps) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    redirect('/auth/signin')
  }

  const params = await searchParams
  const managerId = params.managerId

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
      
      <PersonForm teams={teams} people={people} initialManagerId={managerId} />
    </div>
  )
}
