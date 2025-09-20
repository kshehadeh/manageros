'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp } from 'lucide-react'
import Link from 'next/link'

interface ExpandableSectionProps {
  title: string
  viewAllHref: string
  children: React.ReactNode
  initialLimit?: number
  className?: string
}

export function ExpandableSection({
  title,
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

  return (
    <section className={`card ${className}`}>
      <div className='flex items-center justify-between mb-3'>
        <h2 className='font-semibold'>{title}</h2>
        <Button asChild variant='outline' size='sm'>
          <Link href={viewAllHref}>View all</Link>
        </Button>
      </div>
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
