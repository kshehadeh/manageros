import { PersonForm } from '@/components/person-form'
import { getTeams, getPeople, getPerson } from '@/lib/actions'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

interface EditPersonPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditPersonPage({ params }: EditPersonPageProps) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/signin')
  }

  const { id } = await params
  const [teams, people, person] = await Promise.all([
    getTeams(),
    getPeople(),
    getPerson(id),
  ])

  if (!person) {
    notFound()
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h2 className='text-lg font-semibold'>Edit {person.name}</h2>
        <Link href='/people' className='btn'>
          Back to People
        </Link>
      </div>

      <PersonForm teams={teams} people={people} person={person} />
    </div>
  )
}
