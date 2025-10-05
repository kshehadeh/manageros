'use client'

import { useState } from 'react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { Camera } from 'lucide-react'

interface ClickableTeamAvatarProps {
  name: string
  avatar?: string | null
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  isAdmin?: boolean
  onClick?: () => void
}

/**
 * Get initials from a team's name
 */
function getInitials(name: string): string {
  const parts = name.trim().split(' ')
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

const sizeClasses = {
  xs: 'h-6 w-6 text-xs',
  sm: 'h-8 w-8 text-sm',
  md: 'h-10 w-10 text-base',
  lg: 'h-16 w-16 text-xl',
  xl: 'h-20 w-20 text-2xl',
}

/**
 * ClickableTeamAvatar component displays a team's avatar with initials fallback
 * Shows hover overlay for admin users to indicate it's clickable
 */
export function ClickableTeamAvatar({
  name,
  avatar,
  size = 'md',
  className,
  isAdmin = false,
  onClick,
}: ClickableTeamAvatarProps) {
  const [isHovered, setIsHovered] = useState(false)

  const handleClick = () => {
    if (isAdmin && onClick) {
      onClick()
    }
  }

  const handleMouseEnter = () => {
    if (isAdmin) {
      setIsHovered(true)
    }
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
  }

  return (
    <div
      className={cn(
        'relative inline-block',
        isAdmin && 'cursor-pointer',
        className
      )}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Avatar className={cn(sizeClasses[size])}>
        {avatar && <AvatarImage src={avatar} alt={name} />}
        <AvatarFallback>{getInitials(name)}</AvatarFallback>
      </Avatar>

      {/* Hover overlay for admin users */}
      {isAdmin && isHovered && (
        <div className='absolute inset-0 bg-black/50 rounded-full flex items-center justify-center'>
          <Camera className='h-4 w-4 text-white' />
        </div>
      )}
    </div>
  )
}
