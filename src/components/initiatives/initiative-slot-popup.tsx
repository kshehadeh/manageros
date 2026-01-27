'use client'

import { useState, useEffect } from 'react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
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
  ChevronRight,
  Pencil,
  Eye,
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
}

export function InitiativeSlotPopup({
  initiativeId,
}: InitiativeSlotPopupProps) {
  const [data, setData] = useState<InitiativeSlotPopupData | null>(null)
  const [dataInitiativeId, setDataInitiativeId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  // Clear data when initiativeId changes
  useEffect(() => {
    if (dataInitiativeId !== initiativeId) {
      setData(null)
      setDataInitiativeId(null)
      setError(null)
    }
  }, [initiativeId, dataInitiativeId])

  useEffect(() => {
    // Only fetch if we don't have data for this specific initiative
    if (isOpen && dataInitiativeId !== initiativeId && !loading) {
      setLoading(true)
      setError(null)
      getInitiativeSlotPopupData(initiativeId)
        .then(result => {
          if (result) {
            setData(result)
            setDataInitiativeId(initiativeId)
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
  }, [isOpen, initiativeId, dataInitiativeId, loading])

  return (
    <div className='flex shrink-0 items-center gap-1' data-slot-card-actions>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href={`/initiatives/${initiativeId}/edit`}
            className='inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50'
            onClick={e => e.stopPropagation()}
          >
            <Pencil className='h-4 w-4' />
          </Link>
        </TooltipTrigger>
        <TooltipContent side='top'>Edit initiative</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href={`/initiatives/${initiativeId}`}
            className='inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50'
            onClick={e => e.stopPropagation()}
          >
            <Eye className='h-4 w-4' />
          </Link>
        </TooltipTrigger>
        <TooltipContent side='top'>View initiative</TooltipContent>
      </Tooltip>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant='ghost'
            size='sm'
            className='h-7 w-7 p-0 text-muted-foreground hover:text-foreground'
            onClick={e => e.stopPropagation()}
            title='View Details'
          >
            <ChevronRight className='h-4 w-4' />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          side='top'
          align='end'
          sideOffset={8}
          className='min-w-80 w-[min(32rem,calc(100vw-2rem))] max-h-[500px] overflow-y-auto'
          onClick={e => e.stopPropagation()}
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
            <div className='space-y-0'>
              {/* People Section */}
              {data.people.length > 0 && (
                <div className='pb-4 border-b border-border/50'>
                  <div className='flex items-center gap-2 mb-2'>
                    <Users className='h-4 w-4 text-muted-foreground' />
                    <h4 className='text-sm font-semibold'>People Involved</h4>
                  </div>
                  <div className='flex flex-wrap gap-x-4 gap-y-2'>
                    {data.people.map(person => (
                      <div
                        key={person.id}
                        className='flex items-center gap-2 text-sm min-w-0 shrink-0'
                      >
                        <PersonAvatar
                          name={person.name}
                          avatar={person.avatar}
                          size='sm'
                        />
                        <div className='min-w-0'>
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
              <div
                className={
                  data.people.length > 0
                    ? 'pt-4 pb-4 border-b border-border/50'
                    : 'pb-4 border-b border-border/50'
                }
              >
                <div className='flex items-center justify-between gap-2 mb-2'>
                  <div className='flex items-center gap-2'>
                    <CheckCircle2 className='h-4 w-4 text-muted-foreground' />
                    <h4 className='text-sm font-semibold'>Last Check-in</h4>
                  </div>
                  {data.lastCheckIn && (
                    <span className='text-xs text-muted-foreground shrink-0'>
                      By {data.lastCheckIn.createdBy.name}
                    </span>
                  )}
                </div>
                {data.lastCheckIn ? (
                  <div className='pl-4 space-y-2 text-sm'>
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
                    {(data.lastCheckIn.blockers ||
                      data.lastCheckIn.nextSteps) && (
                      <div className='flex items-center gap-2'>
                        {data.lastCheckIn.blockers && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className='inline-flex cursor-help'>
                                <AlertCircle className='h-3.5 w-3.5 text-amber-500 shrink-0' />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent
                              side='top'
                              className='min-w-72 max-w-md'
                            >
                              <p className='font-medium'>Blockers</p>
                              <p className='text-muted-foreground whitespace-pre-wrap'>
                                {data.lastCheckIn.blockers}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                        {data.lastCheckIn.nextSteps && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className='inline-flex cursor-help'>
                                <ArrowRight className='h-3.5 w-3.5 text-primary shrink-0' />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent
                              side='top'
                              className='min-w-72 max-w-md'
                            >
                              <p className='font-medium'>Next Steps</p>
                              <p className='text-muted-foreground whitespace-pre-wrap'>
                                {data.lastCheckIn.nextSteps}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className='pl-4 text-sm text-muted-foreground'>
                    No check-ins yet
                  </div>
                )}
              </div>

              {/* Open Tasks Section */}
              <div className='pt-4'>
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
        </PopoverContent>
      </Popover>
    </div>
  )
}
