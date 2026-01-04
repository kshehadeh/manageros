'use client'

import { useState, useEffect, useRef } from 'react'
import { Link } from '@/components/ui/link'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RagCircle, Rag } from '@/components/rag'
import { getInitiativeSummaryForModal } from '@/lib/actions/initiative'
import {
  Loader2,
  ExternalLink,
  Users,
  Calendar,
  Target,
  Ruler,
  TrendingUp,
  CheckCircle,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
import {
  initiativeStatusUtils,
  type InitiativeStatus,
} from '@/lib/initiative-status'
import { initiativeSizeUtils, type InitiativeSize } from '@/lib/initiative-size'
import { formatShortDate } from '@/lib/utils/date-utils'
import { PersonAvatar } from '@/components/people/person-avatar'

interface InitiativeDetailModalProps {
  initiativeId: string
  isOpen: boolean
  onClose: () => void
}

interface InitiativeSummaryData {
  id: string
  title: string
  summary: string | null
  status: string
  rag: string
  priority: number
  size: string | null
  startDate: Date | null
  targetDate: Date | null
  team: {
    id: string
    name: string
  } | null
  owners: Array<{
    id: string
    name: string
    avatar: string | null
    role: string
  }>
  objectiveCount: number
  taskCount: number
  progress: number
  completedTasks: number
  mostRecentCheckIn: {
    id: string
    weekOf: Date
    rag: string
    confidence: number
    summary: string | null
    createdAt: Date
    createdBy: {
      id: string
      name: string
    }
  } | null
}

export function InitiativeDetailModal({
  initiativeId,
  isOpen,
  onClose,
}: InitiativeDetailModalProps) {
  const [loading, setLoading] = useState(false)
  const [initiativeData, setInitiativeData] =
    useState<InitiativeSummaryData | null>(null)
  const currentRequestIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (isOpen && initiativeId) {
      // Track the current request ID to prevent race conditions
      const requestId = initiativeId
      currentRequestIdRef.current = requestId

      const loadInitiativeData = async () => {
        setLoading(true)
        try {
          const data = await getInitiativeSummaryForModal(initiativeId)

          // Only update state if this is still the current request
          if (currentRequestIdRef.current === requestId) {
            if (!data) {
              toast.error('Failed to load initiative data')
              onClose()
              return
            }

            setInitiativeData(data)
          }
        } catch (error) {
          // Only handle error if this is still the current request
          if (currentRequestIdRef.current === requestId) {
            console.error('Error loading initiative data:', error)
            toast.error('Failed to load initiative data')
            onClose()
          }
        } finally {
          // Only update loading state if this is still the current request
          if (currentRequestIdRef.current === requestId) {
            setLoading(false)
          }
        }
      }

      loadInitiativeData()
    } else {
      // Reset data when modal closes
      currentRequestIdRef.current = null
      setInitiativeData(null)
    }
  }, [isOpen, initiativeId, onClose])

  const handleOpenChange = (open: boolean) => {
    if (!open && !loading) {
      onClose()
    }
  }

  if (!initiativeData && !loading) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent size='lg' className='overflow-y-auto max-h-[95vh]'>
        <DialogHeader>
          {loading ? (
            <>
              <DialogTitle>Loading initiative details...</DialogTitle>
              <div className='flex items-center justify-center py-12'>
                <Loader2 className='w-8 h-8 animate-spin text-muted-foreground' />
              </div>
            </>
          ) : initiativeData ? (
            <>
              <div className='flex items-start gap-4'>
                <RagCircle rag={initiativeData.rag} size='default' />
                <div className='flex-1'>
                  <DialogTitle className='flex items-center gap-2 mb-2 flex-wrap'>
                    {initiativeData.title}
                    <Badge
                      variant={initiativeStatusUtils.getVariant(
                        initiativeData.status as InitiativeStatus
                      )}
                    >
                      {initiativeStatusUtils.getLabel(
                        initiativeData.status as InitiativeStatus
                      )}
                    </Badge>
                  </DialogTitle>
                  {initiativeData.summary && (
                    <p className='text-sm text-muted-foreground line-clamp-2'>
                      {initiativeData.summary}
                    </p>
                  )}
                </div>
              </div>
            </>
          ) : null}
        </DialogHeader>

        {initiativeData && (
          <div className='space-y-6 mt-4'>
            {/* Properties Section */}
            <div className='grid grid-cols-2 sm:grid-cols-4 gap-4'>
              {/* Progress */}
              <div className='flex flex-col gap-1'>
                <span className='text-xs text-muted-foreground flex items-center gap-1'>
                  <TrendingUp className='w-3 h-3' />
                  Progress
                </span>
                <span className='text-sm font-medium'>
                  {initiativeData.progress}%
                  <span className='text-muted-foreground ml-1'>
                    ({initiativeData.completedTasks}/{initiativeData.taskCount})
                  </span>
                </span>
              </div>

              {/* Size */}
              {initiativeData.size &&
                initiativeSizeUtils.isValid(initiativeData.size) && (
                  <div className='flex flex-col gap-1'>
                    <span className='text-xs text-muted-foreground flex items-center gap-1'>
                      <Ruler className='w-3 h-3' />
                      Size
                    </span>
                    <span className='text-sm font-medium'>
                      {initiativeSizeUtils.getLabel(
                        initiativeData.size as InitiativeSize
                      )}
                    </span>
                  </div>
                )}

              {/* Start Date */}
              {initiativeData.startDate && (
                <div className='flex flex-col gap-1'>
                  <span className='text-xs text-muted-foreground flex items-center gap-1'>
                    <Calendar className='w-3 h-3' />
                    Start Date
                  </span>
                  <span className='text-sm font-medium'>
                    {formatShortDate(initiativeData.startDate)}
                  </span>
                </div>
              )}

              {/* Target Date */}
              {initiativeData.targetDate && (
                <div className='flex flex-col gap-1'>
                  <span className='text-xs text-muted-foreground flex items-center gap-1'>
                    <Calendar className='w-3 h-3' />
                    Target Date
                  </span>
                  <span className='text-sm font-medium'>
                    {formatShortDate(initiativeData.targetDate)}
                  </span>
                </div>
              )}
            </div>

            {/* Team and Owners Section */}
            <div className='space-y-3'>
              {initiativeData.team && (
                <div className='flex items-center gap-2'>
                  <span className='text-xs text-muted-foreground'>Team:</span>
                  <Badge variant='outline'>{initiativeData.team.name}</Badge>
                </div>
              )}

              {initiativeData.owners.length > 0 && (
                <div className='flex items-start gap-2'>
                  <span className='text-xs text-muted-foreground flex items-center gap-1 pt-1'>
                    <Users className='w-3 h-3' />
                    Owners:
                  </span>
                  <div className='flex flex-wrap gap-2'>
                    {initiativeData.owners.map(owner => (
                      <div
                        key={owner.id}
                        className='flex items-center gap-2 bg-muted/50 rounded-full px-2 py-1'
                      >
                        <PersonAvatar
                          name={owner.name}
                          avatar={owner.avatar}
                          size='xs'
                        />
                        <span className='text-xs'>{owner.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Stats Section */}
            <div className='grid grid-cols-2 gap-4'>
              {/* Objectives Count */}
              <div className='flex flex-col gap-1 p-3 rounded-md bg-muted/30 border border-border/50'>
                <span className='text-xs text-muted-foreground flex items-center gap-1'>
                  <Target className='w-3 h-3' />
                  Objectives
                </span>
                <span className='text-lg font-semibold'>
                  {initiativeData.objectiveCount}
                </span>
              </div>

              {/* Tasks Count */}
              <div className='flex flex-col gap-1 p-3 rounded-md bg-muted/30 border border-border/50'>
                <span className='text-xs text-muted-foreground flex items-center gap-1'>
                  <CheckCircle className='w-3 h-3' />
                  Tasks
                </span>
                <span className='text-lg font-semibold'>
                  {initiativeData.taskCount}
                </span>
              </div>
            </div>

            {/* Most Recent Check-In */}
            {initiativeData.mostRecentCheckIn && (
              <div>
                <h3 className='text-sm font-semibold mb-3 flex items-center gap-2'>
                  <CheckCircle className='w-4 h-4' />
                  Most Recent Check-In
                </h3>
                <div className='p-3 rounded-md bg-muted/30 border border-border/50 space-y-2'>
                  <div className='flex items-center gap-2'>
                    <span className='text-xs text-muted-foreground'>
                      Week of{' '}
                      {new Date(
                        initiativeData.mostRecentCheckIn.weekOf
                      ).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                    <Rag rag={initiativeData.mostRecentCheckIn.rag} />
                    <span className='text-xs text-muted-foreground'>
                      {initiativeData.mostRecentCheckIn.confidence}% confidence
                    </span>
                  </div>
                  {initiativeData.mostRecentCheckIn.summary && (
                    <p className='text-sm line-clamp-3'>
                      {initiativeData.mostRecentCheckIn.summary}
                    </p>
                  )}
                  <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                    <span>
                      By{' '}
                      <Link
                        href={`/people/${initiativeData.mostRecentCheckIn.createdBy.id}`}
                        className='text-primary hover:opacity-90'
                        onClick={e => e.stopPropagation()}
                      >
                        {initiativeData.mostRecentCheckIn.createdBy.name}
                      </Link>
                    </span>
                    <span>•</span>
                    <span>
                      {formatDistanceToNow(
                        new Date(initiativeData.mostRecentCheckIn.createdAt),
                        { addSuffix: true }
                      )}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {initiativeData && (
          <DialogFooter>
            <Button asChild variant='outline' className='w-full'>
              <Link
                href={`/initiatives/${initiativeData.id}`}
                onClick={onClose}
                className='flex items-center justify-center gap-2'
              >
                <ExternalLink className='w-4 h-4' />
                View Full Details
              </Link>
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
