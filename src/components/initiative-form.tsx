'use client'

import { useState } from 'react'
import { createInitiative } from '@/lib/actions'
import { type InitiativeFormData } from '@/lib/validations'
import { Rag } from '@/components/rag'

interface InitiativeFormProps {
  teams: Array<{ id: string; name: string }>
  people: Array<{ id: string; name: string; email: string }>
}

export function InitiativeForm({ teams, people }: InitiativeFormProps) {
  const [formData, setFormData] = useState<InitiativeFormData>({
    title: '',
    summary: '',
    outcome: '',
    startDate: '',
    targetDate: '',
    status: 'planned',
    rag: 'green',
    confidence: 80,
    teamId: '',
    objectives: [],
    owners: [],
  })

  const [objectives, setObjectives] = useState([{ title: '', keyResult: '' }])
  const [owners, setOwners] = useState([{ personId: '', role: 'owner' as const }])
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
      
      await createInitiative(submitData)
    } catch (error) {
      console.error('Error submitting form:', error)
      setIsSubmitting(false)
    }
  }

  const addObjective = () => {
    setObjectives([...objectives, { title: '', keyResult: '' }])
  }

  const removeObjective = (index: number) => {
    setObjectives(objectives.filter((_, i) => i !== index))
  }

  const updateObjective = (index: number, field: 'title' | 'keyResult', value: string) => {
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

  const updateOwner = (index: number, field: 'personId' | 'role', value: string) => {
    const updated = owners.map((owner, i) => 
      i === index ? { ...owner, [field]: value } : owner
    )
    setOwners(updated)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="card">
        <h3 className="font-semibold mb-4">Basic Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input"
              placeholder="Enter initiative title"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Summary</label>
            <textarea
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              className="input min-h-[80px] resize-none"
              placeholder="Brief description of the initiative"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Expected Outcome</label>
            <textarea
              value={formData.outcome}
              onChange={(e) => setFormData({ ...formData, outcome: e.target.value })}
              className="input min-h-[80px] resize-none"
              placeholder="What success looks like"
            />
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="card">
        <h3 className="font-semibold mb-4">Timeline</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Start Date</label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="input"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Target Date</label>
            <input
              type="date"
              value={formData.targetDate}
              onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
              className="input"
            />
          </div>
        </div>
      </div>

      {/* Status & Tracking */}
      <div className="card">
        <h3 className="font-semibold mb-4">Status & Tracking</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="input"
            >
              <option value="planned">Planned</option>
              <option value="in_progress">In Progress</option>
              <option value="paused">Paused</option>
              <option value="done">Done</option>
              <option value="canceled">Canceled</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">RAG Status</label>
            <select
              value={formData.rag}
              onChange={(e) => setFormData({ ...formData, rag: e.target.value as any })}
              className="input"
            >
              <option value="green">Green</option>
              <option value="amber">Amber</option>
              <option value="red">Red</option>
            </select>
            <div className="mt-2">
              <Rag rag={formData.rag} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Confidence (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={formData.confidence}
              onChange={(e) => setFormData({ ...formData, confidence: parseInt(e.target.value) || 0 })}
              className="input"
            />
          </div>
        </div>
      </div>

      {/* Team Assignment */}
      <div className="card">
        <h3 className="font-semibold mb-4">Team Assignment</h3>
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
      </div>

      {/* Objectives */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Objectives</h3>
          <button
            type="button"
            onClick={addObjective}
            className="btn text-sm"
          >
            Add Objective
          </button>
        </div>
        <div className="space-y-3">
          {objectives.map((objective, index) => (
            <div key={index} className="border border-neutral-800 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Objective {index + 1}</span>
                {objectives.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeObjective(index)}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="space-y-2">
                <input
                  type="text"
                  value={objective.title}
                  onChange={(e) => updateObjective(index, 'title', e.target.value)}
                  className="input"
                  placeholder="Objective title"
                />
                <input
                  type="text"
                  value={objective.keyResult}
                  onChange={(e) => updateObjective(index, 'keyResult', e.target.value)}
                  className="input"
                  placeholder="Key result (optional)"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Owners */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Owners</h3>
          <button
            type="button"
            onClick={addOwner}
            className="btn text-sm"
          >
            Add Owner
          </button>
        </div>
        <div className="space-y-3">
          {owners.map((owner, index) => (
            <div key={index} className="border border-neutral-800 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Owner {index + 1}</span>
                {owners.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeOwner(index)}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <select
                  value={owner.personId}
                  onChange={(e) => updateOwner(index, 'personId', e.target.value)}
                  className="input"
                >
                  <option value="">Select person</option>
                  {people.map(person => (
                    <option key={person.id} value={person.id}>
                      {person.name} ({person.email})
                    </option>
                  ))}
                </select>
                <select
                  value={owner.role}
                  onChange={(e) => updateOwner(index, 'role', e.target.value)}
                  className="input"
                >
                  <option value="owner">Owner</option>
                  <option value="sponsor">Sponsor</option>
                  <option value="collaborator">Collaborator</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting || !formData.title.trim()}
          className="btn bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Creating...' : 'Create Initiative'}
        </button>
      </div>
    </form>
  )
}
