'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Textarea } from '@/components/ui/textarea'
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

interface Phase {
  id: string
  name: string
  sortOrder: number
  items: ProgressItem[]
}

interface ProgressItem {
  id: string
  status: OnboardingItemStatus
  completedAt: Date | null
  notes: string | null
  completedBy: { id: string; name: string } | null
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
}

interface OnboardingChecklistProps {
  templateName: string
  templateDescription: string | null
  phases: Phase[]
  progress: {
    total: number
    completed: number
    percentComplete: number
  }
  manager: { id: string; name: string; avatar: string | null } | null
  mentor: { id: string; name: string; avatar: string | null } | null
  isCheckpointCompleter: boolean
}

export function OnboardingChecklist({
  templateName,
  templateDescription,
  phases,
  progress,
  manager,
  mentor,
  isCheckpointCompleter,
}: OnboardingChecklistProps) {
  const router = useRouter()
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(() => {
    // Expand first incomplete phase by default
    const firstIncomplete = phases.find(phase =>
      phase.items.some(
        item => item.status === 'PENDING' || item.status === 'IN_PROGRESS'
      )
    )
    return new Set(firstIncomplete ? [firstIncomplete.id] : [phases[0]?.id])
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

  const getPhaseProgress = (phase: Phase) => {
    const total = phase.items.length
    const completed = phase.items.filter(
      item => item.status === 'COMPLETED' || item.status === 'SKIPPED'
    ).length
    return {
      total,
      completed,
      percent: total > 0 ? Math.round((completed / total) * 100) : 0,
    }
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className='flex items-start justify-between'>
            <div>
              <CardTitle>{templateName}</CardTitle>
              {templateDescription && (
                <p className='text-sm text-muted-foreground mt-1'>
                  {templateDescription}
                </p>
              )}
            </div>
            <Badge variant='outline'>
              {progress.completed}/{progress.total} completed
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={progress.percentComplete} className='h-3' />
          <div className='flex justify-between mt-2 text-sm text-muted-foreground'>
            <span>{progress.percentComplete}% complete</span>
            {manager && <span>Manager: {manager.name}</span>}
            {mentor && <span>Mentor: {mentor.name}</span>}
          </div>
        </CardContent>
      </Card>

      {/* Phases */}
      <div className='space-y-4'>
        {phases.map(phase => {
          const phaseProgress = getPhaseProgress(phase)
          const isExpanded = expandedPhases.has(phase.id)
          const isComplete = phaseProgress.completed === phaseProgress.total

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
                            {phaseProgress.completed}/{phaseProgress.total}{' '}
                            items
                          </p>
                        </div>
                      </div>
                      <Progress
                        value={phaseProgress.percent}
                        className='w-24 h-2'
                      />
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <CardContent className='pt-0'>
                    <div className='space-y-3'>
                      {phase.items.map(item => (
                        <ItemCard
                          key={item.id}
                          item={item}
                          isUpdating={updatingItems.has(item.id)}
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
  item: ProgressItem
  isUpdating: boolean
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
  isCheckpointCompleter,
  onUpdateStatus,
}: ItemCardProps) {
  const [showNotes, setShowNotes] = useState(false)
  const [notes, setNotes] = useState(item.notes || '')

  const ItemIcon = ITEM_TYPE_ICONS[item.item.type]
  const StatusIcon = STATUS_ICONS[item.status]
  const isComplete = item.status === 'COMPLETED' || item.status === 'SKIPPED'
  const canComplete = item.item.type !== 'CHECKPOINT' || isCheckpointCompleter

  return (
    <div
      className={`p-4 border rounded-lg transition-colors ${
        isComplete ? 'bg-muted/30' : 'bg-background'
      }`}
    >
      <div className='flex items-start gap-3'>
        <div
          className={`mt-0.5 ${
            isComplete ? 'text-green-500' : 'text-muted-foreground'
          }`}
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
              <div className='flex items-center gap-2'>
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

              {item.completedAt && item.completedBy && (
                <p className='text-xs text-muted-foreground mt-2'>
                  Completed by {item.completedBy.name} on{' '}
                  {new Date(item.completedAt).toLocaleDateString()}
                </p>
              )}

              {item.notes && (
                <p className='text-sm text-muted-foreground mt-2 italic'>
                  Note: {item.notes}
                </p>
              )}
            </div>

            {!isComplete && canComplete && (
              <div className='flex items-center gap-2'>
                {showNotes ? (
                  <div className='flex flex-col gap-2'>
                    <Textarea
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder='Add a note (optional)'
                      className='text-sm'
                      rows={2}
                    />
                    <div className='flex gap-2'>
                      <Button
                        size='sm'
                        onClick={() =>
                          onUpdateStatus(item.id, 'COMPLETED', notes)
                        }
                        disabled={isUpdating}
                      >
                        {isUpdating ? 'Saving...' : 'Complete'}
                      </Button>
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => setShowNotes(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={() => setShowNotes(true)}
                    disabled={isUpdating}
                  >
                    <Check className='w-4 h-4 mr-1' />
                    Complete
                  </Button>
                )}
              </div>
            )}

            {!isComplete && !canComplete && item.item.type === 'CHECKPOINT' && (
              <Badge variant='secondary'>
                Requires {item.item.ownerType || 'manager'} approval
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
