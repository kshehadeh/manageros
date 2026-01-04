'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Target, TargetIcon, Plus } from 'lucide-react'
import { SectionHeader } from '@/components/ui/section-header'
import { PageSection } from '@/components/ui/page-section'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createObjective } from '@/lib/actions/initiative'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface InitiativeObjectivesProps {
  objectives: Array<{
    id: string
    title: string
    keyResult: string | null
    sortIndex: number
  }>
  initiativeId: string
  canEdit?: boolean
}

export function InitiativeObjectives({
  objectives,
  initiativeId,
  canEdit = false,
}: InitiativeObjectivesProps) {
  const router = useRouter()
  const [showObjectiveModal, setShowObjectiveModal] = useState(false)
  const [isSubmittingObjective, setIsSubmittingObjective] = useState(false)
  const [objectiveFormData, setObjectiveFormData] = useState({
    title: '',
    keyResult: '',
  })

  const handleObjectiveSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmittingObjective(true)

    try {
      await createObjective(
        initiativeId,
        objectiveFormData.title,
        objectiveFormData.keyResult || undefined
      )

      toast.success('Objective created successfully')
      setShowObjectiveModal(false)
      setObjectiveFormData({
        title: '',
        keyResult: '',
      })
      router.refresh()
    } catch (error) {
      console.error('Failed to create objective:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to create objective'
      )
    } finally {
      setIsSubmittingObjective(false)
    }
  }

  return (
    <>
      <PageSection
        header={
          <SectionHeader
            icon={Target}
            title='Objectives & Key Results'
            className='mb-4'
            action={
              canEdit ? (
                <button
                  onClick={() => setShowObjectiveModal(true)}
                  className={cn(
                    'inline-flex items-center gap-1 text-sm text-muted-foreground',
                    'hover:text-foreground transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    'bg-transparent border-none p-0 cursor-pointer'
                  )}
                  title='Add Objective'
                >
                  <Plus className='w-3.5 h-3.5' />
                  Add Objective
                </button>
              ) : undefined
            }
          />
        }
      >
        <div className='space-y-4'>
          {objectives.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-8 text-center'>
              <TargetIcon className='h-8 w-8 text-muted-foreground mb-2' />
              <p className='text-muted-foreground text-sm mb-4'>
                No objectives yet
              </p>
            </div>
          ) : (
            objectives
              .sort((a, b) => a.sortIndex - b.sortIndex)
              .map(objective => (
                <div
                  key={objective.id}
                  className='border border-border rounded-lg p-4'
                >
                  <div className='space-y-2'>
                    <h4 className='font-medium text-sm'>{objective.title}</h4>
                    {objective.keyResult && (
                      <div className='text-sm text-muted-foreground'>
                        <span className='font-medium'>Key Result:</span>{' '}
                        {objective.keyResult}
                      </div>
                    )}
                  </div>
                </div>
              ))
          )}
        </div>
      </PageSection>

      {/* Add Objective Modal */}
      <Dialog open={showObjectiveModal} onOpenChange={setShowObjectiveModal}>
        <DialogContent size='sm'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <Target className='h-5 w-5' />
              Add New Objective
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleObjectiveSubmit} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='objective-title'>Objective Title</Label>
              <Input
                id='objective-title'
                value={objectiveFormData.title}
                onChange={e =>
                  setObjectiveFormData(prev => ({
                    ...prev,
                    title: e.target.value,
                  }))
                }
                placeholder='Enter objective title'
                required
                disabled={isSubmittingObjective}
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='objective-keyResult'>Key Result (Optional)</Label>
              <Textarea
                id='objective-keyResult'
                value={objectiveFormData.keyResult}
                onChange={e =>
                  setObjectiveFormData(prev => ({
                    ...prev,
                    keyResult: e.target.value,
                  }))
                }
                placeholder='Enter key result description'
                rows={3}
                disabled={isSubmittingObjective}
              />
            </div>

            <div className='flex justify-end gap-2'>
              <Button
                type='button'
                variant='outline'
                onClick={() => setShowObjectiveModal(false)}
                disabled={isSubmittingObjective}
              >
                Cancel
              </Button>
              <Button
                type='submit'
                disabled={
                  isSubmittingObjective || !objectiveFormData.title.trim()
                }
              >
                {isSubmittingObjective ? 'Creating...' : 'Create Objective'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
