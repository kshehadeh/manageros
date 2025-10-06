'use client'

import { useState, useRef, useEffect } from 'react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import {
  uploadTeamAvatar,
  updateTeamAvatar,
} from '@/lib/actions/avatar'

interface TeamAvatarEditorProps {
  teamId?: string
  teamName: string
  currentAvatar?: string | null
  onAvatarChange?: (_avatarUrl: string | null) => void
}

export function TeamAvatarEditor({
  teamId,
  teamName,
  currentAvatar,
  onAvatarChange,
}: TeamAvatarEditorProps) {
  const [avatar, setAvatar] = useState<string | null>(currentAvatar || null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showOptions, setShowOptions] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Sync local state with prop changes
  useEffect(() => {
    setAvatar(currentAvatar || null)
  }, [currentAvatar])

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

      setAvatar(avatarUrl)
      if (onAvatarChange) {
        onAvatarChange(avatarUrl)
      }
      setShowOptions(false)
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
      setAvatar(null)
      if (onAvatarChange) {
        onAvatarChange(null)
      }
      setShowOptions(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove avatar')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className='space-y-3'>
      <div className='flex items-start sm:items-center gap-3'>
        <div className='relative'>
          <Avatar className='h-16 w-16 sm:h-20 sm:w-20 flex-shrink-0'>
            {avatar && <AvatarImage src={avatar} alt={teamName} />}
            <AvatarFallback className='text-sm sm:text-lg'>
              {getInitials(teamName)}
            </AvatarFallback>
          </Avatar>
          {/* Avatar source overlay icon */}
          {avatar && (
            <div className='absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-sm border border-gray-200'>
              <Upload className='h-3 w-3 text-blue-600' />
            </div>
          )}
        </div>

        <div className='flex-1'>
          <div className='flex flex-col gap-2'>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={() => setShowOptions(!showOptions)}
              disabled={isUploading || !teamId}
              className='w-full sm:w-auto'
            >
              <ImageIcon className='h-4 w-4 mr-2' />
              {avatar ? 'Change Avatar' : 'Add Avatar'}
            </Button>

            {avatar && teamId && (
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={handleRemoveAvatar}
                disabled={isUploading}
                className='w-full sm:w-auto'
              >
                <X className='h-4 w-4 mr-2' />
                Remove
              </Button>
            )}
          </div>

          {!teamId && (
            <p className='text-sm text-muted-foreground mt-2'>
              Save the team first to upload an avatar
            </p>
          )}
        </div>
      </div>

      {error && (
        <div className='text-sm text-red-600 bg-red-50 p-2 rounded'>
          {error}
        </div>
      )}

      {showOptions && teamId && (
        <div className='border rounded-lg p-3 space-y-2'>
          <h4 className='font-medium text-sm'>Upload Avatar</h4>

          <div className='space-y-2'>
            {/* Upload from computer */}
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
          </div>

          <Button
            type='button'
            variant='ghost'
            size='sm'
            onClick={() => setShowOptions(false)}
            className='w-full'
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  )
}
