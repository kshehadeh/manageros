'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Link } from '@/components/ui/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { PersonAvatar } from '@/components/people/person-avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  ClipboardCheck,
  BookOpen,
  Users,
  CheckCircle,
  Lightbulb,
  ChevronDown,
  ChevronRight,
  Circle,
  Clock,
  Ban,
  ExternalLink,
  Check,
  X,
} from 'lucide-react'
import { updateOnboardingItemProgress } from '@/lib/actions/onboarding-instance'
import type {
  OnboardingItemStatus,
  OnboardingItemType,
  OnboardingStatus,
} from '@/generated/prisma'

const ITEM_TYPE_ICONS: Record<OnboardingItemType, typeof ClipboardCheck> = {
  TASK: ClipboardCheck,
  READING: BookOpen,
  MEETING: Users,
  CHECKPOINT: CheckCircle,
  EXPECTATION: Lightbulb,
}

const ITEM_TYPE_LABELS: Record<OnboardingItemType, string> = {
  TASK: 'Task',
  READING: 'Reading',
  MEETING: 'Meeting',
  CHECKPOINT: 'Checkpoint',
  EXPECTATION: 'Expectation',
}

const STATUS_ICONS: Record<OnboardingItemStatus, typeof Circle> = {
  PENDING: Circle,
  IN_PROGRESS: Clock,
  COMPLETED: Check,
  SKIPPED: X,
  BLOCKED: Ban,
}

const STATUS_CONFIG: Record<
  OnboardingStatus,
  {
    label: string
    variant: 'default' | 'secondary' | 'destructive' | 'outline'
  }
> = {
  NOT_STARTED: { label: 'Not Started', variant: 'secondary' },
  IN_PROGRESS: { label: 'In Progress', variant: 'default' },
  COMPLETED: { label: 'Completed', variant: 'outline' },
  CANCELLED: { label: 'Cancelled', variant: 'destructive' },
}

interface OnboardingData {
  id: string
  status: OnboardingStatus
  startedAt: Date | null
  completedAt: Date | null
  template: {
    id: string
    name: string
  }
  manager: {
    id: string
    name: string
    avatar: string | null
  } | null
  mentor: {
    id: string
    name: string
    avatar: string | null
  } | null
  progress: {
    total: number
    completed: number
    percentComplete: number
    requiredTotal: number
    requiredCompleted: number
  }
  currentPhase: {
    id: string
    name: string
    sortOrder: number
    completed: number
    total: number
  } | null
  phases: {
    id: string
    name: string
    sortOrder: number
    completed: number
    total: number
  }[]
  itemProgress: {
    id: string
    status: OnboardingItemStatus
    completedAt: Date | null
    notes: string | null
    item: {
      id: string
      title: string
      description: string | null
      type: OnboardingItemType
      isRequired: boolean
      linkedUrl: string | null
      ownerType: string | null
      phase: {
        id: string
        name: string
        sortOrder: number
      }
    }
  }[]
}

interface PersonOnboardingViewProps {
  onboarding: OnboardingData
  personName: string
  canManage: boolean
  isSelf: boolean
}

export function PersonOnboardingView({
  onboarding,
  personName,
  canManage,
  isSelf,
}: PersonOnboardingViewProps) {
  const router = useRouter()
  const statusConfig = STATUS_CONFIG[onboarding.status]

  // Group items by phase
  const phaseItems = new Map<string, typeof onboarding.itemProgress>()
  for (const progress of onboarding.itemProgress) {
    const phaseId = progress.item.phase.id
    if (!phaseItems.has(phaseId)) {
      phaseItems.set(phaseId, [])
    }
    phaseItems.get(phaseId)!.push(progress)
  }

  // Sort phases by sortOrder
  const sortedPhases = onboarding.phases.sort(
    (a, b) => a.sortOrder - b.sortOrder
  )

  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(() => {
    // Expand first incomplete phase by default
    const firstIncomplete = sortedPhases.find(
      phase => phase.completed < phase.total
    )
    return new Set(
      firstIncomplete ? [firstIncomplete.id] : [sortedPhases[0]?.id]
    )
  })
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set())

  const togglePhase = (phaseId: string) => {
    setExpandedPhases(prev => {
      const next = new Set(prev)
      if (next.has(phaseId)) {
        next.delete(phaseId)
      } else {
        next.add(phaseId)
      }
      return next
    })
  }

  const handleUpdateStatus = async (
    progressId: string,
    status: OnboardingItemStatus,
    notes?: string
  ) => {
    setUpdatingItems(prev => new Set([...prev, progressId]))
    try {
      await updateOnboardingItemProgress(progressId, { status, notes })
      router.refresh()
    } catch (error) {
      console.error('Error updating item:', error)
      alert(error instanceof Error ? error.message : 'Failed to update item')
    } finally {
      setUpdatingItems(prev => {
        const next = new Set(prev)
        next.delete(progressId)
        return next
      })
    }
  }

  const canCompleteItems = canManage || isSelf
  const isCheckpointCompleter = canManage

  return (
    <div className='space-y-6'>
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className='flex items-start justify-between'>
            <div>
              <CardTitle>{onboarding.template.name}</CardTitle>
              <p className='text-sm text-muted-foreground mt-1'>
                Onboarding progress for {personName}
              </p>
            </div>
            <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
          </div>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div>
            <div className='flex items-center justify-between mb-2'>
              <span className='text-sm text-muted-foreground'>
                Overall Progress
              </span>
              <span className='text-sm font-medium'>
                {onboarding.progress.completed}/{onboarding.progress.total}{' '}
                items ({onboarding.progress.percentComplete}%)
              </span>
            </div>
            <Progress
              value={onboarding.progress.percentComplete}
              className='h-3'
            />
          </div>

          <div className='flex flex-wrap gap-4 text-sm'>
            {onboarding.manager && (
              <div className='flex items-center gap-2'>
                <PersonAvatar
                  name={onboarding.manager.name}
                  avatar={onboarding.manager.avatar}
                  size='xs'
                />
                <span className='text-muted-foreground'>Manager:</span>
                <Link
                  href={`/people/${onboarding.manager.id}`}
                  className='hover:underline'
                >
                  {onboarding.manager.name}
                </Link>
              </div>
            )}
            {onboarding.mentor && (
              <div className='flex items-center gap-2'>
                <PersonAvatar
                  name={onboarding.mentor.name}
                  avatar={onboarding.mentor.avatar}
                  size='xs'
                />
                <span className='text-muted-foreground'>Mentor:</span>
                <Link
                  href={`/people/${onboarding.mentor.id}`}
                  className='hover:underline'
                >
                  {onboarding.mentor.name}
                </Link>
              </div>
            )}
          </div>

          {onboarding.startedAt && (
            <p className='text-xs text-muted-foreground'>
              Started: {new Date(onboarding.startedAt).toLocaleDateString()}
              {onboarding.completedAt && (
                <>
                  {' '}
                  • Completed:{' '}
                  {new Date(onboarding.completedAt).toLocaleDateString()}
                </>
              )}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Phase Cards */}
      <div className='space-y-4'>
        {sortedPhases.map(phase => {
          const items = phaseItems.get(phase.id) || []
          const isExpanded = expandedPhases.has(phase.id)
          const isComplete = phase.completed === phase.total
          const phasePercent =
            phase.total > 0
              ? Math.round((phase.completed / phase.total) * 100)
              : 0

          return (
            <Card key={phase.id}>
              <Collapsible
                open={isExpanded}
                onOpenChange={() => togglePhase(phase.id)}
              >
                <CollapsibleTrigger asChild>
                  <CardHeader className='cursor-pointer hover:bg-muted/50 transition-colors'>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-3'>
                        {isExpanded ? (
                          <ChevronDown className='w-5 h-5' />
                        ) : (
                          <ChevronRight className='w-5 h-5' />
                        )}
                        <div>
                          <CardTitle className='text-base flex items-center gap-2'>
                            {phase.name}
                            {isComplete && (
                              <CheckCircle className='w-4 h-4 text-green-500' />
                            )}
                          </CardTitle>
                          <p className='text-sm text-muted-foreground'>
                            {phase.completed}/{phase.total} items
                          </p>
                        </div>
                      </div>
                      <Progress value={phasePercent} className='w-24 h-2' />
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <CardContent className='pt-0'>
                    <div className='space-y-3'>
                      {items
                        .sort(
                          (a, b) =>
                            a.item.phase.sortOrder - b.item.phase.sortOrder
                        )
                        .map(progress => (
                          <ItemCard
                            key={progress.id}
                            item={progress}
                            isUpdating={updatingItems.has(progress.id)}
                            canComplete={canCompleteItems}
                            isCheckpointCompleter={isCheckpointCompleter}
                            onUpdateStatus={handleUpdateStatus}
                          />
                        ))}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

interface ItemCardProps {
  item: OnboardingData['itemProgress'][0]
  isUpdating: boolean
  canComplete: boolean
  isCheckpointCompleter: boolean
  onUpdateStatus: (
    progressId: string,
    status: OnboardingItemStatus,
    notes?: string
  ) => void
}

function ItemCard({
  item,
  isUpdating,
  canComplete,
  isCheckpointCompleter,
  onUpdateStatus,
}: ItemCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [notes, setNotes] = useState(item.notes || '')

  const ItemIcon = ITEM_TYPE_ICONS[item.item.type]
  const StatusIcon = STATUS_ICONS[item.status]
  const isComplete = item.status === 'COMPLETED' || item.status === 'SKIPPED'
  const canCompleteThis =
    canComplete && (item.item.type !== 'CHECKPOINT' || isCheckpointCompleter)

  const handleComplete = () => {
    onUpdateStatus(item.id, 'COMPLETED', notes)
    setIsModalOpen(false)
  }

  const handleSkip = () => {
    onUpdateStatus(item.id, 'SKIPPED', notes)
    setIsModalOpen(false)
  }

  return (
    <>
      <div
        className={`p-4 border rounded-lg transition-colors ${isComplete ? 'bg-muted/30' : 'bg-background'}`}
      >
        <div className='flex items-start gap-3'>
          <div
            className={`mt-0.5 ${isComplete ? 'text-green-500' : 'text-muted-foreground'}`}
          >
            {isComplete ? (
              <CheckCircle className='w-5 h-5' />
            ) : (
              <StatusIcon className='w-5 h-5' />
            )}
          </div>

          <div className='flex-1 min-w-0'>
            <div className='flex items-start justify-between gap-2'>
              <div className='flex-1'>
                <div className='flex items-center gap-2 flex-wrap'>
                  <span
                    className={`font-medium ${isComplete ? 'line-through text-muted-foreground' : ''}`}
                  >
                    {item.item.title}
                  </span>
                  <Badge variant='outline' className='text-xs'>
                    <ItemIcon className='w-3 h-3 mr-1' />
                    {ITEM_TYPE_LABELS[item.item.type]}
                  </Badge>
                  {!item.item.isRequired && (
                    <Badge variant='secondary' className='text-xs'>
                      Optional
                    </Badge>
                  )}
                </div>

                {item.item.description && (
                  <p className='text-sm text-muted-foreground mt-1'>
                    {item.item.description}
                  </p>
                )}

                {item.item.linkedUrl && (
                  <a
                    href={item.item.linkedUrl}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-sm text-primary hover:underline flex items-center gap-1 mt-1'
                  >
                    <ExternalLink className='w-3 h-3' />
                    Open Resource
                  </a>
                )}

                {item.notes && (
                  <p className='text-sm text-muted-foreground mt-2 italic'>
                    Note: {item.notes}
                  </p>
                )}
              </div>

              {!isComplete && canCompleteThis && (
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => setIsModalOpen(true)}
                  disabled={isUpdating}
                >
                  <Check className='w-4 h-4 mr-1' />
                  Complete
                </Button>
              )}

              {!isComplete &&
                !canCompleteThis &&
                item.item.type === 'CHECKPOINT' && (
                  <Badge variant='secondary' className='shrink-0'>
                    Requires {item.item.ownerType || 'manager'} approval
                  </Badge>
                )}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Item</DialogTitle>
            <DialogDescription>
              Mark &quot;{item.item.title}&quot; as complete
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4 py-4'>
            {item.item.description && (
              <div className='text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg'>
                {item.item.description}
              </div>
            )}

            <div className='space-y-2'>
              <Label htmlFor='notes'>Notes (optional)</Label>
              <Textarea
                id='notes'
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder='Add any notes about completing this item...'
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className='flex-col sm:flex-row gap-2'>
            {!item.item.isRequired && (
              <Button
                variant='outline'
                onClick={handleSkip}
                disabled={isUpdating}
                className='w-full sm:w-auto'
              >
                <X className='w-4 h-4 mr-1' />
                Skip
              </Button>
            )}
            <Button
              onClick={handleComplete}
              disabled={isUpdating}
              className='w-full sm:w-auto'
            >
              {isUpdating ? (
                'Saving...'
              ) : (
                <>
                  <Check className='w-4 h-4 mr-1' />
                  Mark Complete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
