'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Upload, X } from 'lucide-react'
import { FaJira, FaGithub } from 'react-icons/fa'
import { uploadAvatar, updatePersonAvatar } from '@/lib/actions/avatar'
import { useRef } from 'react'

interface PersonAvatarEditDialogProps {
  personId: string
  personName: string
  currentAvatar: string | null
  jiraAvatar?: string | null
  githubAvatar?: string | null
  isOpen: boolean
  onOpenChange: (_open: boolean) => void
  onAvatarChange?: (_avatarUrl: string | null) => void
}

export function PersonAvatarEditDialog({
  personId,
  personName,
  currentAvatar,
  jiraAvatar,
  githubAvatar,
  isOpen,
  onOpenChange,
  onAvatarChange,
}: PersonAvatarEditDialogProps) {
  const [avatar, setAvatar] = useState<string | null>(currentAvatar)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Sync local state with prop changes
  const handleAvatarChange = (avatarUrl: string | null) => {
    setAvatar(avatarUrl)
    if (onAvatarChange) {
      onAvatarChange(avatarUrl)
    }
  }

  // Get initials from name
  const getInitials = (name: string) => {
    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  // Determine avatar source and get overlay icon
  const getAvatarSourceIcon = () => {
    if (!avatar) return null

    // Check if it's a Jira avatar
    if (jiraAvatar && avatar === jiraAvatar) {
      return <FaJira className='h-3 w-3 text-orange-600' />
    }

    // Check if it's a GitHub avatar
    if (githubAvatar && avatar === githubAvatar) {
      return <FaGithub className='h-3 w-3 text-gray-800' />
    }

    // Default to upload icon
    return <Upload className='h-3 w-3 text-blue-600' />
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !personId) return

    setIsUploading(true)
    setError(null)

    try {
      // Create FormData and upload
      const formData = new FormData()
      formData.append('file', file)

      const avatarUrl = await uploadAvatar(formData, personId)
      await updatePersonAvatar(personId, avatarUrl)

      handleAvatarChange(avatarUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload avatar')
    } finally {
      setIsUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleUseLinkedAvatar = async (avatarUrl: string) => {
    if (!personId) return

    setIsUploading(true)
    setError(null)

    try {
      await updatePersonAvatar(personId, avatarUrl)
      handleAvatarChange(avatarUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update avatar')
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveAvatar = async () => {
    if (!personId) return

    setIsUploading(true)
    setError(null)

    try {
      await updatePersonAvatar(personId, null)
      handleAvatarChange(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove avatar')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Person Avatar</DialogTitle>
          <DialogDescription>
            Upload a new avatar for {personName} or use a linked account avatar.
          </DialogDescription>
        </DialogHeader>
        <div className='py-4'>
          <div className='space-y-4'>
            {/* Current Avatar Display */}
            <div className='flex items-center gap-4'>
              <div className='relative'>
                <Avatar className='h-20 w-20 shrink-0'>
                  {avatar && <AvatarImage src={avatar} alt={personName} />}
                  <AvatarFallback className='text-lg'>
                    {getInitials(personName)}
                  </AvatarFallback>
                </Avatar>
                {/* Avatar source overlay icon */}
                {avatar && (
                  <div className='absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-sm border border-gray-200'>
                    {getAvatarSourceIcon()}
                  </div>
                )}
              </div>
              <div className='flex-1'>
                <h3 className='font-medium'>{personName}</h3>
                <p className='text-sm text-muted-foreground'>
                  {avatar ? 'Current avatar' : 'No avatar set'}
                </p>
              </div>
            </div>

            {/* Avatar Options */}
            <div className='space-y-3'>
              <h4 className='font-medium text-sm'>Choose Avatar Source</h4>

              {/* Upload from computer */}
              <div>
                <input
                  ref={fileInputRef}
                  type='file'
                  accept='image/jpeg,image/png,image/gif,image/webp'
                  onChange={handleFileSelect}
                  className='hidden'
                  id='person-avatar-upload'
                />
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className='w-full justify-start'
                >
                  <Upload className='h-4 w-4 mr-2' />
                  {isUploading ? 'Uploading...' : 'Upload from Computer'}
                </Button>
                <p className='text-xs text-muted-foreground mt-1'>
                  Max 5MB. Supported: JPEG, PNG, GIF, WebP
                </p>
              </div>

              {/* Use Jira avatar */}
              {jiraAvatar && (
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => handleUseLinkedAvatar(jiraAvatar)}
                  disabled={isUploading}
                  className='w-full justify-start'
                >
                  <FaJira className='h-4 w-4 mr-2 text-orange-600' />
                  Use Jira Avatar
                </Button>
              )}

              {/* Use GitHub avatar */}
              {githubAvatar && (
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => handleUseLinkedAvatar(githubAvatar)}
                  disabled={isUploading}
                  className='w-full justify-start'
                >
                  <FaGithub className='h-4 w-4 mr-2 text-gray-800' />
                  Use GitHub Avatar
                </Button>
              )}

              {!jiraAvatar && !githubAvatar && (
                <p className='text-xs text-muted-foreground'>
                  Link Jira or GitHub accounts to use their avatars
                </p>
              )}

              {/* Remove Avatar */}
              {avatar && (
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={handleRemoveAvatar}
                  disabled={isUploading}
                  className='w-full justify-start'
                >
                  <X className='h-4 w-4 mr-2' />
                  Remove Avatar
                </Button>
              )}
            </div>

            {/* Error Display */}
            {error && (
              <div className='text-sm text-red-600 bg-red-50 p-2 rounded'>
                {error}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
