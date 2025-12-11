'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { SimpleListItem } from '@/components/common/simple-list-item'
import { SimpleListItemsContainer } from '@/components/common/simple-list-items-container'
import { DeleteModal } from '@/components/common/delete-modal'

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
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

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

  const handleDeleteClick = (id: string) => {
    setDeletingId(id)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingId) return

    try {
      setIsDeleting(true)
      await deleteJobDomain(deletingId)
      setDeletingId(null)
    } catch (error) {
      console.error('Error deleting job domain:', error)
      throw error
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className='space-y-4'>
      {/* Domains List */}
      <SimpleListItemsContainer
        isEmpty={domains.length === 0}
        emptyStateText='No job domains configured. Add domains to categorize job roles.'
        useDividers={false}
      >
        {domains.map(domain => (
          <SimpleListItem
            key={domain.id}
            className={editingId === domain.id ? 'cursor-default' : ''}
          >
            {editingId === domain.id ? (
              // Edit Form
              <form
                onSubmit={e => handleSubmit(e, domain.id)}
                className='flex-1 space-y-2'
                onClick={e => e.stopPropagation()}
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
              <>
                <span className='font-medium text-sm'>{domain.name}</span>
                <div className='flex gap-1'>
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={e => {
                      e.stopPropagation()
                      handleEdit(domain)
                    }}
                    className='h-8 w-8 p-0'
                    title='Edit domain'
                  >
                    <Edit2 className='h-3 w-3' />
                  </Button>
                  <Button
                    size='sm'
                    variant='destructive'
                    onClick={e => {
                      e.stopPropagation()
                      handleDeleteClick(domain.id)
                    }}
                    className='h-8 w-8 p-0'
                    title='Delete domain'
                  >
                    <Trash2 className='h-3 w-3' />
                  </Button>
                </div>
              </>
            )}
          </SimpleListItem>
        ))}
      </SimpleListItemsContainer>

      <DeleteModal
        isOpen={deletingId !== null}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDeleteConfirm}
        title='Delete Job Domain'
        description='Are you sure you want to delete this job domain? This action cannot be undone.'
        entityName='job domain'
        isLoading={isDeleting}
      />
    </div>
  )
}
