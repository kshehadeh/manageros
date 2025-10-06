'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { MarkdownEditor } from '@/components/markdown-editor'

import {
  type JobRoleFormData,
  updateJobRole,
} from '@/lib/actions/job-roles'

interface JobRole {
  id: string
  title: string
  description: string | null
  level: { id: string; name: string }
  domain: { id: string; name: string }
}

interface JobLevel {
  id: string
  name: string
}

interface JobDomain {
  id: string
  name: string
}

interface JobRoleEditFormProps {
  jobRole: JobRole
  levels: JobLevel[]
  domains: JobDomain[]
}

export function JobRoleEditForm({
  jobRole,
  levels,
  domains,
}: JobRoleEditFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<JobRoleFormData>({
    title: jobRole.title,
    description: jobRole.description || '',
    levelId: jobRole.level.id,
    domainId: jobRole.domain.id,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await updateJobRole(jobRole.id, formData)
      router.push(`/job-roles/${jobRole.id}`)
    } catch (error) {
      console.error('Error updating job role:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className='max-w-2xl'>
      <form onSubmit={handleSubmit} className='space-y-6'>
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
            <label className='block text-sm font-medium mb-2'>Level *</label>
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
            onChange={value => setFormData({ ...formData, description: value })}
            placeholder='### Responsibilities...'
          />
        </div>

        <div className='flex gap-3'>
          <Button
            type='submit'
            disabled={
              isSubmitting ||
              !formData.title.trim() ||
              !formData.levelId ||
              !formData.domainId
            }
          >
            {isSubmitting ? 'Updating...' : 'Update Job Role'}
          </Button>
          <Button
            type='button'
            variant='outline'
            onClick={() => router.push(`/job-roles/${jobRole.id}`)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
