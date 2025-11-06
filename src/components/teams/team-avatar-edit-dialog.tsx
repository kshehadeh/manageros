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
import { uploadTeamAvatar, updateTeamAvatar } from '@/lib/actions/avatar'
import { useRef } from 'react'

interface TeamAvatarEditDialogProps {
  teamId: string
  teamName: string
  currentAvatar: string | null
  isOpen: boolean
  onOpenChange: (_open: boolean) => void
  onAvatarChange?: (_avatarUrl: string | null) => void
}

export function TeamAvatarEditDialog({
  teamId,
  teamName,
  currentAvatar,
  isOpen,
  onOpenChange,
  onAvatarChange,
}: TeamAvatarEditDialogProps) {
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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !teamId) return

    setIsUploading(true)
    setError(null)

    try {
      // Create FormData and upload
      const formData = new FormData()
      formData.append('file', file)

      const avatarUrl = await uploadTeamAvatar(formData, teamId)
      await updateTeamAvatar(teamId, avatarUrl)

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

  const handleRemoveAvatar = async () => {
    if (!teamId) return

    setIsUploading(true)
    setError(null)

    try {
      await updateTeamAvatar(teamId, null)
      handleAvatarChange(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove avatar')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Edit Team Avatar</DialogTitle>
          <DialogDescription>
            Upload a new avatar for {teamName} or remove the current one.
          </DialogDescription>
        </DialogHeader>
        <div className='py-4'>
          <div className='space-y-4'>
            {/* Current Avatar Display */}
            <div className='flex items-center gap-4'>
              <Avatar className='h-20 w-20 shrink-0'>
                {avatar && <AvatarImage src={avatar} alt={teamName} />}
                <AvatarFallback className='text-lg'>
                  {getInitials(teamName)}
                </AvatarFallback>
              </Avatar>
              <div className='flex-1'>
                <h3 className='font-medium'>{teamName}</h3>
                <p className='text-sm text-muted-foreground'>
                  {avatar ? 'Current avatar' : 'No avatar set'}
                </p>
              </div>
            </div>

            {/* Upload Options */}
            <div className='space-y-3'>
              <div>
                <input
                  ref={fileInputRef}
                  type='file'
                  accept='image/jpeg,image/png,image/gif,image/webp'
                  onChange={handleFileSelect}
                  className='hidden'
                  id='team-avatar-upload'
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
