'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { MarkdownEditor } from '@/components/markdown-editor'
import { createJobRole, updateJobRole, deleteJobRole } from '@/lib/actions'
import { type JobRoleFormData } from '@/lib/actions/job-roles'
import { Edit2, Trash2, Eye } from 'lucide-react'
import Link from 'next/link'
import styles from './job-role-management.module.css'

interface JobRole {
  id: string
  title: string
  description: string | null
  level: { id: string; name: string }
  domain: { id: string; name: string }
  people: Array<{ id: string; name: string }>
}

interface JobLevel {
  id: string
  name: string
}

interface JobDomain {
  id: string
  name: string
}

interface JobRoleManagementProps {
  jobRoles: JobRole[]
  levels: JobLevel[]
  domains: JobDomain[]
}

export function JobRoleManagement({
  jobRoles,
  levels,
  domains,
}: JobRoleManagementProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState<JobRoleFormData>({
    title: '',
    description: '',
    levelId: '',
    domainId: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent, id?: string) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (id) {
        await updateJobRole(id, formData)
        setEditingId(null)
        setIsDialogOpen(false)
      } else {
        await createJobRole(formData)
        setCreating(false)
      }
      setFormData({
        title: '',
        description: '',
        levelId: '',
        domainId: '',
      })
    } catch (error) {
      console.error('Error submitting job role:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (jobRole: JobRole) => {
    setEditingId(jobRole.id)
    setFormData({
      title: jobRole.title,
      description: jobRole.description || '',
      levelId: jobRole.level.id,
      domainId: jobRole.domain.id,
    })
    setIsDialogOpen(true)
  }

  const handleCancel = () => {
    setEditingId(null)
    setCreating(false)
    setIsDialogOpen(false)
    setFormData({
      title: '',
      description: '',
      levelId: '',
      domainId: '',
    })
  }

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this job role? This action cannot be undone.'
      )
    ) {
      return
    }

    try {
      await deleteJobRole(id)
    } catch (error) {
      console.error('Error deleting job role:', error)
    }
  }

  const startCreating = () => {
    setCreating(true)
    setEditingId(null)
    setFormData({
      title: '',
      description: '',
      levelId: '',
      domainId: '',
    })
    setIsDialogOpen(true)
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h3 className='text-lg font-semibold'>Job Roles</h3>
        <Button
          onClick={startCreating}
          disabled={creating || editingId !== null}
        >
          Add Job Role
        </Button>
      </div>

      {/* Job Roles List */}
      <div className='space-y-2'>
        {jobRoles.length === 0 ? (
          <p className='text-muted-foreground text-center py-8'>
            No job roles configured. Create levels and domains first, then add
            job roles.
          </p>
        ) : (
          jobRoles.map(jobRole => (
            <div key={jobRole.id} className='card p-2'>
              {/* Display Mode */}
              <div className='space-y-2'>
                <div className='flex items-start justify-between'>
                  <div className='space-y-1'>
                    <h4 className='font-medium text-base'>{jobRole.title}</h4>
                    <div className='flex gap-3 text-xs text-muted-foreground'>
                      <span>{jobRole.level.name} Level</span>
                      <span>•</span>
                      <span>{jobRole.domain.name} Domain</span>
                      {jobRole.people.length > 0 && (
                        <>
                          <span>•</span>
                          <span>
                            {jobRole.people.length} person
                            {jobRole.people.length !== 1 ? 's' : ''} assigned
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className='flex gap-1'>
                    <Button
                      size='sm'
                      variant='outline'
                      asChild
                      className='h-8 w-8 p-0'
                      title='View job role details'
                    >
                      <Link href={`/job-roles/${jobRole.id}`}>
                        <Eye className='h-3 w-3' />
                      </Link>
                    </Button>
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => handleEdit(jobRole)}
                      className='h-8 w-8 p-0'
                      title='Edit job role'
                    >
                      <Edit2 className='h-3 w-3' />
                    </Button>
                    <Button
                      size='sm'
                      variant='destructive'
                      onClick={() => handleDelete(jobRole.id)}
                      className='h-8 w-8 p-0'
                      title='Delete job role'
                    >
                      <Trash2 className='h-3 w-3' />
                    </Button>
                  </div>
                </div>

                {jobRole.description && (
                  <div className='prose prose-sm max-w-none'>
                    <div
                      className={styles.markdownPreview}
                      dangerouslySetInnerHTML={{
                        __html: jobRole.description
                          .replace(/\n/g, '<br>')
                          .replace(/### (.*?)(<br>|$)/g, '<h3>$1</h3>')
                          .replace(/## (.*?)(<br>|$)/g, '<h2>$1</h2>')
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          .replace(/\*(.*?)\*/g, '<em>$1</em>')
                          .replace(/`(.*?)`/g, '<code>$1</code>'),
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit Job Role' : 'Create Job Role'}
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={e => handleSubmit(e, editingId || undefined)}
            className='space-y-4'
          >
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium mb-2'>
                  Job Title *
                </label>
                <input
                  type='text'
                  value={formData.title}
                  onChange={e =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className='input'
                  placeholder='e.g., Senior Software Engineer'
                  required
                />
              </div>
              <div>
                <label className='block text-sm font-medium mb-2'>
                  Level *
                </label>
                <select
                  value={formData.levelId}
                  onChange={e =>
                    setFormData({ ...formData, levelId: e.target.value })
                  }
                  className='input'
                  required
                >
                  <option value=''>Select a level</option>
                  {levels.map(level => (
                    <option key={level.id} value={level.id}>
                      {level.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className='block text-sm font-medium mb-2'>Domain *</label>
              <select
                value={formData.domainId}
                onChange={e =>
                  setFormData({ ...formData, domainId: e.target.value })
                }
                className='input'
                required
              >
                <option value=''>Select a domain</option>
                {domains.map(domain => (
                  <option key={domain.id} value={domain.id}>
                    {domain.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className='block text-sm font-medium mb-2'>
                Description (Markdown)
              </label>
              <MarkdownEditor
                value={formData.description || ''}
                onChange={value =>
                  setFormData({ ...formData, description: value })
                }
                placeholder='### Responsibilities...'
              />
            </div>

            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type='submit'
                disabled={
                  isSubmitting ||
                  !formData.title.trim() ||
                  !formData.levelId ||
                  !formData.domainId
                }
              >
                {isSubmitting
                  ? editingId
                    ? 'Updating...'
                    : 'Creating...'
                  : editingId
                    ? 'Update'
                    : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
