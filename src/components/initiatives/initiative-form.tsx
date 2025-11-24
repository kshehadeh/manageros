'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PersonSelect } from '@/components/ui/person-select'
import { TeamSelect } from '@/components/ui/team-select'
import { DateTimePickerWithNaturalInput } from '@/components/ui/datetime-picker-with-natural-input'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateInitiative, createInitiative } from '@/lib/actions/initiative'
import { type InitiativeFormData, initiativeSchema } from '@/lib/validations'
import { RagCircle } from '@/components/rag'
import { MarkdownEditor } from '@/components/markdown-editor'
import {
  Trash2,
  Rocket,
  Calendar,
  Target,
  Users,
  SettingsIcon,
  ArrowRight,
} from 'lucide-react'
import { FormTemplate, type FormSection } from '@/components/ui/form-template'

interface InitiativeFormProps {
  initiative?: {
    id: string
    title: string
    summary: string | null
    outcome: string | null
    startDate: Date | null
    targetDate: Date | null
    status: string
    rag: string
    confidence: number
    teamId: string | null
    objectives: Array<{
      id: string
      title: string
      keyResult: string | null
    }>
    owners: Array<{
      personId: string
      role: string
      person: {
        id: string
        name: string
      }
    }>
  }
  preselectedOwnerId?: string
  preselectedTeamId?: string
}

export function InitiativeForm({
  initiative,
  preselectedOwnerId,
  preselectedTeamId,
}: InitiativeFormProps) {
  // Format dates for input fields - convert Date to ISO string
  const formatDateToISO = (date: Date | null) => {
    if (!date) return ''
    return new Date(date).toISOString()
  }

  // Get today's date for new initiatives
  const today = new Date().toISOString()

  const [formData, setFormData] = useState<InitiativeFormData>({
    title: initiative?.title || '',
    summary: initiative?.summary || '',
    outcome: initiative?.outcome || '',
    startDate: initiative ? formatDateToISO(initiative.startDate) : today,
    targetDate: initiative ? formatDateToISO(initiative.targetDate) : '',
    status: (initiative?.status as InitiativeFormData['status']) || 'planned',
    rag: (initiative?.rag as InitiativeFormData['rag']) || 'green',
    confidence: initiative?.confidence || 80,
    teamId: initiative?.teamId || preselectedTeamId || '',
    objectives:
      initiative?.objectives.map(obj => ({
        title: obj.title,
        keyResult: obj.keyResult || '',
      })) || [],
    owners:
      initiative?.owners.map(owner => ({
        personId: owner.personId,
        role: owner.role as 'owner' | 'sponsor' | 'collaborator',
      })) || [],
  })

  const [objectives, setObjectives] = useState(
    initiative?.objectives && initiative.objectives.length > 0
      ? initiative.objectives.map(obj => ({
          title: obj.title,
          keyResult: obj.keyResult || '',
        }))
      : [{ title: '', keyResult: '' }]
  )

  const [owners, setOwners] = useState(
    initiative?.owners && initiative.owners.length > 0
      ? initiative.owners.map(owner => ({
          personId: owner.personId,
          role: owner.role as 'owner' | 'sponsor' | 'collaborator',
        }))
      : [{ personId: preselectedOwnerId || '', role: 'owner' as const }]
  )

  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrors({})

    let result
    try {
      const submitData = {
        ...formData,
        objectives: objectives.filter(obj => obj.title.trim()),
        owners: owners.filter(owner => owner.personId),
      }

      // Validate the form data using Zod schema
      const validatedData = initiativeSchema.parse(submitData)

      if (initiative) {
        result = await updateInitiative(initiative.id, validatedData)
      } else {
        result = await createInitiative(validatedData)
      }
    } catch (error: unknown) {
      console.error(
        `Error ${initiative ? 'updating' : 'creating'} initiative:`,
        error
      )

      if (error && typeof error === 'object' && 'issues' in error) {
        // Handle Zod validation errors
        const fieldErrors: Record<string, string> = {}
        const zodError = error as {
          issues: Array<{ path: string[]; message: string }>
        }
        zodError.issues.forEach(issue => {
          if (issue.path && issue.path.length > 0) {
            fieldErrors[issue.path[0]] = issue.message
          }
        })
        setErrors(fieldErrors)
      } else {
        // Handle other errors (server errors, etc.)
        const errorMessage =
          error instanceof Error
            ? error.message
            : `Error ${initiative ? 'updating' : 'creating'} initiative. Please try again.`
        setErrors({ general: errorMessage })
      }
      setIsSubmitting(false)
      return
    }

    // Redirect outside of try-catch block
    setIsSubmitting(false)
    if (initiative) {
      // When updating, redirect to the initiative detail page
      router.push(`/initiatives/${initiative.id}`)
    } else if (result?.id) {
      // When creating, redirect to the new initiative detail page
      router.push(`/initiatives/${result.id}`)
    }
  }

  const handleInputChange = (
    field: keyof InitiativeFormData,
    value: string | number | undefined
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const addObjective = () => {
    setObjectives([...objectives, { title: '', keyResult: '' }])
  }

  const removeObjective = (index: number) => {
    setObjectives(objectives.filter((_, i) => i !== index))
  }

  const updateObjective = (
    index: number,
    field: 'title' | 'keyResult',
    value: string
  ) => {
    const updated = objectives.map((obj, i) =>
      i === index ? { ...obj, [field]: value } : obj
    )
    setObjectives(updated)
  }

  const addOwner = () => {
    setOwners([...owners, { personId: '', role: 'owner' as const }])
  }

  const removeOwner = (index: number) => {
    setOwners(owners.filter((_, i) => i !== index))
  }

  const updateOwner = (
    index: number,
    field: 'personId' | 'role',
    value: string
  ) => {
    const updated = owners.map((owner, i) =>
      i === index ? { ...owner, [field]: value } : owner
    )
    setOwners(updated)
  }

  // Helper functions to convert between empty strings and "none" for Select components
  const getSelectValue = (value: string | undefined) => value || 'none'
  const getFormValue = (value: string) => (value === 'none' ? '' : value)

  // Define sections for the form template
  const sections: FormSection[] = [
    {
      title: 'Basic Information',
      icon: SettingsIcon,
      content: (
        <>
          <div className='space-y-2'>
            <Label htmlFor='title'>
              Title <span className='text-destructive'>*</span>
            </Label>
            <Input
              id='title'
              type='text'
              value={formData.title}
              onChange={e => handleInputChange('title', e.target.value)}
              placeholder='Enter initiative title'
              className={errors.title ? 'border-destructive' : ''}
              required
            />
            {errors.title && (
              <p className='text-sm text-destructive'>{errors.title}</p>
            )}
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='status'>Status</Label>
              <Select
                value={formData.status}
                onValueChange={value =>
                  handleInputChange(
                    'status',
                    value as InitiativeFormData['status']
                  )
                }
              >
                <SelectTrigger
                  className={errors.status ? 'border-destructive' : ''}
                >
                  <SelectValue placeholder='Select status' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='planned'>Planned</SelectItem>
                  <SelectItem value='in_progress'>In Progress</SelectItem>
                  <SelectItem value='paused'>Paused</SelectItem>
                  <SelectItem value='done'>Done</SelectItem>
                  <SelectItem value='canceled'>Canceled</SelectItem>
                </SelectContent>
              </Select>
              {errors.status && (
                <p className='text-sm text-destructive'>{errors.status}</p>
              )}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='rag'>RAG Status</Label>
              <Select
                value={formData.rag}
                onValueChange={value =>
                  handleInputChange('rag', value as InitiativeFormData['rag'])
                }
              >
                <SelectTrigger
                  className={errors.rag ? 'border-destructive' : ''}
                >
                  <SelectValue placeholder='Select RAG status' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='green'>
                    <div className='flex items-center gap-2'>
                      <RagCircle rag='green' size='small' />
                      <span>Green</span>
                    </div>
                  </SelectItem>
                  <SelectItem value='amber'>
                    <div className='flex items-center gap-2'>
                      <RagCircle rag='amber' size='small' />
                      <span>Amber</span>
                    </div>
                  </SelectItem>
                  <SelectItem value='red'>
                    <div className='flex items-center gap-2'>
                      <RagCircle rag='red' size='small' />
                      <span>Red</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.rag && (
                <p className='text-sm text-destructive'>{errors.rag}</p>
              )}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='confidence'>Confidence (%)</Label>
              <Input
                id='confidence'
                type='number'
                min='0'
                max='100'
                value={formData.confidence}
                onChange={e =>
                  handleInputChange('confidence', parseInt(e.target.value) || 0)
                }
                className={errors.confidence ? 'border-destructive' : ''}
              />
              {errors.confidence && (
                <p className='text-sm text-destructive'>{errors.confidence}</p>
              )}
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='summary'>Summary</Label>
            <MarkdownEditor
              value={formData.summary || ''}
              onChange={value => handleInputChange('summary', value)}
              placeholder='Brief description of the initiative... Use Markdown for formatting!'
              heightClassName='max-h-[200px]'
            />
            {errors.summary && (
              <p className='text-sm text-destructive'>{errors.summary}</p>
            )}
          </div>

          <div className='space-y-2'>
            <Label htmlFor='outcome'>Expected Outcome</Label>
            <MarkdownEditor
              value={formData.outcome || ''}
              onChange={value => handleInputChange('outcome', value)}
              placeholder='What success looks like... Use Markdown for formatting!'
              heightClassName='max-h-[200px]'
            />
            {errors.outcome && (
              <p className='text-sm text-destructive'>{errors.outcome}</p>
            )}
          </div>
        </>
      ),
    },
    {
      title: 'Timeline',
      icon: Calendar,
      content: (
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <DateTimePickerWithNaturalInput
            label='Start Date'
            value={formData.startDate}
            onChange={value => handleInputChange('startDate', value)}
            placeholder='Pick start date and time'
            error={!!errors.startDate}
            className={errors.startDate ? 'border-destructive' : ''}
          />
          {errors.startDate && (
            <p className='text-sm text-destructive'>{errors.startDate}</p>
          )}

          <DateTimePickerWithNaturalInput
            label='Target Date'
            value={formData.targetDate}
            onChange={value => handleInputChange('targetDate', value)}
            placeholder='Pick target date and time'
            error={!!errors.targetDate}
            className={errors.targetDate ? 'border-destructive' : ''}
          />
          {errors.targetDate && (
            <p className='text-sm text-destructive'>{errors.targetDate}</p>
          )}
        </div>
      ),
    },
    {
      title: 'Team Assignment',
      icon: Users,
      content: (
        <div className='space-y-2'>
          <Label htmlFor='team'>Team</Label>
          <TeamSelect
            value={getSelectValue(formData.teamId)}
            onValueChange={value =>
              handleInputChange('teamId', getFormValue(value))
            }
            placeholder='Select a team'
            includeNone={true}
            className={errors.teamId ? 'border-destructive' : ''}
          />
          {errors.teamId && (
            <p className='text-sm text-destructive'>{errors.teamId}</p>
          )}
        </div>
      ),
    },
    {
      title: 'Objectives',
      icon: Target,
      action: (
        <Button
          type='button'
          onClick={addObjective}
          variant='outline'
          size='sm'
        >
          Add Objective
        </Button>
      ),
      content: (
        <div className='space-y-4'>
          {objectives.map((objective, index) => (
            <div key={index}>
              <div className='space-y-2'>
                <div className='flex items-center gap-2'>
                  <Input
                    id={`objective-title-${index}`}
                    type='text'
                    value={objective.title}
                    onChange={e =>
                      updateObjective(index, 'title', e.target.value)
                    }
                    placeholder='Objective title'
                    className='flex-1'
                  />
                  {objectives.length > 1 && (
                    <Button
                      type='button'
                      onClick={() => removeObjective(index)}
                      variant='outline'
                      size='sm'
                      className='h-10 w-10 p-0 text-destructive hover:text-destructive hover:bg-destructive/10'
                    >
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  )}
                </div>
                <div className='flex items-center gap-2 ml-6'>
                  <ArrowRight className='h-4 w-4 text-muted-foreground shrink-0' />
                  <Input
                    id={`objective-keyresult-${index}`}
                    type='text'
                    value={objective.keyResult}
                    onChange={e =>
                      updateObjective(index, 'keyResult', e.target.value)
                    }
                    placeholder='Key result (optional)'
                    className='flex-1'
                  />
                </div>
              </div>
              {index < objectives.length - 1 && (
                <div className='border-b border-muted mt-4' />
              )}
            </div>
          ))}
        </div>
      ),
    },
    {
      title: 'People',
      icon: Users,
      action: (
        <Button type='button' onClick={addOwner} variant='outline' size='sm'>
          Add Person
        </Button>
      ),
      content: (
        <div className='space-y-0'>
          {owners.map((owner, index) => (
            <div
              key={index}
              className={`p-3 ${index < owners.length - 1 ? 'border-b' : ''}`}
            >
              <div className='flex items-center gap-2'>
                <div className='flex-1 grid grid-cols-1 md:grid-cols-2 gap-2 items-center'>
                  <PersonSelect
                    value={getSelectValue(owner.personId)}
                    onValueChange={value =>
                      updateOwner(index, 'personId', getFormValue(value))
                    }
                    placeholder='Select person'
                    includeNone={true}
                    noneLabel='No person'
                    showAvatar={true}
                    showRole={true}
                    className='h-10'
                  />
                  <Select
                    value={owner.role}
                    onValueChange={value => updateOwner(index, 'role', value)}
                  >
                    <SelectTrigger className='h-10'>
                      <SelectValue placeholder='Select role' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='owner'>Owner</SelectItem>
                      <SelectItem value='sponsor'>Sponsor</SelectItem>
                      <SelectItem value='collaborator'>Collaborator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {owners.length > 1 && (
                  <Button
                    type='button'
                    onClick={() => removeOwner(index)}
                    variant='destructive'
                    size='sm'
                    className='h-10 w-10 p-0 shrink-0 self-center'
                  >
                    <Trash2 className='h-4 w-4' />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      ),
    },
  ]

  return (
    <FormTemplate
      sections={sections}
      onSubmit={handleSubmit}
      submitButton={{
        text: initiative ? 'Update Initiative' : 'Create Initiative',
        loadingText: initiative ? 'Updating...' : 'Creating...',
        disabled: !formData.title.trim(),
      }}
      generalError={errors.general}
      isSubmitting={isSubmitting}
      header={{
        icon: Rocket,
        title: initiative ? 'Edit Initiative' : 'Create Initiative',
      }}
    />
  )
}
