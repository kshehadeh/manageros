'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { PageSection } from '@/components/ui/page-section'
import { SectionHeader } from '@/components/ui/section-header'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  onboardingTemplateSchema,
  type OnboardingTemplateFormData,
  type OnboardingPhaseFormData,
  type OnboardingItemFormData,
  ONBOARDING_ITEM_TYPES,
  ONBOARDING_OWNER_TYPES,
} from '@/lib/validations'
import {
  createOnboardingTemplate,
  updateOnboardingTemplate,
} from '@/lib/actions/onboarding-template'
import {
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  BookOpen,
  Users as UsersIcon,
  CheckCircle,
  Lightbulb,
  FileText,
  Layers,
  Settings,
} from 'lucide-react'
import type {
  Team,
  JobRole,
  OnboardingTemplate,
  OnboardingPhase,
  OnboardingItem,
} from '@/generated/prisma'

const ITEM_TYPE_ICONS = {
  TASK: ClipboardCheck,
  READING: BookOpen,
  MEETING: UsersIcon,
  CHECKPOINT: CheckCircle,
  EXPECTATION: Lightbulb,
}

const ITEM_TYPE_LABELS = {
  TASK: 'Task',
  READING: 'Reading',
  MEETING: 'Meeting',
  CHECKPOINT: 'Checkpoint',
  EXPECTATION: 'Expectation',
}

type TemplateWithRelations = OnboardingTemplate & {
  team: Pick<Team, 'id' | 'name'> | null
  jobRole: Pick<JobRole, 'id' | 'title'> | null
  phases: (OnboardingPhase & { items: OnboardingItem[] })[]
}

interface OnboardingTemplateFormProps {
  template?: TemplateWithRelations
  teams: Pick<Team, 'id' | 'name'>[]
  jobRoles: Pick<JobRole, 'id' | 'title'>[]
}

export function OnboardingTemplateForm({
  template,
  teams,
  jobRoles,
}: OnboardingTemplateFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Form state
  const [name, setName] = useState(template?.name || '')
  const [description, setDescription] = useState(template?.description || '')
  const [teamId, setTeamId] = useState(template?.teamId || '')
  const [jobRoleId, setJobRoleId] = useState(template?.jobRoleId || '')
  const [isDefault, setIsDefault] = useState(template?.isDefault || false)
  const [isActive, setIsActive] = useState(template?.isActive ?? true)

  const [phases, setPhases] = useState<OnboardingPhaseFormData[]>(() => {
    if (template?.phases && template.phases.length > 0) {
      return template.phases.map(phase => ({
        id: phase.id,
        name: phase.name,
        description: phase.description || '',
        sortOrder: phase.sortOrder,
        items: phase.items.map(item => ({
          id: item.id,
          title: item.title,
          description: item.description || '',
          type: item.type as (typeof ONBOARDING_ITEM_TYPES)[number],
          sortOrder: item.sortOrder,
          isRequired: item.isRequired,
          linkedTaskId: item.linkedTaskId || undefined,
          linkedInitiativeId: item.linkedInitiativeId || undefined,
          linkedUrl: item.linkedUrl || '',
          ownerType:
            (item.ownerType as 'onboardee' | 'manager' | 'mentor') || undefined,
        })),
      }))
    }
    return [{ name: 'Day 1', description: '', sortOrder: 0, items: [] }]
  })

  const [expandedPhases, setExpandedPhases] = useState<Set<number>>(
    new Set([0])
  )

  const togglePhase = (index: number) => {
    setExpandedPhases(prev => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  const addPhase = () => {
    setPhases([
      ...phases,
      {
        name: `Phase ${phases.length + 1}`,
        description: '',
        sortOrder: phases.length,
        items: [],
      },
    ])
    setExpandedPhases(prev => new Set([...prev, phases.length]))
  }

  const removePhase = (index: number) => {
    if (phases.length <= 1) return
    setPhases(phases.filter((_, i) => i !== index))
  }

  const updatePhase = (
    index: number,
    updates: Partial<OnboardingPhaseFormData>
  ) => {
    setPhases(phases.map((p, i) => (i === index ? { ...p, ...updates } : p)))
  }

  const addItem = (phaseIndex: number) => {
    const newItem: OnboardingItemFormData = {
      title: '',
      description: '',
      type: 'TASK',
      sortOrder: phases[phaseIndex].items.length,
      isRequired: true,
      linkedUrl: '',
    }
    updatePhase(phaseIndex, { items: [...phases[phaseIndex].items, newItem] })
  }

  const removeItem = (phaseIndex: number, itemIndex: number) => {
    updatePhase(phaseIndex, {
      items: phases[phaseIndex].items.filter((_, i) => i !== itemIndex),
    })
  }

  const updateItem = (
    phaseIndex: number,
    itemIndex: number,
    updates: Partial<OnboardingItemFormData>
  ) => {
    updatePhase(phaseIndex, {
      items: phases[phaseIndex].items.map((item, i) =>
        i === itemIndex ? { ...item, ...updates } : item
      ),
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrors({})

    try {
      const formData: OnboardingTemplateFormData = {
        name,
        description,
        teamId: teamId || undefined,
        jobRoleId: jobRoleId || undefined,
        isDefault,
        isActive,
        phases,
      }

      // Validate with Zod
      const validatedData = onboardingTemplateSchema.parse(formData)

      if (template) {
        await updateOnboardingTemplate(template.id, validatedData)
      } else {
        await createOnboardingTemplate(validatedData)
      }

      router.push('/organization/onboarding-templates')
      router.refresh()
    } catch (error: unknown) {
      console.error('Error saving template:', error)
      if (error && typeof error === 'object' && 'issues' in error) {
        const fieldErrors: Record<string, string> = {}
        const zodError = error as {
          issues: Array<{ path: (string | number)[]; message: string }>
        }
        zodError.issues.forEach(issue => {
          const path = issue.path.join('.')
          fieldErrors[path] = issue.message
        })
        setErrors(fieldErrors)
      } else {
        alert(
          error instanceof Error ? error.message : 'Failed to save template'
        )
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-8'>
      {/* Basic Information */}
      <PageSection
        header={<SectionHeader icon={FileText} title='Template Information' />}
      >
        <div className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='name'>Template Name *</Label>
            <Input
              id='name'
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder='e.g., Engineering Onboarding'
            />
            {errors.name && (
              <p className='text-sm text-destructive'>{errors.name}</p>
            )}
          </div>

          <div className='space-y-2'>
            <Label htmlFor='description'>Description</Label>
            <Textarea
              id='description'
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder='Describe the purpose and scope of this onboarding template'
              rows={3}
            />
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='teamId'>Team (Optional)</Label>
              <Select
                value={teamId || 'none'}
                onValueChange={v => setTeamId(v === 'none' ? '' : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select team' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='none'>No specific team</SelectItem>
                  {teams.map(team => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className='text-xs text-muted-foreground'>
                Template will be suggested for people in this team
              </p>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='jobRoleId'>Job Role (Optional)</Label>
              <Select
                value={jobRoleId || 'none'}
                onValueChange={v => setJobRoleId(v === 'none' ? '' : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select job role' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='none'>No specific role</SelectItem>
                  {jobRoles.map(role => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className='text-xs text-muted-foreground'>
                Template will be suggested for people with this role
              </p>
            </div>
          </div>
        </div>
      </PageSection>

      {/* Settings */}
      <PageSection header={<SectionHeader icon={Settings} title='Settings' />}>
        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <div className='space-y-0.5'>
              <Label htmlFor='isDefault'>Default Template</Label>
              <p className='text-xs text-muted-foreground'>
                Use this template when no specific match is found
              </p>
            </div>
            <Switch
              id='isDefault'
              checked={isDefault}
              onCheckedChange={setIsDefault}
            />
          </div>

          <div className='flex items-center justify-between'>
            <div className='space-y-0.5'>
              <Label htmlFor='isActive'>Active</Label>
              <p className='text-xs text-muted-foreground'>
                Inactive templates cannot be assigned to new people
              </p>
            </div>
            <Switch
              id='isActive'
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>
        </div>
      </PageSection>

      {/* Phases */}
      <PageSection
        header={
          <SectionHeader
            icon={Layers}
            title='Phases'
            description='Define the phases of onboarding (e.g., Day 1, Week 1, First 30 Days)'
            action={
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={addPhase}
              >
                <Plus className='w-4 h-4 mr-2' />
                Add Phase
              </Button>
            }
          />
        }
      >
        {errors.phases && (
          <p className='text-sm text-destructive mb-4'>{errors.phases}</p>
        )}

        <div className='space-y-4'>
          {phases.map((phase, phaseIndex) => (
            <div key={phaseIndex} className='border rounded-lg'>
              <Collapsible
                open={expandedPhases.has(phaseIndex)}
                onOpenChange={() => togglePhase(phaseIndex)}
              >
                <CollapsibleTrigger asChild>
                  <div className='flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors'>
                    <div className='flex items-center gap-2'>
                      <GripVertical className='w-4 h-4 text-muted-foreground' />
                      {expandedPhases.has(phaseIndex) ? (
                        <ChevronDown className='w-4 h-4' />
                      ) : (
                        <ChevronRight className='w-4 h-4' />
                      )}
                      <span className='font-medium'>
                        {phase.name || `Phase ${phaseIndex + 1}`}
                      </span>
                      <span className='text-sm text-muted-foreground'>
                        ({phase.items.length} items)
                      </span>
                    </div>
                    {phases.length > 1 && (
                      <Button
                        type='button'
                        variant='ghost'
                        size='sm'
                        onClick={e => {
                          e.stopPropagation()
                          removePhase(phaseIndex)
                        }}
                      >
                        <Trash2 className='w-4 h-4' />
                      </Button>
                    )}
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className='p-4 pt-0 space-y-4'>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      <div className='space-y-2'>
                        <Label>Phase Name *</Label>
                        <Input
                          value={phase.name}
                          onChange={e =>
                            updatePhase(phaseIndex, { name: e.target.value })
                          }
                          placeholder='e.g., Day 1'
                        />
                      </div>
                      <div className='space-y-2'>
                        <Label>Description</Label>
                        <Input
                          value={phase.description}
                          onChange={e =>
                            updatePhase(phaseIndex, {
                              description: e.target.value,
                            })
                          }
                          placeholder='Optional description'
                        />
                      </div>
                    </div>

                    {/* Items */}
                    <div className='space-y-3'>
                      <div className='flex items-center justify-between'>
                        <Label>Items</Label>
                        <Button
                          type='button'
                          variant='outline'
                          size='sm'
                          onClick={() => addItem(phaseIndex)}
                        >
                          <Plus className='w-4 h-4 mr-1' />
                          Add Item
                        </Button>
                      </div>

                      {phase.items.length === 0 ? (
                        <p className='text-sm text-muted-foreground text-center py-4'>
                          No items yet. Add tasks, readings, meetings, or
                          checkpoints.
                        </p>
                      ) : (
                        <div className='space-y-2'>
                          {phase.items.map((item, itemIndex) => (
                            <ItemRow
                              key={itemIndex}
                              item={item}
                              onUpdate={updates =>
                                updateItem(phaseIndex, itemIndex, updates)
                              }
                              onRemove={() => removeItem(phaseIndex, itemIndex)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          ))}
        </div>
      </PageSection>

      {/* Actions */}
      <div className='flex items-center justify-end gap-4 pt-4 border-t'>
        <Button
          type='button'
          variant='outline'
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type='submit' disabled={isSubmitting}>
          {isSubmitting
            ? 'Saving...'
            : template
              ? 'Update Template'
              : 'Create Template'}
        </Button>
      </div>
    </form>
  )
}

interface ItemRowProps {
  item: OnboardingItemFormData
  onUpdate: (updates: Partial<OnboardingItemFormData>) => void
  onRemove: () => void
}

function ItemRow({ item, onUpdate, onRemove }: ItemRowProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const ItemIcon =
    ITEM_TYPE_ICONS[item.type as keyof typeof ITEM_TYPE_ICONS] || ClipboardCheck

  return (
    <div className='border rounded-lg p-3 space-y-3'>
      <div className='flex items-center gap-2'>
        <GripVertical className='w-4 h-4 text-muted-foreground flex-shrink-0' />
        <ItemIcon className='w-4 h-4 text-muted-foreground flex-shrink-0' />
        <Input
          value={item.title}
          onChange={e => onUpdate({ title: e.target.value })}
          placeholder='Item title'
          className='flex-1'
        />
        <Select
          value={item.type}
          onValueChange={v =>
            onUpdate({ type: v as (typeof ONBOARDING_ITEM_TYPES)[number] })
          }
        >
          <SelectTrigger className='w-32'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ONBOARDING_ITEM_TYPES.map(type => (
              <SelectItem key={type} value={type}>
                {ITEM_TYPE_LABELS[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className='flex items-center gap-2'>
          <Switch
            checked={item.isRequired}
            onCheckedChange={checked => onUpdate({ isRequired: checked })}
          />
          <span className='text-xs text-muted-foreground'>Required</span>
        </div>
        <Button
          type='button'
          variant='ghost'
          size='sm'
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <ChevronDown className='w-4 h-4' />
          ) : (
            <ChevronRight className='w-4 h-4' />
          )}
        </Button>
        <Button type='button' variant='ghost' size='sm' onClick={onRemove}>
          <Trash2 className='w-4 h-4' />
        </Button>
      </div>

      {isExpanded && (
        <div className='space-y-3 pl-10'>
          <div className='space-y-2'>
            <Label>Description</Label>
            <Textarea
              value={item.description}
              onChange={e => onUpdate({ description: e.target.value })}
              placeholder='Detailed instructions or context'
              rows={2}
            />
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label>Link URL (Optional)</Label>
              <Input
                value={item.linkedUrl}
                onChange={e => onUpdate({ linkedUrl: e.target.value })}
                placeholder='https://...'
                type='url'
              />
            </div>

            {item.type === 'CHECKPOINT' && (
              <div className='space-y-2'>
                <Label>Owner</Label>
                <Select
                  value={item.ownerType || 'onboardee'}
                  onValueChange={v =>
                    onUpdate({
                      ownerType: v as (typeof ONBOARDING_OWNER_TYPES)[number],
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='onboardee'>Onboardee</SelectItem>
                    <SelectItem value='manager'>Manager</SelectItem>
                    <SelectItem value='mentor'>Mentor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
