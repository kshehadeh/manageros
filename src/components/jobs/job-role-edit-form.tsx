'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MarkdownEditor } from '@/components/markdown-editor'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Briefcase } from 'lucide-react'

import { type JobRoleFormData, updateJobRole } from '@/lib/actions/job-roles'
import { FormTemplate, type FormSection } from '@/components/ui/form-template'

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

  const isFormValid =
    formData.title.trim() && formData.levelId && formData.domainId

  const sections: FormSection[] = [
    {
      title: 'Job Role Information',
      icon: Briefcase,
      content: (
        <>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='title'>
                Job Title <span className='text-destructive'>*</span>
              </Label>
              <Input
                id='title'
                type='text'
                value={formData.title}
                onChange={e =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder='e.g., Senior Software Engineer'
                required
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='level'>
                Level <span className='text-destructive'>*</span>
              </Label>
              <Select
                value={formData.levelId}
                onValueChange={value =>
                  setFormData({ ...formData, levelId: value })
                }
                required
              >
                <SelectTrigger id='level'>
                  <SelectValue placeholder='Select a level' />
                </SelectTrigger>
                <SelectContent>
                  {levels.map(level => (
                    <SelectItem key={level.id} value={level.id}>
                      {level.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='domain'>
              Domain <span className='text-destructive'>*</span>
            </Label>
            <Select
              value={formData.domainId}
              onValueChange={value =>
                setFormData({ ...formData, domainId: value })
              }
              required
            >
              <SelectTrigger id='domain'>
                <SelectValue placeholder='Select a domain' />
              </SelectTrigger>
              <SelectContent>
                {domains.map(domain => (
                  <SelectItem key={domain.id} value={domain.id}>
                    {domain.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='description'>Description (Markdown)</Label>
            <MarkdownEditor
              value={formData.description || ''}
              onChange={value =>
                setFormData({ ...formData, description: value })
              }
              placeholder='### Responsibilities...'
            />
          </div>
        </>
      ),
    },
  ]

  return (
    <div className='page-container'>
      {/* Main Content */}
      <div className='main-layout'>
        <div className='main-content'>
          <FormTemplate
            sections={sections}
            onSubmit={handleSubmit}
            submitButton={{
              text: 'Update Job Role',
              loadingText: 'Updating...',
              disabled: !isFormValid,
            }}
            isSubmitting={isSubmitting}
            header={{
              icon: Briefcase,
              title: 'Edit Job Role',
              subtitle: 'Update job role details and description',
            }}
          />
        </div>
      </div>
    </div>
  )
}
