'use client'

import { useState, useEffect } from 'react'
import { ClickablePersonAvatar } from './clickable-person-avatar'
import { PersonAvatarEditDialog } from './person-avatar-edit-dialog'

interface PersonEditHeaderProps {
  personId: string
  personName: string
  currentAvatar: string | null
  jiraAvatar?: string | null
  githubAvatar?: string | null
  onAvatarChange?: (avatarUrl: string | null) => void
}

export function PersonEditHeader({
  personId,
  personName,
  currentAvatar,
  jiraAvatar,
  githubAvatar,
  onAvatarChange,
}: PersonEditHeaderProps) {
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
        <ClickablePersonAvatar
          name={personName}
          avatar={avatar}
          size='lg'
          isAdmin={true}
          onClick={handleAvatarClick}
        />
        <h2 className='text-lg font-semibold'>Edit {personName}</h2>
      </div>

      <PersonAvatarEditDialog
        personId={personId}
        personName={personName}
        currentAvatar={avatar}
        jiraAvatar={jiraAvatar}
        githubAvatar={githubAvatar}
        isOpen={isAvatarDialogOpen}
        onOpenChange={setIsAvatarDialogOpen}
        onAvatarChange={handleAvatarChange}
      />
    </>
  )
}
