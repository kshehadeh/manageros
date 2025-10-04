'use client'

import { useState, useRef } from 'react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import { uploadAvatar, updatePersonAvatar } from '@/lib/actions'

interface AvatarEditorProps {
  personId?: string
  personName: string
  currentAvatar?: string | null
  jiraAvatar?: string | null
  githubAvatar?: string | null
  onAvatarChange?: (avatarUrl: string | null) => void
}

export function AvatarEditor({
  personId,
  personName,
  currentAvatar,
  jiraAvatar,
  githubAvatar,
  onAvatarChange,
}: AvatarEditorProps) {
  const [avatar, setAvatar] = useState<string | null>(currentAvatar || null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showOptions, setShowOptions] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    if (!file || !personId) return

    setIsUploading(true)
    setError(null)

    try {
      // Create FormData and upload
      const formData = new FormData()
      formData.append('file', file)

      const avatarUrl = await uploadAvatar(formData, personId)
      await updatePersonAvatar(personId, avatarUrl)

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

  const handleUseLinkedAvatar = async (avatarUrl: string) => {
    if (!personId) return

    setIsUploading(true)
    setError(null)

    try {
      await updatePersonAvatar(personId, avatarUrl)
      setAvatar(avatarUrl)
      if (onAvatarChange) {
        onAvatarChange(avatarUrl)
      }
      setShowOptions(false)
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
    <div className='space-y-4'>
      <div className='flex items-center gap-4'>
        <Avatar className='h-20 w-20'>
          {avatar ? (
            <AvatarImage src={avatar} alt={personName} />
          ) : null}
          <AvatarFallback className='text-lg'>
            {getInitials(personName)}
          </AvatarFallback>
        </Avatar>

        <div className='flex-1'>
          <div className='flex gap-2'>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={() => setShowOptions(!showOptions)}
              disabled={isUploading || !personId}
            >
              <ImageIcon className='h-4 w-4 mr-2' />
              {avatar ? 'Change Avatar' : 'Add Avatar'}
            </Button>

            {avatar && personId && (
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={handleRemoveAvatar}
                disabled={isUploading}
              >
                <X className='h-4 w-4 mr-2' />
                Remove
              </Button>
            )}
          </div>

          {!personId && (
            <p className='text-sm text-muted-foreground mt-2'>
              Save the person first to upload an avatar
            </p>
          )}
        </div>
      </div>

      {error && (
        <div className='text-sm text-red-600 bg-red-50 p-2 rounded'>
          {error}
        </div>
      )}

      {showOptions && personId && (
        <div className='border rounded-lg p-4 space-y-3'>
          <h4 className='font-medium text-sm'>Choose Avatar Source</h4>

          {/* Upload from computer */}
          <div>
            <input
              ref={fileInputRef}
              type='file'
              accept='image/jpeg,image/png,image/gif,image/webp'
              onChange={handleFileSelect}
              className='hidden'
              id='avatar-upload'
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
            <div>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() => handleUseLinkedAvatar(jiraAvatar)}
                disabled={isUploading}
                className='w-full justify-start'
              >
                <ImageIcon className='h-4 w-4 mr-2' />
                Use Jira Avatar
              </Button>
            </div>
          )}

          {/* Use GitHub avatar */}
          {githubAvatar && (
            <div>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() => handleUseLinkedAvatar(githubAvatar)}
                disabled={isUploading}
                className='w-full justify-start'
              >
                <ImageIcon className='h-4 w-4 mr-2' />
                Use GitHub Avatar
              </Button>
            </div>
          )}

          {!jiraAvatar && !githubAvatar && (
            <p className='text-sm text-muted-foreground'>
              Link Jira or GitHub accounts to use their avatars
            </p>
          )}

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
