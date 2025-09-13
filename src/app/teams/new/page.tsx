import { TeamForm } from '@/components/team-form'
import Link from 'next/link'

export default async function NewTeamPage() {
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
