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
} from 'lucide-react'
import Link from 'next/link'

// Icon mapping for commonly used icons
const iconMap = {
  User,
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
  fullBleed?: boolean // Remove padding for full-bleed content like tables
}

export function ExpandableSection({
  title,
  icon,
  viewAllHref,
  children,
  initialLimit = 5,
  className = '',
  fullBleed = false,
}: ExpandableSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const childrenArray = Array.isArray(children) ? children : [children]
  const hasMoreItems = childrenArray.length > initialLimit
  const visibleItems = isExpanded
    ? childrenArray
    : childrenArray.slice(0, initialLimit)

  const IconComponent = icon ? iconMap[icon] : null

  return (
    <section className={`rounded-xl ${fullBleed ? 'p-0' : 'p-4'} space-y-4 ${className}`}>
      <div className={fullBleed ? 'px-4 pt-4' : ''}>
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
      </div>
      <div className={`space-y-3 ${fullBleed ? '' : ''}`}>
        {visibleItems}
        {childrenArray.length === 0 && (
          <div className={`text-neutral-400 text-sm ${fullBleed ? 'px-4' : ''}`}>No items yet.</div>
        )}
        {hasMoreItems && (
          <div className={`pt-2 ${fullBleed ? 'px-4 pb-4' : ''}`}>
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
