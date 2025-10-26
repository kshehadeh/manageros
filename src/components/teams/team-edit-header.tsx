'use client'

import { useState, useEffect } from 'react'
import { ClickableTeamAvatar } from './clickable-team-avatar'
import { TeamAvatarEditDialog } from './team-avatar-edit-dialog'

interface TeamEditHeaderProps {
  teamId: string
  teamName: string
  currentAvatar: string | null
  onAvatarChange?: (avatarUrl: string | null) => void
}

export function TeamEditHeader({
  teamId,
  teamName,
  currentAvatar,
  onAvatarChange,
}: TeamEditHeaderProps) {
  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false)
  const [avatar, setAvatar] = useState<string | null>(currentAvatar)

  // Sync local state with prop changes
  useEffect(() => {
    setAvatar(currentAvatar)
  }, [currentAvatar])

  const handleAvatarClick = () => {
    setIsAvatarDialogOpen(true)
  }

  const handleAvatarChange = (avatarUrl: string | null) => {
    setAvatar(avatarUrl)
    if (onAvatarChange) {
      onAvatarChange(avatarUrl)
    }
  }

  return (
    <>
      <div className='flex items-center gap-3'>
        <ClickableTeamAvatar
          name={teamName}
          avatar={avatar}
          size='lg'
          isAdmin={true}
          onClick={handleAvatarClick}
        />
        <h2 className='text-lg font-semibold'>Edit {teamName}</h2>
      </div>

      <TeamAvatarEditDialog
        teamId={teamId}
        teamName={teamName}
        currentAvatar={avatar}
        isOpen={isAvatarDialogOpen}
        onOpenChange={setIsAvatarDialogOpen}
        onAvatarChange={handleAvatarChange}
      />
    </>
  )
}
