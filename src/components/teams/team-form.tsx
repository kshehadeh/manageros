'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Users } from 'lucide-react'

import { useState, useEffect } from 'react'
import {
  createTeam,
  updateTeam,
  getTeamsForSelection,
} from '@/lib/actions/team'
import { type TeamFormData } from '@/lib/validations'
import { FormTemplate, type FormSection } from '@/components/ui/form-template'

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

  const sections: FormSection[] = [
    {
      title: 'Team Information',
      icon: Users,
      content: (
        <>
          <div className='space-y-2'>
            <Label htmlFor='name'>
              Team Name <span className='text-destructive'>*</span>
            </Label>
            <Input
              id='name'
              type='text'
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder='Enter team name'
              required
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='description'>Description</Label>
            <textarea
              id='description'
              value={formData.description}
              onChange={e =>
                setFormData({ ...formData, description: e.target.value })
              }
              className='flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none'
              placeholder="Describe the team's purpose, responsibilities, or focus area"
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='parentId'>Parent Team</Label>
            <select
              id='parentId'
              value={formData.parentId || ''}
              onChange={e =>
                setFormData({
                  ...formData,
                  parentId: e.target.value === '' ? undefined : e.target.value,
                })
              }
              className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
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
        </>
      ),
    },
  ]

  return (
    <FormTemplate
      sections={sections}
      onSubmit={handleSubmit}
      submitButton={{
        text: team ? 'Update Team' : 'Create Team',
        loadingText: team ? 'Updating...' : 'Creating...',
        disabled: !formData.name.trim(),
      }}
      generalError={error}
      isSubmitting={isSubmitting}
    />
  )
}
