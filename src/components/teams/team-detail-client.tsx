'use client'

import { useState } from 'react'
import { usePageBreadcrumbs } from '@/lib/hooks/use-breadcrumb'
import { TeamAvatarEditDialog } from './team-avatar-edit-dialog'

interface TeamDetailClientProps {
  teamName: string
  teamId: string
  teamAvatar: string | null
  isAdmin: boolean
  children: React.ReactNode
}

export function TeamDetailClient({
  teamName,
  teamId,
  teamAvatar,
  children,
}: TeamDetailClientProps) {
  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false)
  const [currentAvatar, setCurrentAvatar] = useState<string | null>(teamAvatar)

  usePageBreadcrumbs([
    { name: 'Teams', href: '/teams' },
    { name: teamName, href: `/teams/${teamId}` },
  ])

  const handleAvatarChange = (avatarUrl: string | null) => {
    setCurrentAvatar(avatarUrl)
  }

  return (
    <>
      {children}
      <TeamAvatarEditDialog
        teamId={teamId}
        teamName={teamName}
        currentAvatar={currentAvatar}
        isOpen={isAvatarDialogOpen}
        onOpenChange={setIsAvatarDialogOpen}
        onAvatarChange={handleAvatarChange}
      />
    </>
  )
}
