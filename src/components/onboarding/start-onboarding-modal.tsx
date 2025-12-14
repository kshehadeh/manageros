'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getSuggestedTemplatesForPerson } from '@/lib/actions/onboarding-template'
import { assignOnboarding } from '@/lib/actions/onboarding-instance'
import { ClipboardList, Users, Briefcase, Star } from 'lucide-react'
import type { Person, Team, JobRole } from '@/generated/prisma'

type TemplateOption = {
  id: string
  name: string
  description: string | null
  isDefault: boolean
  team: Pick<Team, 'id' | 'name'> | null
  jobRole: Pick<JobRole, 'id' | 'title'> | null
  phases: {
    id: string
    name: string
    _count: { items: number }
  }[]
}

interface StartOnboardingModalProps {
  isOpen: boolean
  onClose: () => void
  person: Pick<Person, 'id' | 'name' | 'teamId' | 'jobRoleId' | 'managerId'>
  people: Pick<Person, 'id' | 'name'>[]
}

export function StartOnboardingModal({
  isOpen,
  onClose,
  person,
  people,
}: StartOnboardingModalProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [templates, setTemplates] = useState<TemplateOption[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [mentorId, setMentorId] = useState<string>('')

  useEffect(() => {
    const loadTemplates = async () => {
      setIsLoading(true)
      try {
        // Get suggested templates for this person
        const suggested = await getSuggestedTemplatesForPerson(person.id)
        setTemplates(suggested)

        // Auto-select the first (best match) template
        if (suggested.length > 0) {
          setSelectedTemplateId(suggested[0].id)
        }
      } catch (error) {
        console.error('Error loading templates:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (isOpen) {
      loadTemplates()
    }
  }, [isOpen, person.id])

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId)

  const handleSubmit = async () => {
    if (!selectedTemplateId) return

    setIsSubmitting(true)
    try {
      await assignOnboarding({
        templateId: selectedTemplateId,
        personId: person.id,
        managerId: person.managerId || undefined,
        mentorId: mentorId || undefined,
      })
      onClose()
      router.refresh()
    } catch (error) {
      console.error('Error assigning onboarding:', error)
      alert(
        error instanceof Error ? error.message : 'Failed to assign onboarding'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const getTotalItems = (template: TemplateOption) => {
    return template.phases.reduce((acc, phase) => acc + phase._count.items, 0)
  }

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className='sm:max-w-[600px]'>
        <DialogHeader>
          <DialogTitle>Start Onboarding for {person.name}</DialogTitle>
          <DialogDescription>
            Select an onboarding template and optionally assign a mentor to
            guide {person.name} through their first days.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-4'>
          {isLoading ? (
            <div className='space-y-4'>
              <Skeleton className='h-10 w-full' />
              <Skeleton className='h-24 w-full' />
            </div>
          ) : templates.length === 0 ? (
            <Card>
              <CardContent className='py-8 text-center'>
                <ClipboardList className='w-12 h-12 mx-auto text-muted-foreground mb-4' />
                <p className='text-muted-foreground mb-4'>
                  No onboarding templates available. Create a template first.
                </p>
                <Button asChild variant='outline'>
                  <a href='/organization/onboarding-templates/new'>
                    Create Template
                  </a>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className='space-y-2'>
                <Label>Onboarding Template *</Label>
                <Select
                  value={selectedTemplateId}
                  onValueChange={setSelectedTemplateId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select a template' />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map(template => (
                      <SelectItem key={template.id} value={template.id}>
                        <div className='flex items-center gap-2'>
                          {template.name}
                          {template.isDefault && (
                            <Star className='w-3 h-3 text-yellow-500' />
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedTemplate && (
                <Card>
                  <CardContent className='pt-4'>
                    <div className='space-y-3'>
                      <div className='flex items-start justify-between'>
                        <div>
                          <h4 className='font-medium'>
                            {selectedTemplate.name}
                          </h4>
                          {selectedTemplate.description && (
                            <p className='text-sm text-muted-foreground mt-1'>
                              {selectedTemplate.description}
                            </p>
                          )}
                        </div>
                        <div className='flex gap-1'>
                          {selectedTemplate.isDefault && (
                            <Badge variant='secondary' className='text-xs'>
                              <Star className='w-3 h-3 mr-1' />
                              Default
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className='flex flex-wrap gap-2'>
                        {selectedTemplate.team && (
                          <Badge variant='outline' className='text-xs'>
                            <Users className='w-3 h-3 mr-1' />
                            {selectedTemplate.team.name}
                          </Badge>
                        )}
                        {selectedTemplate.jobRole && (
                          <Badge variant='outline' className='text-xs'>
                            <Briefcase className='w-3 h-3 mr-1' />
                            {selectedTemplate.jobRole.title}
                          </Badge>
                        )}
                      </div>

                      <div className='text-sm'>
                        <span className='font-medium'>
                          {selectedTemplate.phases.length}
                        </span>{' '}
                        phases ·{' '}
                        <span className='font-medium'>
                          {getTotalItems(selectedTemplate)}
                        </span>{' '}
                        items
                      </div>

                      <div className='flex flex-wrap gap-2'>
                        {selectedTemplate.phases.map(phase => (
                          <Badge
                            key={phase.id}
                            variant='secondary'
                            className='text-xs'
                          >
                            {phase.name} ({phase._count.items})
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className='space-y-2'>
                <Label>Mentor (Optional)</Label>
                <Select value={mentorId} onValueChange={setMentorId}>
                  <SelectTrigger>
                    <SelectValue placeholder='Select a mentor' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='none'>No mentor</SelectItem>
                    {people
                      .filter(p => p.id !== person.id)
                      .map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <p className='text-xs text-muted-foreground'>
                  A mentor can help guide the onboardee and complete checkpoint
                  items
                </p>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isSubmitting || !selectedTemplateId || templates.length === 0
            }
          >
            {isSubmitting ? 'Starting...' : 'Start Onboarding'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
