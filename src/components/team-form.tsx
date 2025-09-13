'use client'

import { useState } from 'react'
import { createTeam, updateTeam } from '@/lib/actions'
import { type TeamFormData } from '@/lib/validations'

interface TeamFormProps {
  team?: {
    id: string
    name: string
    description?: string | null
  }
}

export function TeamForm({ team }: TeamFormProps) {
  const [formData, setFormData] = useState<TeamFormData>({
    name: team?.name || '',
    description: team?.description || '',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (team) {
        await updateTeam(team.id, formData)
      } else {
        await createTeam(formData)
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="card">
        <h3 className="font-semibold mb-4">Team Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Team Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              placeholder="Enter team name"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input min-h-[100px] resize-none"
              placeholder="Describe the team's purpose, responsibilities, or focus area"
            />
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting || !formData.name.trim()}
          className="btn bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting 
            ? (team ? 'Updating...' : 'Creating...') 
            : (team ? 'Update Team' : 'Create Team')
          }
        </button>
      </div>
    </form>
  )
}
