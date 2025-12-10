'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

import {
  type JobDomainFormData,
  createJobDomain,
  updateJobDomain,
  deleteJobDomain,
} from '@/lib/actions/job-roles'
import type { JobDomain } from '@/types/job-roles'
import { Edit2, Trash2 } from 'lucide-react'

interface JobDomainManagementProps {
  domains: JobDomain[]
}

export function JobDomainManagement({ domains }: JobDomainManagementProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<JobDomainFormData>({ name: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent, id?: string) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (id) {
        await updateJobDomain(id, formData)
        setEditingId(null)
      } else {
        await createJobDomain(formData)
      }
      setFormData({ name: '' })
    } catch (error) {
      console.error('Error submitting job domain:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (domain: JobDomain) => {
    setEditingId(domain.id)
    setFormData({ name: domain.name })
  }

  const handleCancel = () => {
    setEditingId(null)
    setFormData({ name: '' })
  }

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this job domain? This action cannot be undone.'
      )
    ) {
      return
    }

    try {
      await deleteJobDomain(id)
    } catch (error) {
      console.error('Error deleting job domain:', error)
    }
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h3 className='text-lg font-semibold'>Job Domains</h3>
      </div>

      {/* Domains List */}
      <div className='space-y-1'>
        {domains.length === 0 ? (
          <p className='text-muted-foreground text-center py-8'>
            No job domains configured. Add domains to categorize job roles.
          </p>
        ) : (
          domains.map(domain => (
            <div
              key={domain.id}
              className='border rounded-lg p-2 bg-background hover:bg-muted/50'
            >
              {editingId === domain.id ? (
                // Edit Form
                <form
                  onSubmit={e => handleSubmit(e, domain.id)}
                  className='space-y-2'
                >
                  <div>
                    <label className='block text-sm font-medium mb-1'>
                      Domain Name
                    </label>
                    <input
                      type='text'
                      value={formData.name}
                      onChange={e => setFormData({ name: e.target.value })}
                      className='input'
                      required
                    />
                  </div>
                  <div className='flex gap-2'>
                    <Button
                      type='submit'
                      size='sm'
                      disabled={isSubmitting || !formData.name.trim()}
                    >
                      {isSubmitting ? 'Updating...' : 'Update'}
                    </Button>
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      onClick={handleCancel}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                // Display Mode
                <div className='flex items-center justify-between'>
                  <span className='font-medium text-sm'>{domain.name}</span>
                  <div className='flex gap-1'>
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => handleEdit(domain)}
                      className='h-8 w-8 p-0'
                      title='Edit domain'
                    >
                      <Edit2 className='h-3 w-3' />
                    </Button>
                    <Button
                      size='sm'
                      variant='destructive'
                      onClick={() => handleDelete(domain.id)}
                      className='h-8 w-8 p-0'
                      title='Delete domain'
                    >
                      <Trash2 className='h-3 w-3' />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
