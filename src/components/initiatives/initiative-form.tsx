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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useState } from 'react'
import { createInitiative } from '@/lib/actions/initiative'
import { type InitiativeFormData, initiativeSchema } from '@/lib/validations'
import { Rag } from '@/components/rag'
import { MarkdownEditor } from '@/components/markdown-editor'
import { AlertCircle, Trash2 } from 'lucide-react'

interface InitiativeFormProps {
  teams: Array<{ id: string; name: string }>
  people: Array<{ id: string; name: string; email: string | null }>
  preselectedOwnerId?: string
  preselectedTeamId?: string
}

export function InitiativeForm({
  teams,
  people,
  preselectedOwnerId,
  preselectedTeamId,
}: InitiativeFormProps) {
  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0]

  const [formData, setFormData] = useState<InitiativeFormData>({
    title: '',
    summary: '',
    outcome: '',
    startDate: today,
    targetDate: '',
    status: 'planned',
    rag: 'green',
    confidence: 80,
    teamId: preselectedTeamId || '',
    objectives: [],
    owners: [],
  })

  const [objectives, setObjectives] = useState([{ title: '', keyResult: '' }])
  const [owners, setOwners] = useState([
    {
      personId: preselectedOwnerId || '',
      role: 'owner' as const,
    },
  ])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrors({})

    try {
      const submitData = {
        ...formData,
        objectives: objectives.filter(obj => obj.title.trim()),
        owners: owners.filter(owner => owner.personId),
      }

      // Validate the form data using Zod schema
      const validatedData = initiativeSchema.parse(submitData)
      await createInitiative(validatedData)
    } catch (error: unknown) {
      console.error('Error creating initiative:', error)

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
            : 'Error creating initiative. Please try again.'
        setErrors({ general: errorMessage })
      }
    } finally {
      setIsSubmitting(false)
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

  const handleInputChange = (
    field: keyof InitiativeFormData,
    value: string | number | undefined
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  // Helper functions to convert between empty strings and "none" for Select components
  const getSelectValue = (value: string | undefined) => value || 'none'
  const getFormValue = (value: string) => (value === 'none' ? '' : value)

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      {/* General Error Message */}
      {errors.general && (
        <div className='bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-destructive text-sm flex items-center gap-2'>
          <AlertCircle className='h-4 w-4' />
          {errors.general}
        </div>
      )}

      <div className='flex flex-col lg:flex-row gap-6'>
        {/* Main Form Content */}
        <div className='flex-1 space-y-6'>
          {/* Basic Information */}
          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='text-lg'>Basic Information</CardTitle>
              <CardDescription className='text-sm'>
                Essential details about the initiative
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
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

              <div className='space-y-2'>
                <Label htmlFor='summary'>Summary</Label>
                <MarkdownEditor
                  value={formData.summary || ''}
                  onChange={value => handleInputChange('summary', value)}
                  placeholder='Brief description of the initiative... Use Markdown for formatting!'
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
                />
                {errors.outcome && (
                  <p className='text-sm text-destructive'>{errors.outcome}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='text-lg'>Timeline</CardTitle>
              <CardDescription className='text-sm'>
                Important dates for the initiative
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='startDate'>Start Date</Label>
                  <Input
                    id='startDate'
                    type='date'
                    value={formData.startDate}
                    onChange={e =>
                      handleInputChange('startDate', e.target.value)
                    }
                    className={errors.startDate ? 'border-destructive' : ''}
                  />
                  {errors.startDate && (
                    <p className='text-sm text-destructive'>
                      {errors.startDate}
                    </p>
                  )}
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='targetDate'>Target Date</Label>
                  <Input
                    id='targetDate'
                    type='date'
                    value={formData.targetDate}
                    onChange={e =>
                      handleInputChange('targetDate', e.target.value)
                    }
                    className={errors.targetDate ? 'border-destructive' : ''}
                  />
                  {errors.targetDate && (
                    <p className='text-sm text-destructive'>
                      {errors.targetDate}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Team Assignment */}
          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='text-lg'>Team Assignment</CardTitle>
              <CardDescription className='text-sm'>
                Assign the initiative to a team
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='team'>Team</Label>
                <Select
                  value={getSelectValue(formData.teamId)}
                  onValueChange={value =>
                    handleInputChange('teamId', getFormValue(value))
                  }
                >
                  <SelectTrigger
                    className={errors.teamId ? 'border-destructive' : ''}
                  >
                    <SelectValue placeholder='Select a team' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='none'>No team</SelectItem>
                    {teams.map(team => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.teamId && (
                  <p className='text-sm text-destructive'>{errors.teamId}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Status & Tracking */}
          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='text-lg'>Status & Tracking</CardTitle>
              <CardDescription className='text-sm'>
                Current status and progress tracking
              </CardDescription>
            </CardHeader>
            <CardContent>
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
                      handleInputChange(
                        'rag',
                        value as InitiativeFormData['rag']
                      )
                    }
                  >
                    <SelectTrigger
                      className={errors.rag ? 'border-destructive' : ''}
                    >
                      <SelectValue placeholder='Select RAG status' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='green'>Green</SelectItem>
                      <SelectItem value='amber'>Amber</SelectItem>
                      <SelectItem value='red'>Red</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className='mt-2'>
                    <Rag rag={formData.rag} />
                  </div>
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
                      handleInputChange(
                        'confidence',
                        parseInt(e.target.value) || 0
                      )
                    }
                    className={errors.confidence ? 'border-destructive' : ''}
                  />
                  {errors.confidence && (
                    <p className='text-sm text-destructive'>
                      {errors.confidence}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Objectives */}
          <Card>
            <CardHeader className='pb-3'>
              <div className='flex items-center justify-between'>
                <div>
                  <CardTitle className='text-lg'>Objectives</CardTitle>
                  <CardDescription className='text-sm'>
                    Define the goals and key results for this initiative
                  </CardDescription>
                </div>
                <Button
                  type='button'
                  onClick={addObjective}
                  variant='outline'
                  size='sm'
                >
                  Add Objective
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className='space-y-3'>
                {objectives.map((objective, index) => (
                  <div key={index} className='border rounded-xl p-3'>
                    <div className='flex items-center justify-between mb-2'>
                      <span className='text-sm font-medium'>
                        Objective {index + 1}
                      </span>
                      {objectives.length > 1 && (
                        <Button
                          type='button'
                          onClick={() => removeObjective(index)}
                          variant='outline'
                          size='sm'
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                    <div className='space-y-2'>
                      <div className='space-y-2'>
                        <Label htmlFor={`objective-title-${index}`}>
                          Title
                        </Label>
                        <Input
                          id={`objective-title-${index}`}
                          type='text'
                          value={objective.title}
                          onChange={e =>
                            updateObjective(index, 'title', e.target.value)
                          }
                          placeholder='Objective title'
                        />
                      </div>
                      <div className='space-y-2'>
                        <Label htmlFor={`objective-keyresult-${index}`}>
                          Key Result
                        </Label>
                        <Input
                          id={`objective-keyresult-${index}`}
                          type='text'
                          value={objective.keyResult}
                          onChange={e =>
                            updateObjective(index, 'keyResult', e.target.value)
                          }
                          placeholder='Key result (optional)'
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* People */}
          <Card>
            <CardHeader className='pb-3'>
              <div className='flex items-center justify-between'>
                <div>
                  <CardTitle className='text-lg'>People</CardTitle>
                  <CardDescription className='text-sm'>
                    Assign people responsible for this initiative
                  </CardDescription>
                </div>
                <Button
                  type='button'
                  onClick={addOwner}
                  variant='outline'
                  size='sm'
                >
                  Add Person
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className='space-y-0'>
                {owners.map((owner, index) => (
                  <div
                    key={index}
                    className={`p-3 ${index < owners.length - 1 ? 'border-b' : ''}`}
                  >
                    <div className='flex items-end gap-2'>
                      <div className='flex-1 grid grid-cols-1 md:grid-cols-2 gap-2'>
                        <div className='space-y-2'>
                          <Label htmlFor={`owner-person-${index}`}>
                            Person
                          </Label>
                          <Select
                            value={getSelectValue(owner.personId)}
                            onValueChange={value =>
                              updateOwner(
                                index,
                                'personId',
                                getFormValue(value)
                              )
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder='Select person' />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value='none'>No person</SelectItem>
                              {people.map(person => (
                                <SelectItem key={person.id} value={person.id}>
                                  {person.name}
                                  {person.email ? ` (${person.email})` : ''}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className='space-y-2'>
                          <Label htmlFor={`owner-role-${index}`}>Role</Label>
                          <Select
                            value={owner.role}
                            onValueChange={value =>
                              updateOwner(index, 'role', value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder='Select role' />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value='owner'>Owner</SelectItem>
                              <SelectItem value='sponsor'>Sponsor</SelectItem>
                              <SelectItem value='collaborator'>
                                Collaborator
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      {owners.length > 1 && (
                        <Button
                          type='button'
                          onClick={() => removeOwner(index)}
                          variant='outline'
                          size='sm'
                          className='h-10 w-10 p-0'
                        >
                          <Trash2 className='h-4 w-4' />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className='flex justify-end gap-2'>
            <Button
              type='submit'
              disabled={isSubmitting || !formData.title.trim()}
              className='min-w-[120px]'
            >
              {isSubmitting ? 'Creating...' : 'Create Initiative'}
            </Button>
          </div>
        </div>
      </div>
    </form>
  )
}
