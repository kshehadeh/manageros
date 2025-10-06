'use client'

import { Button } from '@/components/ui/button'

import { useState, useEffect } from 'react'
import {
  createTeam,
  updateTeam,
  getTeamsForSelection,
} from '@/lib/actions/team'
import { type TeamFormData } from '@/lib/validations'

interface TeamFormProps {
  team?: {
    id: string
    name: string
    description?: string | null
    avatar?: string | null
    parentId?: string | null
  }
  parentId?: string
}

export function TeamForm({ team, parentId }: TeamFormProps) {
  const [formData, setFormData] = useState<TeamFormData>({
    name: team?.name || '',
    description: team?.description || '',
    parentId: team?.parentId || parentId || '',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [availableTeams, setAvailableTeams] = useState<
    Array<{ id: string; name: string; parentId: string | null }>
  >([])

  useEffect(() => {
    const loadTeams = async () => {
      try {
        const teams = await getTeamsForSelection(team?.id)
        setAvailableTeams(teams)
      } catch (error) {
        console.error('Error loading teams:', error)
      }
    }
    loadTeams()
  }, [team?.id, parentId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      if (team) {
        await updateTeam(team.id, formData)
      } else {
        await createTeam(formData)
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      setError(error instanceof Error ? error.message : 'An error occurred')
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      {/* Error Display */}
      {error && (
        <div className='bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded'>
          {error}
        </div>
      )}

      {/* Basic Information */}
      <div className='card'>
        <h3 className='font-semibold mb-4'>Team Information</h3>
        <div className='space-y-4'>
          <div>
            <label className='block text-sm font-medium mb-2'>
              Team Name *
            </label>
            <input
              type='text'
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className='input'
              placeholder='Enter team name'
              required
            />
          </div>

          <div>
            <label className='block text-sm font-medium mb-2'>
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={e =>
                setFormData({ ...formData, description: e.target.value })
              }
              className='input min-h-[100px] resize-none'
              placeholder="Describe the team's purpose, responsibilities, or focus area"
            />
          </div>

          <div>
            <label className='block text-sm font-medium mb-2'>
              Parent Team
            </label>
            <select
              value={formData.parentId || ''}
              onChange={e =>
                setFormData({
                  ...formData,
                  parentId: e.target.value === '' ? undefined : e.target.value,
                })
              }
              className='input'
            >
              <option value=''>No parent team (top-level team)</option>
              {availableTeams.map(availableTeam => (
                <option key={availableTeam.id} value={availableTeam.id}>
                  {availableTeam.name}
                </option>
              ))}
            </select>
            <p className='text-xs text-muted-foreground mt-1'>
              Select a parent team to create a hierarchy. Teams can only have
              one parent but multiple children.
            </p>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className='flex justify-end'>
        <Button
          type='submit'
          disabled={isSubmitting || !formData.name.trim()}
          variant='outline'
        >
          {isSubmitting
            ? team
              ? 'Updating...'
              : 'Creating...'
            : team
              ? 'Update Team'
              : 'Create Team'}
        </Button>
      </div>
    </form>
  )
}
