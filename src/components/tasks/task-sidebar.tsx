'use client'

import { LinkManager } from '@/components/entity-links'
import { SectionHeader } from '@/components/ui/section-header'
import { Calendar, User, Clock, Rocket, Target } from 'lucide-react'
import Link from 'next/link'

interface EntityLink {
  id: string
  url: string
  title: string | null
  description: string | null
  createdAt: Date
  updatedAt: Date
  createdBy: {
    id: string
    name: string
    email: string
  }
}

interface TaskSidebarProps {
  links: EntityLink[]
  entityId: string
  initiative?: {
    id: string
    title: string
  } | null
  objective?: {
    id: string
    title: string
  } | null
  estimate?: number | null
  dueDate?: Date | null
  createdBy?: {
    id: string
    name: string
  } | null
  updatedAt: Date
}

export function TaskSidebar({
  links,
  entityId,
  initiative,
  objective,
  estimate,
  dueDate,
  createdBy,
  updatedAt,
}: TaskSidebarProps) {
  const hasDetails = initiative || objective || estimate || dueDate || createdBy

  return (
    <div className='w-full lg:w-80 space-y-6'>
      {/* Details Section */}
      {hasDetails && (
        <div className='page-section'>
          <SectionHeader icon={Clock} title='Details' className='mb-3' />
          <div className='space-y-3 text-sm'>
            {initiative && (
              <div>
                <div className='flex items-center gap-2 text-muted-foreground mb-1'>
                  <Rocket className='w-3.5 h-3.5' />
                  <span className='font-medium'>Initiative</span>
                </div>
                <Link
                  href={`/initiatives/${initiative.id}`}
                  className='text-primary hover:text-primary/80 font-medium ml-5'
                >
                  {initiative.title}
                </Link>
              </div>
            )}

            {objective && (
              <div>
                <div className='flex items-center gap-2 text-muted-foreground mb-1'>
                  <Target className='w-3.5 h-3.5' />
                  <span className='font-medium'>Objective</span>
                </div>
                <div className='ml-5'>{objective.title}</div>
              </div>
            )}

            {estimate && (
              <div>
                <div className='flex items-center gap-2 text-muted-foreground mb-1'>
                  <Clock className='w-3.5 h-3.5' />
                  <span className='font-medium'>Estimate</span>
                </div>
                <div className='ml-5'>{estimate} hours</div>
              </div>
            )}

            {dueDate && (
              <div>
                <div className='flex items-center gap-2 text-muted-foreground mb-1'>
                  <Calendar className='w-3.5 h-3.5' />
                  <span className='font-medium'>Due Date</span>
                </div>
                <div className='ml-5'>
                  {new Date(dueDate).toLocaleDateString()}
                </div>
              </div>
            )}

            {createdBy && (
              <div>
                <div className='flex items-center gap-2 text-muted-foreground mb-1'>
                  <User className='w-3.5 h-3.5' />
                  <span className='font-medium'>Created By</span>
                </div>
                <div className='ml-5'>{createdBy.name}</div>
              </div>
            )}

            <div>
              <div className='flex items-center gap-2 text-muted-foreground mb-1'>
                <Clock className='w-3.5 h-3.5' />
                <span className='font-medium'>Last Updated</span>
              </div>
              <div className='ml-5'>{new Date(updatedAt).toLocaleString()}</div>
            </div>
          </div>
        </div>
      )}

      {/* Links Section */}
      <div className='page-section'>
        <LinkManager entityType='Task' entityId={entityId} links={links} />
      </div>
    </div>
  )
}
