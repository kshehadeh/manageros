'use client'

import { Link } from '@/components/ui/link'
import { Badge } from '@/components/ui/badge'
import { Geist_Mono as GeistMono } from 'next/font/google'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

const geistMono = GeistMono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
})

interface SidebarLinkProps {
  href: string
  name: string
  icon?: LucideIcon
  isActive?: boolean
  badgeCount?: number
  badgeVariant?:
    | 'default'
    | 'secondary'
    | 'destructive'
    | 'outline'
    | 'success'
    | 'warning'
    | 'error'
    | 'info'
    | 'neutral'
  onClick?: () => void
  className?: string
}

export function SidebarLink({
  href,
  name,
  icon: Icon,
  isActive = false,
  badgeCount,
  badgeVariant = 'secondary',
  onClick,
  className,
}: SidebarLinkProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'relative flex items-center justify-start gap-lg px-lg py-sm text-xs overflow-hidden',
        geistMono.className,
        isActive
          ? 'text-highlight border border-highlight/20 rounded-sm before:scale-x-100 before:bg-highlight-bg'
          : 'text-muted-foreground hover:text-highlight rounded-sm before:scale-x-0 hover:before:scale-x-100 before:bg-accent',
        'before:absolute before:inset-0 before:origin-left before:transition-transform before:duration-300 before:ease-out',
        className
      )}
    >
      {Icon && <Icon className='h-4 w-4 relative z-10' />}
      <span className='flex-1 text-left relative z-10'>{name}</span>
      {badgeCount !== undefined && badgeCount > 0 && (
        <Badge
          variant={badgeVariant}
          className='ml-auto px-sm py-0 text-2xs h-4 leading-tight relative z-10'
        >
          {badgeCount}
        </Badge>
      )}
    </Link>
  )
}
