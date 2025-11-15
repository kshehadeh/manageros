'use client'

import { Button } from '@/components/ui/button'
import { OrganizationSetupCards } from '@/components/organization-setup-cards'
import { Settings } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Link } from '@/components/ui/link'

interface PendingInvitation {
  id: string
  email: string
  organizationId: string
  status: string
  expiresAt: string
  createdAt: string
  updatedAt: string
  organization: {
    id: string
    name: string
    slug: string
    description: string | null
  }
  invitedBy: {
    name: string
    email: string
  }
}

interface OrganizationSectionProps {
  organizationId: string | null
  organizationName: string | null
  pendingInvitations: PendingInvitation[]
}

export function OrganizationSection({
  organizationId,
  organizationName,
  pendingInvitations,
}: OrganizationSectionProps) {
  const router = useRouter()

  const handleInvitationAccepted = () => {
    // Refresh the page to show updated organization info
    router.refresh()
  }

  // If user has an organization, show organization info
  if (organizationId && organizationName) {
    return (
      <div className='space-y-4'>
        <div className='space-y-2'>
          <div>
            <p className='text-sm font-medium'>Organization Name</p>
            <p className='text-sm text-muted-foreground'>{organizationName}</p>
          </div>
          <div>
            <p className='text-sm font-medium'>Organization ID</p>
            <p className='text-sm text-muted-foreground font-mono text-xs'>
              {organizationId}
            </p>
          </div>
        </div>
        <div className='border-t pt-4'>
          <Button asChild variant='outline'>
            <Link
              href='/organization/settings'
              className='flex items-center gap-2'
            >
              <Settings className='w-4 h-4' />
              Go to Organization Settings
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  // If no organization, show setup cards
  return (
    <div className='space-y-4'>
      <OrganizationSetupCards
        pendingInvitations={pendingInvitations}
        onInvitationAccepted={handleInvitationAccepted}
      />
    </div>
  )
}
