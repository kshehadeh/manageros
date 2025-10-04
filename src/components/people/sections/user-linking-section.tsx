import { getServerSession } from 'next-auth'
import { authOptions, isAdmin } from '@/lib/auth'
import { UserLinkForm } from '@/components/user-link-form'
import { SectionHeader } from '@/components/ui/section-header'
import { User as UserIcon } from 'lucide-react'
import type { User } from '@prisma/client'

interface UserLinkingSectionProps {
  personId: string
  linkedUser: User | null
}

export async function UserLinkingSection({
  personId,
  linkedUser,
}: UserLinkingSectionProps) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.organizationId || !isAdmin(session.user)) {
    return null
  }

  return (
    <section>
      <SectionHeader icon={UserIcon} title='User Linking' />
      <UserLinkForm personId={personId} linkedUser={linkedUser} />
    </section>
  )
}
