'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Link } from '@/components/ui/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { PersonAvatar } from '@/components/people/person-avatar'
import { PageSection } from '@/components/ui/page-section'
import { SectionHeader } from '@/components/ui/section-header'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
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
  RefreshCw,
  AlertTriangle,
  Layers,
  BarChart3,
  Award,
} from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  updateOnboardingItemProgress,
  syncOnboardingInstanceItems,
  reinitializeOnboardingInstance,
  completeOnboarding,
} from '@/lib/actions/onboarding-instance'
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
      sortOrder: number
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
  missingItemCount: number
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
  const [isSyncing, setIsSyncing] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const [showCompleteDialog, setShowCompleteDialog] = useState(false)

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

  const handleSyncItems = async () => {
    setIsSyncing(true)
    try {
      await syncOnboardingInstanceItems(onboarding.id)
      router.refresh()
    } catch (error) {
      console.error('Error syncing items:', error)
      alert(error instanceof Error ? error.message : 'Failed to sync items')
    } finally {
      setIsSyncing(false)
    }
  }

  const handleReinitialize = async () => {
    if (
      !confirm(
        'This will reset all progress and reload items from the template. Are you sure?'
      )
    ) {
      return
    }

    setIsSyncing(true)
    try {
      await reinitializeOnboardingInstance(onboarding.id)
      router.refresh()
    } catch (error) {
      console.error('Error reinitializing:', error)
      alert(
        error instanceof Error ? error.message : 'Failed to reinitialize items'
      )
    } finally {
      setIsSyncing(false)
    }
  }

  const handleCompleteOnboarding = async () => {
    setShowCompleteDialog(false)
    setIsCompleting(true)
    try {
      await completeOnboarding(onboarding.id)
      router.refresh()
    } catch (error) {
      console.error('Error completing onboarding:', error)
      alert(
        error instanceof Error ? error.message : 'Failed to complete onboarding'
      )
    } finally {
      setIsCompleting(false)
    }
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

  const isActive =
    onboarding.status === 'NOT_STARTED' || onboarding.status === 'IN_PROGRESS'

  // Check if all required items are complete
  const allRequiredComplete =
    onboarding.progress.requiredTotal > 0 &&
    onboarding.progress.requiredCompleted === onboarding.progress.requiredTotal
  const canCompleteOnboarding = isActive && allRequiredComplete && canManage

  return (
    <div className='space-y-6'>
      {/* Empty Items Alert - shows when no items exist */}
      {onboarding.progress.total === 0 && isActive && canManage && (
        <Alert variant='destructive'>
          <AlertTriangle className='h-4 w-4' />
          <AlertTitle>No onboarding items found</AlertTitle>
          <AlertDescription>
            <div className='flex items-center justify-between gap-4'>
              <span>
                This onboarding has no items. This can happen if the template
                was updated after the onboarding was assigned. Click to reload
                items from the current template.
              </span>
              <Button
                size='sm'
                variant='outline'
                className='shrink-0'
                onClick={handleReinitialize}
                disabled={isSyncing}
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`}
                />
                {isSyncing ? 'Loading...' : 'Load Items'}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Out of Sync Alert - shows when some items are missing */}
      {onboarding.missingItemCount > 0 &&
        onboarding.progress.total > 0 &&
        isActive &&
        canManage && (
          <Alert
            variant='default'
            className='border-badge-warning/50 bg-badge-warning/10'
          >
            <AlertTriangle className='h-4 w-4 text-badge-warning-text' />
            <AlertTitle className='text-badge-warning-text'>
              Template has been updated
            </AlertTitle>
            <AlertDescription className='text-foreground'>
              <div className='flex items-center justify-between gap-4'>
                <span>
                  {onboarding.missingItemCount} new item
                  {onboarding.missingItemCount === 1 ? '' : 's'} have been added
                  to the template since this onboarding was assigned.
                </span>
                <Button
                  size='sm'
                  variant='outline'
                  className='shrink-0 border-badge-warning text-badge-warning-text hover:bg-badge-warning/20'
                  onClick={handleSyncItems}
                  disabled={isSyncing}
                >
                  <RefreshCw
                    className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`}
                  />
                  {isSyncing ? 'Syncing...' : 'Sync Items'}
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

      {/* Ready to Complete Alert - shows when all required items are done */}
      {canCompleteOnboarding && (
        <Alert
          variant='default'
          className='border-badge-success/50 bg-badge-success/10'
        >
          <Award className='h-4 w-4 text-badge-success-text' />
          <AlertTitle className='text-badge-success-text'>
            Ready to complete
          </AlertTitle>
          <AlertDescription className='text-foreground'>
            <div className='flex items-center justify-between gap-4'>
              <span>
                All {onboarding.progress.requiredTotal} required items have been
                completed. You can now mark this onboarding as complete.
              </span>
              <Button
                size='sm'
                className='shrink-0 bg-badge-success hover:bg-badge-success/80 text-badge-success-foreground'
                onClick={() => setShowCompleteDialog(true)}
                disabled={isCompleting}
              >
                <Award className='w-4 h-4 mr-2' />
                {isCompleting ? 'Completing...' : 'Complete Onboarding'}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Progress Overview */}
      <PageSection
        header={
          <SectionHeader
            icon={BarChart3}
            title='Progress Overview'
            action={
              <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
            }
          />
        }
      >
        <div className='space-y-4'>
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
        </div>
      </PageSection>

      {/* Phases */}
      <PageSection header={<SectionHeader icon={Layers} title='Phases' />}>
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
              <div key={phase.id} className='border rounded-lg'>
                <Collapsible
                  open={isExpanded}
                  onOpenChange={() => togglePhase(phase.id)}
                >
                  <CollapsibleTrigger asChild>
                    <div className='flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors'>
                      <div className='flex items-center gap-3'>
                        {isExpanded ? (
                          <ChevronDown className='w-5 h-5' />
                        ) : (
                          <ChevronRight className='w-5 h-5' />
                        )}
                        <div>
                          <div className='font-medium flex items-center gap-2'>
                            {phase.name}
                            {isComplete && (
                              <CheckCircle className='w-4 h-4 text-green-500' />
                            )}
                          </div>
                          <p className='text-sm text-muted-foreground'>
                            {phase.completed}/{phase.total} items
                          </p>
                        </div>
                      </div>
                      <Progress value={phasePercent} className='w-24 h-2' />
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className='p-4 pt-0 space-y-3'>
                      {items
                        .sort((a, b) => a.item.sortOrder - b.item.sortOrder)
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
                  </CollapsibleContent>
                </Collapsible>
              </div>
            )
          })}
        </div>
      </PageSection>

      {/* Complete Onboarding Confirmation Dialog */}
      <AlertDialog
        open={showCompleteDialog}
        onOpenChange={setShowCompleteDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Complete Onboarding</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark {personName}&apos;s onboarding as
              complete? This indicates the person has finished all required
              onboarding items.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleCompleteOnboarding}>
              Complete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
