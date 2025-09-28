'use client'

import { Button } from '@/components/ui/button'

import { useState } from 'react'
import { createInitiative } from '@/lib/actions'
import { type InitiativeFormData } from '@/lib/validations'
import { Rag } from '@/components/rag'

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
        // Convert empty strings to undefined for optional fields
        teamId:
          formData.teamId && formData.teamId.trim() !== ''
            ? formData.teamId
            : undefined,
        startDate:
          formData.startDate && formData.startDate.trim() !== ''
            ? formData.startDate
            : undefined,
        targetDate:
          formData.targetDate && formData.targetDate.trim() !== ''
            ? formData.targetDate
            : undefined,
        summary:
          formData.summary && formData.summary.trim() !== ''
            ? formData.summary
            : undefined,
        outcome:
          formData.outcome && formData.outcome.trim() !== ''
            ? formData.outcome
            : undefined,
        objectives: objectives.filter(obj => obj.title.trim()),
        owners: owners.filter(owner => owner.personId),
      }

      await createInitiative(submitData)
    } catch (error) {
      if (error instanceof Error) {
        setErrors({ general: error.message })
      } else if (error && typeof error === 'object' && 'issues' in error) {
        const fieldErrors: Record<string, string> = {}
        ;(
          error as { issues: Array<{ path: string[]; message: string }> }
        ).issues.forEach(issue => {
          fieldErrors[issue.path[0]] = issue.message
        })
        setErrors(fieldErrors)
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
    value: string | number
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      {/* General Error Message */}
      {errors.general && (
        <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg'>
          {errors.general}
        </div>
      )}

      {/* Basic Information */}
      <div>
        <h3 className='font-semibold mb-4'>Basic Information</h3>
        <div className='space-y-4'>
          <div>
            <label className='block text-sm font-medium mb-2'>Title *</label>
            <input
              type='text'
              value={formData.title}
              onChange={e => handleInputChange('title', e.target.value)}
              className={`input ${errors.title ? 'border-red-500 focus:border-red-500' : ''}`}
              placeholder='Enter initiative title'
              required
            />
            {errors.title && (
              <p className='text-red-600 text-sm mt-1'>{errors.title}</p>
            )}
          </div>

          <div>
            <label className='block text-sm font-medium mb-2'>Summary</label>
            <textarea
              value={formData.summary}
              onChange={e => handleInputChange('summary', e.target.value)}
              className={`input min-h-[80px] resize-none ${errors.summary ? 'border-red-500 focus:border-red-500' : ''}`}
              placeholder='Brief description of the initiative'
            />
            {errors.summary && (
              <p className='text-red-600 text-sm mt-1'>{errors.summary}</p>
            )}
          </div>

          <div>
            <label className='block text-sm font-medium mb-2'>
              Expected Outcome
            </label>
            <textarea
              value={formData.outcome}
              onChange={e => handleInputChange('outcome', e.target.value)}
              className={`input min-h-[80px] resize-none ${errors.outcome ? 'border-red-500 focus:border-red-500' : ''}`}
              placeholder='What success looks like'
            />
            {errors.outcome && (
              <p className='text-red-600 text-sm mt-1'>{errors.outcome}</p>
            )}
          </div>

          {/* Timeline fields moved here */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-medium mb-2'>
                Start Date
              </label>
              <input
                type='date'
                value={formData.startDate}
                onChange={e => handleInputChange('startDate', e.target.value)}
                className={`input ${errors.startDate ? 'border-red-500 focus:border-red-500' : ''}`}
              />
              {errors.startDate && (
                <p className='text-red-600 text-sm mt-1'>{errors.startDate}</p>
              )}
            </div>

            <div>
              <label className='block text-sm font-medium mb-2'>
                Target Date
              </label>
              <input
                type='date'
                value={formData.targetDate}
                onChange={e => handleInputChange('targetDate', e.target.value)}
                className={`input ${errors.targetDate ? 'border-red-500 focus:border-red-500' : ''}`}
              />
              {errors.targetDate && (
                <p className='text-red-600 text-sm mt-1'>{errors.targetDate}</p>
              )}
            </div>
          </div>

          {/* Team field moved here */}
          <div>
            <label className='block text-sm font-medium mb-2'>Team</label>
            <select
              value={formData.teamId}
              onChange={e => handleInputChange('teamId', e.target.value)}
              className={`input ${errors.teamId ? 'border-red-500 focus:border-red-500' : ''}`}
            >
              <option value=''>Select a team</option>
              {teams.map(team => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
            {errors.teamId && (
              <p className='text-red-600 text-sm mt-1'>{errors.teamId}</p>
            )}
          </div>
        </div>
      </div>

      {/* Status & Tracking */}
      <div>
        <h3 className='font-semibold mb-4'>Status & Tracking</h3>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <div>
            <label className='block text-sm font-medium mb-2'>Status</label>
            <select
              value={formData.status}
              onChange={e =>
                handleInputChange(
                  'status',
                  e.target.value as InitiativeFormData['status']
                )
              }
              className={`input ${errors.status ? 'border-red-500 focus:border-red-500' : ''}`}
            >
              <option value='planned'>Planned</option>
              <option value='in_progress'>In Progress</option>
              <option value='paused'>Paused</option>
              <option value='done'>Done</option>
              <option value='canceled'>Canceled</option>
            </select>
            {errors.status && (
              <p className='text-red-600 text-sm mt-1'>{errors.status}</p>
            )}
          </div>

          <div>
            <label className='block text-sm font-medium mb-2'>RAG Status</label>
            <div className='flex items-center gap-2'>
              <select
                value={formData.rag}
                onChange={e =>
                  handleInputChange(
                    'rag',
                    e.target.value as InitiativeFormData['rag']
                  )
                }
                className={`input flex-1 ${errors.rag ? 'border-red-500 focus:border-red-500' : ''}`}
              >
                <option value='green'>Green</option>
                <option value='amber'>Amber</option>
                <option value='red'>Red</option>
              </select>
              <Rag rag={formData.rag} />
            </div>
            {errors.rag && (
              <p className='text-red-600 text-sm mt-1'>{errors.rag}</p>
            )}
          </div>

          <div>
            <label className='block text-sm font-medium mb-2'>
              Confidence (%)
            </label>
            <input
              type='number'
              min='0'
              max='100'
              value={formData.confidence}
              onChange={e =>
                handleInputChange('confidence', parseInt(e.target.value) || 0)
              }
              className={`input ${errors.confidence ? 'border-red-500 focus:border-red-500' : ''}`}
            />
            {errors.confidence && (
              <p className='text-red-600 text-sm mt-1'>{errors.confidence}</p>
            )}
          </div>
        </div>
      </div>

      {/* Objectives */}
      <div>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='font-semibold'>Objectives</h3>
          <Button
            type='button'
            onClick={addObjective}
            variant='outline'
            size='sm'
          >
            Add Objective
          </Button>
        </div>
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
                <input
                  type='text'
                  value={objective.title}
                  onChange={e =>
                    updateObjective(index, 'title', e.target.value)
                  }
                  className={`input ${errors[`objectives.${index}.title`] ? 'border-red-500 focus:border-red-500' : ''}`}
                  placeholder='Objective title'
                />
                {errors[`objectives.${index}.title`] && (
                  <p className='text-red-600 text-sm'>
                    {errors[`objectives.${index}.title`]}
                  </p>
                )}
                <input
                  type='text'
                  value={objective.keyResult}
                  onChange={e =>
                    updateObjective(index, 'keyResult', e.target.value)
                  }
                  className={`input ${errors[`objectives.${index}.keyResult`] ? 'border-red-500 focus:border-red-500' : ''}`}
                  placeholder='Key result (optional)'
                />
                {errors[`objectives.${index}.keyResult`] && (
                  <p className='text-red-600 text-sm'>
                    {errors[`objectives.${index}.keyResult`]}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Associated People */}
      <div>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='font-semibold'>Associated People</h3>
          <Button type='button' onClick={addOwner} variant='outline' size='sm'>
            Add Person
          </Button>
        </div>
        <div className='space-y-3'>
          {owners.map((owner, index) => (
            <div key={index} className='border rounded-xl p-3'>
              <div className='flex items-center justify-between mb-2'>
                <span className='text-sm font-medium'>Person {index + 1}</span>
                {owners.length > 1 && (
                  <Button
                    type='button'
                    onClick={() => removeOwner(index)}
                    variant='outline'
                    size='sm'
                  >
                    Remove
                  </Button>
                )}
              </div>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-2'>
                <div>
                  <select
                    value={owner.personId}
                    onChange={e =>
                      updateOwner(index, 'personId', e.target.value)
                    }
                    className={`input ${errors[`owners.${index}.personId`] ? 'border-red-500 focus:border-red-500' : ''}`}
                  >
                    <option value=''>Select person</option>
                    {people.map(person => (
                      <option key={person.id} value={person.id}>
                        {person.name}
                        {person.email ? ` (${person.email})` : ''}
                      </option>
                    ))}
                  </select>
                  {errors[`owners.${index}.personId`] && (
                    <p className='text-red-600 text-sm mt-1'>
                      {errors[`owners.${index}.personId`]}
                    </p>
                  )}
                </div>
                <div>
                  <select
                    value={owner.role}
                    onChange={e => updateOwner(index, 'role', e.target.value)}
                    className={`input ${errors[`owners.${index}.role`] ? 'border-red-500 focus:border-red-500' : ''}`}
                  >
                    <option value='owner'>Owner</option>
                    <option value='sponsor'>Sponsor</option>
                    <option value='collaborator'>Collaborator</option>
                  </select>
                  {errors[`owners.${index}.role`] && (
                    <p className='text-red-600 text-sm mt-1'>
                      {errors[`owners.${index}.role`]}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      <div className='flex justify-end'>
        <Button
          type='submit'
          disabled={isSubmitting || !formData.title.trim()}
          variant='outline'
        >
          {isSubmitting ? 'Creating...' : 'Create Initiative'}
        </Button>
      </div>
    </form>
  )
}
