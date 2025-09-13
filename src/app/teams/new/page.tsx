import { TeamForm } from '@/components/team-form'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function NewTeamPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    redirect('/auth/signin')
  }
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">New Team</h2>
        <Link href="/teams" className="btn">
          Back to Teams
        </Link>
      </div>
      
      <TeamForm />
    </div>
  )
}
