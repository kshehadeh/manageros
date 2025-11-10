'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { SectionHeader } from '@/components/ui/section-header'
import {
  ChevronDown,
  ChevronUp,
  Eye,
  ListTodo,
  Calendar,
  FileText,
  Target,
  MessageSquare,
  GitPullRequest,
  BarChart3,
  Rocket,
  Users2,
  User,
  UserCheck,
  Handshake,
} from 'lucide-react'
import { Link } from '@/components/ui/link'

// Icon mapping for commonly used icons
const iconMap = {
  User,
  UserCheck,
  Handshake,
  ListTodo,
  Calendar,
  FileText,
  Target,
  MessageSquare,
  GitPullRequest,
  BarChart3,
  Rocket,
  Users2,
} as const

type IconName = keyof typeof iconMap

interface ExpandableSectionProps {
  title: string
  icon?: IconName
  viewAllHref: string
  children: React.ReactNode
  initialLimit?: number
  className?: string
}

export function ExpandableSection({
  title,
  icon,
  viewAllHref,
  children,
  initialLimit = 5,
  className = '',
}: ExpandableSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const childrenArray = Array.isArray(children) ? children : [children]
  const hasMoreItems = childrenArray.length > initialLimit
  const visibleItems = isExpanded
    ? childrenArray
    : childrenArray.slice(0, initialLimit)

  const IconComponent = icon ? iconMap[icon] : null

  return (
    <section
      className={`rounded-xl py-4 -mx-3 px-3 md:mx-0 md:px-4 space-y-4 ${className}`}
    >
      <SectionHeader
        icon={IconComponent || User}
        title={title}
        action={
          <Button asChild variant='outline' size='sm'>
            <Link href={viewAllHref} className='flex items-center gap-2'>
              <Eye className='w-4 h-4' />
              View all
            </Link>
          </Button>
        }
      />
      <div className='space-y-3'>
        {visibleItems}
        {childrenArray.length === 0 && (
          <div className='text-neutral-400 text-sm'>No items yet.</div>
        )}
        {hasMoreItems && (
          <div className='pt-2'>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => setIsExpanded(!isExpanded)}
              className='text-sm h-auto p-1'
            >
              {isExpanded ? (
                <>
                  <ChevronUp className='h-4 w-4 mr-1' />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className='h-4 w-4 mr-1' />
                  Show all ({childrenArray.length})
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}
