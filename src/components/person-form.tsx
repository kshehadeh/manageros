'use client'

import { useState } from 'react'
import { createPerson, updatePerson } from '@/lib/actions'
import { type PersonFormData } from '@/lib/validations'

interface PersonFormProps {
  teams: Array<{ id: string; name: string }>
  people: Array<{ id: string; name: string; email: string }>
  person?: {
    id: string
    name: string
    email: string
    role?: string | null
    status: string
    teamId?: string | null
    managerId?: string | null
    startedAt?: Date | null
  }
}

export function PersonForm({ teams, people, person }: PersonFormProps) {
  const [formData, setFormData] = useState<PersonFormData>({
    name: person?.name || '',
    email: person?.email || '',
    role: person?.role || '',
    status: person?.status as any || 'active',
    teamId: person?.teamId || '',
    managerId: person?.managerId || '',
    startedAt: person?.startedAt ? person.startedAt.toISOString().split('T')[0] : '',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (person) {
        await updatePerson(person.id, formData)
      } else {
        await createPerson(formData)
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      setIsSubmitting(false)
    }
  }

  // Filter out the current person from the manager options (can't be their own manager)
  const managerOptions = people.filter(p => p.id !== person?.id)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="card">
        <h3 className="font-semibold mb-4">Basic Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              placeholder="Enter full name"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="input"
              placeholder="Enter email address"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Role</label>
            <input
              type="text"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="input"
              placeholder="e.g., Senior Engineer, Product Manager"
            />
          </div>
        </div>
      </div>

      {/* Status & Dates */}
      <div className="card">
        <h3 className="font-semibold mb-4">Status & Dates</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="input"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="on_leave">On Leave</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Start Date</label>
            <input
              type="date"
              value={formData.startedAt}
              onChange={(e) => setFormData({ ...formData, startedAt: e.target.value })}
              className="input"
            />
          </div>
        </div>
      </div>

      {/* Team & Reporting */}
      <div className="card">
        <h3 className="font-semibold mb-4">Team & Reporting</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Team</label>
            <select
              value={formData.teamId}
              onChange={(e) => setFormData({ ...formData, teamId: e.target.value })}
              className="input"
            >
              <option value="">Select a team</option>
              {teams.map(team => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Manager</label>
            <select
              value={formData.managerId}
              onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
              className="input"
            >
              <option value="">Select a manager</option>
              {managerOptions.map(person => (
                <option key={person.id} value={person.id}>
                  {person.name} ({person.email})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting || !formData.name.trim() || !formData.email.trim()}
          className="btn bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting 
            ? (person ? 'Updating...' : 'Creating...') 
            : (person ? 'Update Person' : 'Create Person')
          }
        </button>
      </div>
    </form>
  )
}
