'use client'

import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { updateInitiative } from '@/lib/actions'
import { type InitiativeFormData } from '@/lib/validations'
import { Rag } from '@/components/rag'
import { MarkdownEditor } from '@/components/markdown-editor'

interface InitiativeEditFormProps {
  initiative: {
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
  teams: Array<{ id: string; name: string }>
  people: Array<{ id: string; name: string; email: string | null }>
}

export function InitiativeEditForm({
  initiative,
  teams,
  people,
}: InitiativeEditFormProps) {
  // Format dates for input fields
  const formatDate = (date: Date | null) => {
    if (!date) return ''
    return new Date(date).toISOString().split('T')[0]
  }

  const [formData, setFormData] = useState<InitiativeFormData>({
    title: initiative.title,
    summary: initiative.summary || '',
    outcome: initiative.outcome || '',
    startDate: formatDate(initiative.startDate),
    targetDate: formatDate(initiative.targetDate),
    status: initiative.status as InitiativeFormData['status'],
    rag: initiative.rag as InitiativeFormData['rag'],
    confidence: initiative.confidence,
    teamId: initiative.teamId || '',
    objectives: initiative.objectives.map(obj => ({
      title: obj.title,
      keyResult: obj.keyResult || '',
    })),
    owners: initiative.owners.map(owner => ({
      personId: owner.personId,
      role: owner.role as 'owner' | 'sponsor' | 'collaborator',
    })),
  })

  const [objectives, setObjectives] = useState(
    initiative.objectives.length > 0
      ? initiative.objectives.map(obj => ({
          title: obj.title,
          keyResult: obj.keyResult || '',
        }))
      : [{ title: '', keyResult: '' }]
  )

  const [owners, setOwners] = useState(
    initiative.owners.length > 0
      ? initiative.owners.map(owner => ({
          personId: owner.personId,
          role: owner.role as 'owner' | 'sponsor' | 'collaborator',
        }))
      : [{ personId: '', role: 'owner' as const }]
  )

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const submitData = {
        ...formData,
        objectives: objectives.filter(obj => obj.title.trim()),
        owners: owners.filter(owner => owner.personId),
      }

      await updateInitiative(initiative.id, submitData)
    } catch (error) {
      console.error('Error updating initiative:', error)
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

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      {/* Basic Information */}
      <div className='card'>
        <h3 className='font-semibold mb-4'>Basic Information</h3>
        <div className='space-y-4'>
          <div>
            <label className='block text-sm font-medium mb-2'>Title *</label>
            <input
              type='text'
              value={formData.title}
              onChange={e =>
                setFormData({ ...formData, title: e.target.value })
              }
              className='input'
              placeholder='Enter initiative title'
              required
            />
          </div>

          <div>
            <label className='block text-sm font-medium mb-2'>Summary</label>
            <MarkdownEditor
              value={formData.summary}
              onChange={value => setFormData({ ...formData, summary: value })}
              placeholder='Brief description of the initiative... Use Markdown for formatting!'
            />
          </div>

          <div>
            <label className='block text-sm font-medium mb-2'>
              Expected Outcome
            </label>
            <MarkdownEditor
              value={formData.outcome}
              onChange={value => setFormData({ ...formData, outcome: value })}
              placeholder='What success looks like... Use Markdown for formatting!'
            />
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className='card'>
        <h3 className='font-semibold mb-4'>Timeline</h3>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <label className='block text-sm font-medium mb-2'>Start Date</label>
            <input
              type='date'
              value={formData.startDate}
              onChange={e =>
                setFormData({ ...formData, startDate: e.target.value })
              }
              className='input'
            />
          </div>

          <div>
            <label className='block text-sm font-medium mb-2'>
              Target Date
            </label>
            <input
              type='date'
              value={formData.targetDate}
              onChange={e =>
                setFormData({ ...formData, targetDate: e.target.value })
              }
              className='input'
            />
          </div>
        </div>
      </div>

      {/* Status & Tracking */}
      <div className='card'>
        <h3 className='font-semibold mb-4'>Status & Tracking</h3>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <div>
            <label className='block text-sm font-medium mb-2'>Status</label>
            <select
              value={formData.status}
              onChange={e =>
                setFormData({
                  ...formData,
                  status: e.target.value as InitiativeFormData['status'],
                })
              }
              className='input'
            >
              <option value='planned'>Planned</option>
              <option value='in_progress'>In Progress</option>
              <option value='paused'>Paused</option>
              <option value='done'>Done</option>
              <option value='canceled'>Canceled</option>
            </select>
          </div>

          <div>
            <label className='block text-sm font-medium mb-2'>RAG Status</label>
            <select
              value={formData.rag}
              onChange={e =>
                setFormData({
                  ...formData,
                  rag: e.target.value as InitiativeFormData['rag'],
                })
              }
              className='input'
            >
              <option value='green'>Green</option>
              <option value='amber'>Amber</option>
              <option value='red'>Red</option>
            </select>
            <div className='mt-2'>
              <Rag rag={formData.rag} />
            </div>
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
                setFormData({
                  ...formData,
                  confidence: parseInt(e.target.value) || 0,
                })
              }
              className='input'
            />
          </div>
        </div>
      </div>

      {/* Team Assignment */}
      <div className='card'>
        <h3 className='font-semibold mb-4'>Team Assignment</h3>
        <div>
          <label className='block text-sm font-medium mb-2'>Team</label>
          <select
            value={formData.teamId}
            onChange={e => setFormData({ ...formData, teamId: e.target.value })}
            className='input'
          >
            <option value=''>Select a team</option>
            {teams.map(team => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Objectives */}
      <div className='card'>
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
                  className='input'
                  placeholder='Objective title'
                />
                <input
                  type='text'
                  value={objective.keyResult}
                  onChange={e =>
                    updateObjective(index, 'keyResult', e.target.value)
                  }
                  className='input'
                  placeholder='Key result (optional)'
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Owners */}
      <div className='card'>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='font-semibold'>Owners</h3>
          <Button type='button' onClick={addOwner} variant='outline' size='sm'>
            Add Owner
          </Button>
        </div>
        <div className='space-y-3'>
          {owners.map((owner, index) => (
            <div key={index} className='border rounded-xl p-3'>
              <div className='flex items-center justify-between mb-2'>
                <span className='text-sm font-medium'>Owner {index + 1}</span>
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
                <select
                  value={owner.personId}
                  onChange={e => updateOwner(index, 'personId', e.target.value)}
                  className='input'
                >
                  <option value=''>Select person</option>
                  {people.map(person => (
                    <option key={person.id} value={person.id}>
                      {person.name}
                      {person.email ? ` (${person.email})` : ''}
                    </option>
                  ))}
                </select>
                <select
                  value={owner.role}
                  onChange={e => updateOwner(index, 'role', e.target.value)}
                  className='input'
                >
                  <option value='owner'>Owner</option>
                  <option value='sponsor'>Sponsor</option>
                  <option value='collaborator'>Collaborator</option>
                </select>
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
          {isSubmitting ? 'Updating...' : 'Update Initiative'}
        </Button>
      </div>
    </form>
  )
}
