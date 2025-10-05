'use client'

import { useState } from 'react'
import { ClickablePersonAvatar } from './clickable-person-avatar'
import { PersonAvatarEditDialog } from './person-avatar-edit-dialog'

interface PersonAvatarWrapperProps {
  personId: string
  personName: string
  currentAvatar: string | null
  jiraAvatar?: string | null
  githubAvatar?: string | null
  isAdmin: boolean
}

export function PersonAvatarWrapper({
  personId,
  personName,
  currentAvatar,
  jiraAvatar,
  githubAvatar,
  isAdmin,
}: PersonAvatarWrapperProps) {
  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false)
  const [avatar, setAvatar] = useState<string | null>(currentAvatar)

  const handleAvatarClick = () => {
    if (isAdmin) {
      setIsAvatarDialogOpen(true)
    }
  }

  const handleAvatarChange = (avatarUrl: string | null) => {
    setAvatar(avatarUrl)
  }

  return (
    <>
      <ClickablePersonAvatar
        name={personName}
        avatar={avatar}
        size='lg'
        isAdmin={isAdmin}
        onClick={handleAvatarClick}
      />
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
