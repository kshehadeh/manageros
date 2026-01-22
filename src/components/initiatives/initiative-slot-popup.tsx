'use client'

import { useState, useEffect } from 'react'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
import { PersonAvatar } from '@/components/people/person-avatar'
import { RagCircle } from '@/components/rag'
import { getInitiativeSlotPopupData } from '@/lib/actions/initiative'
import { formatShortDate } from '@/lib/utils/date-utils'
import {
  Users,
  CheckCircle2,
  Calendar,
  AlertCircle,
  ArrowRight,
} from 'lucide-react'
import { Link } from '@/components/ui/link'

interface InitiativeSlotPopupData {
  people: Array<{
    id: string
    name: string
    avatar: string | null
    role: string
  }>
  lastCheckIn: {
    id: string
    weekOf: string | Date
    rag: string
    confidence: number
    summary: string
    blockers: string | null
    nextSteps: string | null
    createdAt: string | Date
    createdBy: {
      id: string
      name: string
    }
  } | null
  openTasks: Array<{
    id: string
    title: string
    assignee: {
      id: string
      name: string
    } | null
    dueDate: string | Date | null
    priority: number
    status: string
  }>
}

interface InitiativeSlotPopupProps {
  initiativeId: string
  children: React.ReactNode
}

export function InitiativeSlotPopup({
  initiativeId,
  children,
}: InitiativeSlotPopupProps) {
  const [data, setData] = useState<InitiativeSlotPopupData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (isOpen && !data && !loading) {
      setLoading(true)
      setError(null)
      getInitiativeSlotPopupData(initiativeId)
        .then(result => {
          if (result) {
            setData(result)
          } else {
            setError('Failed to load data')
          }
        })
        .catch(err => {
          console.error('Error loading popup data:', err)
          setError('Failed to load data')
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }, [isOpen, initiativeId, data, loading])

  return (
    <HoverCard openDelay={500} onOpenChange={setIsOpen}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent
        side='top'
        align='center'
        sideOffset={8}
        className='w-80 max-h-[500px] overflow-y-auto'
      >
        {loading && (
          <div className='flex items-center justify-center py-8'>
            <div className='text-sm text-muted-foreground'>Loading...</div>
          </div>
        )}

        {error && (
          <div className='flex items-center justify-center py-8'>
            <div className='text-sm text-destructive'>{error}</div>
          </div>
        )}

        {!loading && !error && data && (
          <div className='space-y-4'>
            {/* People Section */}
            {data.people.length > 0 && (
              <div>
                <div className='flex items-center gap-2 mb-2'>
                  <Users className='h-4 w-4 text-muted-foreground' />
                  <h4 className='text-sm font-semibold'>People Involved</h4>
                </div>
                <div className='space-y-2'>
                  {data.people.map(person => (
                    <div
                      key={person.id}
                      className='flex items-center gap-2 text-sm'
                    >
                      <PersonAvatar
                        name={person.name}
                        avatar={person.avatar}
                        size='sm'
                      />
                      <div className='flex-1 min-w-0'>
                        <div className='truncate'>{person.name}</div>
                        {person.role !== 'owner' && (
                          <div className='text-xs text-muted-foreground truncate'>
                            {person.role}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Last Check-in Section */}
            <div>
              <div className='flex items-center gap-2 mb-2'>
                <CheckCircle2 className='h-4 w-4 text-muted-foreground' />
                <h4 className='text-sm font-semibold'>Last Check-in</h4>
              </div>
              {data.lastCheckIn ? (
                <div className='space-y-2 text-sm'>
                  <div className='flex items-center gap-2'>
                    <RagCircle rag={data.lastCheckIn.rag} size='small' />
                    <span className='text-muted-foreground'>
                      {formatShortDate(
                        data.lastCheckIn.weekOf instanceof Date
                          ? data.lastCheckIn.weekOf
                          : new Date(data.lastCheckIn.weekOf)
                      )}
                    </span>
                    <span className='text-muted-foreground'>•</span>
                    <span className='text-muted-foreground'>
                      {data.lastCheckIn.confidence}% confidence
                    </span>
                  </div>
                  {data.lastCheckIn.summary && (
                    <div className='text-muted-foreground line-clamp-2'>
                      {data.lastCheckIn.summary}
                    </div>
                  )}
                  {data.lastCheckIn.blockers && (
                    <div className='flex items-start gap-2'>
                      <AlertCircle className='h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0' />
                      <div className='text-xs text-muted-foreground flex-1'>
                        <span className='font-medium'>Blockers: </span>
                        <span className='line-clamp-2'>
                          {data.lastCheckIn.blockers}
                        </span>
                      </div>
                    </div>
                  )}
                  {data.lastCheckIn.nextSteps && (
                    <div className='flex items-start gap-2'>
                      <ArrowRight className='h-3.5 w-3.5 text-primary mt-0.5 shrink-0' />
                      <div className='text-xs text-muted-foreground flex-1'>
                        <span className='font-medium'>Next Steps: </span>
                        <span className='line-clamp-2'>
                          {data.lastCheckIn.nextSteps}
                        </span>
                      </div>
                    </div>
                  )}
                  <div className='text-xs text-muted-foreground'>
                    By {data.lastCheckIn.createdBy.name}
                  </div>
                </div>
              ) : (
                <div className='text-sm text-muted-foreground'>
                  No check-ins yet
                </div>
              )}
            </div>

            {/* Open Tasks Section */}
            <div>
              <div className='flex items-center gap-2 mb-2'>
                <Calendar className='h-4 w-4 text-muted-foreground' />
                <h4 className='text-sm font-semibold'>Open Tasks</h4>
              </div>
              {data.openTasks.length > 0 ? (
                <div className='space-y-1.5'>
                  {data.openTasks.map(task => (
                    <Link
                      key={task.id}
                      href={`/tasks/${task.id}`}
                      className='block text-sm text-primary hover:text-primary/80 truncate'
                      onClick={e => e.stopPropagation()}
                    >
                      {task.title}
                    </Link>
                  ))}
                </div>
              ) : (
                <div className='text-sm text-muted-foreground'>
                  No open tasks
                </div>
              )}
            </div>
          </div>
        )}
      </HoverCardContent>
    </HoverCard>
  )
}
