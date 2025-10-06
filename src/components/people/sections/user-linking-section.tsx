import { UserLinkForm } from '@/components/user-link-form'
import { SectionHeader } from '@/components/ui/section-header'
import { User as UserIcon } from 'lucide-react'
import type { User } from '@prisma/client'

interface UserLinkingSectionProps {
  personId: string
  linkedUser: User | null
}

export function UserLinkingSection({
  personId,
  linkedUser,
}: UserLinkingSectionProps) {
  return (
    <section>
      <SectionHeader icon={UserIcon} title='User Linking' />
      <UserLinkForm personId={personId} linkedUser={linkedUser} />
    </section>
  )
}
