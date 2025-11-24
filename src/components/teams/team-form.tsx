'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Users } from 'lucide-react'
import { TeamSelect } from '@/components/ui/team-select'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createTeam, updateTeam } from '@/lib/actions/team'
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
  header?: {
    icon?: React.ComponentType<{ className?: string }>
    title: string
    subtitle?: string
    action?: React.ReactNode
  }
}

export function TeamForm({
  team,
  parentId,
  header: externalHeader,
}: TeamFormProps) {
  const router = useRouter()
  const [formData, setFormData] = useState<TeamFormData>({
    name: team?.name || '',
    description: team?.description || '',
    parentId: team?.parentId || parentId || '',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    let result
    try {
      if (team) {
        result = await updateTeam(team.id, formData)
      } else {
        result = await createTeam(formData)
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      setError(error instanceof Error ? error.message : 'An error occurred')
      setIsSubmitting(false)
      return
    }

    // Redirect outside of try-catch block
    setIsSubmitting(false)
    if (team) {
      // When updating, redirect to the team detail page
      router.push(`/teams/${team.id}`)
    } else if (result?.id) {
      // When creating, redirect to the new team detail page
      router.push(`/teams/${result.id}`)
    } else {
      // Fallback to teams list
      router.push('/teams')
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
            <TeamSelect
              value={formData.parentId || 'none'}
              onValueChange={value =>
                setFormData({
                  ...formData,
                  parentId: value === 'none' ? undefined : value,
                })
              }
              includeNone={true}
              noneLabel='No parent team (top-level team)'
              excludeTeamIds={team?.id ? [team.id] : []}
            />
            <p className='text-xs text-muted-foreground mt-1'>
              Select a parent team to create a hierarchy. Teams can only have
              one parent but multiple children.
            </p>
          </div>
        </>
      ),
    },
  ]

  const formHeader = externalHeader || {
    icon: Users,
    title: team ? 'Edit Team' : 'Create Team',
  }

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
      header={formHeader}
    />
  )
}
