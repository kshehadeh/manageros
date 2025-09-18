'use client'

import Link from 'next/link'
import { LucideIcon, Eye, Edit } from 'lucide-react'
import { ReactNode } from 'react'

interface IconButtonProps {
  href?: string
  onClick?: () => void
  icon: LucideIcon
  tooltip: string
  variant?: 'primary' | 'secondary' | 'ghost' | 'link'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  children?: ReactNode
  className?: string
}

export function IconButton({
  href,
  onClick,
  icon: Icon,
  tooltip,
  variant = 'primary',
  size = 'md',
  disabled = false,
  children,
  className = '',
}: IconButtonProps) {
  const baseClasses =
    'inline-flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed'

  const sizeClasses = {
    sm: 'h-8 w-8 text-sm',
    md: 'h-10 w-10 text-base',
    lg: 'h-12 w-12 text-lg',
  }

  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white rounded-md',
    secondary: 'bg-neutral-700 hover:bg-neutral-600 text-white rounded-md',
    ghost: 'hover:bg-neutral-800 text-neutral-300 rounded-md',
    link: 'text-blue-400 hover:text-blue-300 underline bg-transparent',
  }

  const classes = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`

  const buttonContent = (
    <>
      <Icon className='h-4 w-4' />
      {children && <span className='ml-2'>{children}</span>}
    </>
  )

  const buttonElement = href ? (
    <Link href={href} className={classes} title={tooltip}>
      {buttonContent}
    </Link>
  ) : (
    <button
      onClick={onClick}
      disabled={disabled}
      className={classes}
      title={tooltip}
    >
      {buttonContent}
    </button>
  )

  return buttonElement
}

// Convenience components for common actions
export function ViewButton({
  href,
  onClick,
  size = 'sm',
  variant = 'primary',
  className,
}: Omit<IconButtonProps, 'icon' | 'tooltip'>) {
  return (
    <IconButton
      href={href}
      onClick={onClick}
      icon={Eye}
      tooltip='View details'
      size={size}
      variant={variant}
      className={className}
    />
  )
}

export function EditButton({
  href,
  onClick,
  size = 'sm',
  variant = 'secondary',
  className,
}: Omit<IconButtonProps, 'icon' | 'tooltip'>) {
  return (
    <IconButton
      href={href}
      onClick={onClick}
      icon={Edit}
      tooltip='Edit'
      size={size}
      variant={variant}
      className={className}
    />
  )
}
