'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PersonSelect } from '@/components/ui/person-select'
import { TeamSelect } from '@/components/ui/team-select'
import { DateTimePickerWithNaturalInput } from '@/components/ui/datetime-picker-with-natural-input'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createPerson, updatePerson } from '@/lib/actions/person'
import { type PersonFormData, personSchema } from '@/lib/validations'
import { UserLinkForm } from '@/components/user-link-form'
import { JiraAccountLinker } from '@/components/jira-account-linker'
import { GithubAccountLinker } from '@/components/github-account-linker'
import { User, Users, Calendar } from 'lucide-react'
import { FaJira, FaGithub } from 'react-icons/fa'
import { FormTemplate, type FormSection } from '@/components/ui/form-template'

interface PersonFormProps {
  jobRoles: Array<{
    id: string
    title: string
    level: { name: string }
    domain: { name: string }
  }>
  initialManagerId?: string
  initialTeamId?: string
  person?: {
    id: string
    name: string
    email: string | null
    role?: string | null
    status: string
    birthday?: Date | null
    avatar?: string | null
    employeeType?: 'FULL_TIME' | 'PART_TIME' | 'INTERN' | 'CONSULTANT' | null
    teamId?: string | null
    managerId?: string | null
    jobRoleId?: string | null
    startedAt?: Date | null
    user?: {
      id: string
      name: string
      email: string
    } | null
  }
  jiraAccount?: {
    id: string
    personId: string
    jiraAccountId: string
    jiraEmail: string
    jiraDisplayName: string | null
    createdAt: Date
    updatedAt: Date
  } | null
  githubAccount?: {
    id: string
    personId: string
    githubUsername: string
    githubDisplayName: string | null
    githubEmail: string | null
    createdAt: Date
    updatedAt: Date
  } | null
}

export function PersonForm({
  jobRoles,
  initialManagerId,
  initialTeamId,
  person,
  jiraAccount,
  githubAccount,
}: PersonFormProps) {
  // Format date for input fields - convert Date to ISO string
  const formatDateToISO = (date: Date | null) => {
    if (!date) return ''
    return new Date(date).toISOString()
  }

  const [formData, setFormData] = useState<PersonFormData>({
    name: person?.name || '',
    email: person?.email || '',
    role: person?.role || '',
    status: (person?.status as PersonFormData['status']) || 'active',
    birthday: formatDateToISO(person?.birthday || null),
    avatar: person?.avatar || '',
    employeeType: person?.employeeType || undefined,
    teamId: person?.teamId || initialTeamId || '',
    managerId: person?.managerId || initialManagerId || '',
    jobRoleId: person?.jobRoleId || '',
    startedAt: formatDateToISO(person?.startedAt || null),
  })

  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrors({})

    let result
    try {
      // Validate the form data using Zod schema
      const validatedData = personSchema.parse(formData)

      if (person) {
        result = await updatePerson(person.id, validatedData)
      } else {
        result = await createPerson(validatedData)
      }
    } catch (error: unknown) {
      console.error('Error submitting form:', error)

      if (error && typeof error === 'object' && 'issues' in error) {
        // Handle Zod validation errors
        const fieldErrors: Record<string, string> = {}
        const zodError = error as {
          issues: Array<{ path: string[]; message: string }>
        }
        zodError.issues.forEach(issue => {
          if (issue.path && issue.path.length > 0) {
            fieldErrors[issue.path[0]] = issue.message
          }
        })
        setErrors(fieldErrors)
      } else {
        // Handle other errors (server errors, etc.)
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Error submitting form. Please try again.'
        setErrors({ general: errorMessage })
      }
      setIsSubmitting(false)
      return
    }

    // Redirect outside of try-catch block
    setIsSubmitting(false)
    if (person) {
      // When updating, redirect to the person detail page
      router.push(`/people/${person.id}`)
    } else if (result?.id) {
      // When creating, redirect to the new person detail page
      router.push(`/people/${result.id}`)
    }
  }

  const handleInputChange = (
    field: keyof PersonFormData,
    value: string | undefined
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  // Helper functions to convert between empty strings and "none" for Select components
  const getSelectValue = (value: string | undefined) => value || 'none'
  const getFormValue = (value: string) => (value === 'none' ? '' : value)

  // Define sections for the form template
  const sections: FormSection[] = [
    {
      title: 'Basic Information',
      icon: User,
      content: (
        <>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='name'>
                Name <span className='text-destructive'>*</span>
              </Label>
              <Input
                id='name'
                type='text'
                value={formData.name}
                onChange={e => handleInputChange('name', e.target.value)}
                placeholder='Enter full name'
                className={errors.name ? 'border-destructive' : ''}
                required
              />
              {errors.name && (
                <p className='text-sm text-destructive'>{errors.name}</p>
              )}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='email'>Email</Label>
              <Input
                id='email'
                type='email'
                value={formData.email}
                onChange={e => handleInputChange('email', e.target.value)}
                placeholder='Enter email address'
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && (
                <p className='text-sm text-destructive'>{errors.email}</p>
              )}
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='role'>Title</Label>
              <Input
                id='role'
                type='text'
                value={formData.role}
                onChange={e => handleInputChange('role', e.target.value)}
                placeholder='e.g., Senior Engineer, Product Manager'
                className={errors.role ? 'border-destructive' : ''}
              />
              {errors.role && (
                <p className='text-sm text-destructive'>{errors.role}</p>
              )}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='jobRole'>Job Role</Label>
              <Select
                value={getSelectValue(formData.jobRoleId)}
                onValueChange={value =>
                  handleInputChange('jobRoleId', getFormValue(value))
                }
              >
                <SelectTrigger
                  className={errors.jobRoleId ? 'border-destructive' : ''}
                >
                  <SelectValue placeholder='Select a job role' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='none'>No job role</SelectItem>
                  {jobRoles.map(jobRole => (
                    <SelectItem key={jobRole.id} value={jobRole.id}>
                      {jobRole.title} - {jobRole.level.name} (
                      {jobRole.domain.name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.jobRoleId && (
                <p className='text-sm text-destructive'>{errors.jobRoleId}</p>
              )}
            </div>
          </div>
        </>
      ),
    },
    {
      title: 'Team & Reporting',
      icon: Users,
      content: (
        <>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='team'>Team</Label>
              <TeamSelect
                value={getSelectValue(formData.teamId)}
                onValueChange={value =>
                  handleInputChange('teamId', getFormValue(value))
                }
                placeholder='Select a team'
                includeNone={true}
                className={errors.teamId ? 'border-destructive' : ''}
              />
              {errors.teamId && (
                <p className='text-sm text-destructive'>{errors.teamId}</p>
              )}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='manager'>Manager</Label>
              <PersonSelect
                value={getSelectValue(formData.managerId)}
                onValueChange={value =>
                  handleInputChange('managerId', getFormValue(value))
                }
                placeholder='Select a manager'
                includeNone={true}
                noneLabel='No manager'
                showAvatar={true}
                showRole={true}
                className={errors.managerId ? 'border-destructive' : ''}
              />
            </div>
          </div>
        </>
      ),
    },
    {
      title: 'Status & Dates',
      icon: Calendar,
      content: (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
          <div className='space-y-2'>
            <Label htmlFor='status'>Status</Label>
            <Select
              value={formData.status}
              onValueChange={value =>
                handleInputChange('status', value as PersonFormData['status'])
              }
            >
              <SelectTrigger
                className={errors.status ? 'border-destructive' : ''}
              >
                <SelectValue placeholder='Select status' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='active'>Active</SelectItem>
                <SelectItem value='inactive'>Inactive</SelectItem>
                <SelectItem value='on_leave'>On Leave</SelectItem>
              </SelectContent>
            </Select>
            {errors.status && (
              <p className='text-sm text-destructive'>{errors.status}</p>
            )}
          </div>

          <div className='space-y-2'>
            <Label htmlFor='employeeType'>Employee Type</Label>
            <Select
              value={getSelectValue(formData.employeeType)}
              onValueChange={value =>
                handleInputChange('employeeType', getFormValue(value))
              }
            >
              <SelectTrigger
                className={errors.employeeType ? 'border-destructive' : ''}
              >
                <SelectValue placeholder='Select employee type' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='none'>Not specified</SelectItem>
                <SelectItem value='FULL_TIME'>Full Time</SelectItem>
                <SelectItem value='PART_TIME'>Part Time</SelectItem>
                <SelectItem value='INTERN'>Intern</SelectItem>
                <SelectItem value='CONSULTANT'>Consultant</SelectItem>
              </SelectContent>
            </Select>
            {errors.employeeType && (
              <p className='text-sm text-destructive'>{errors.employeeType}</p>
            )}
          </div>

          <DateTimePickerWithNaturalInput
            label='Birthday'
            value={formData.birthday}
            onChange={value => handleInputChange('birthday', value)}
            placeholder='Pick birthday'
            error={!!errors.birthday}
            className={errors.birthday ? 'border-destructive' : ''}
            dateOnly={true}
          />
          {errors.birthday && (
            <p className='text-sm text-destructive'>{errors.birthday}</p>
          )}

          <DateTimePickerWithNaturalInput
            label='Start Date'
            value={formData.startedAt}
            onChange={value => handleInputChange('startedAt', value)}
            placeholder='Pick start date'
            error={!!errors.startedAt}
            className={errors.startedAt ? 'border-destructive' : ''}
            dateOnly={true}
          />
          {errors.startedAt && (
            <p className='text-sm text-destructive'>{errors.startedAt}</p>
          )}
        </div>
      ),
    },
  ]

  // Create sidebar content
  const sidebar = person ? (
    <>
      {/* User Account Linking */}
      <div className='space-y-3'>
        <div>
          <h3 className='text-lg font-semibold'>User Account</h3>
          <p className='text-sm text-muted-foreground'>
            Link this person to a user account for system access. Changes are
            applied immediately.
          </p>
        </div>
        <UserLinkForm personId={person.id} linkedUser={person.user} />
      </div>

      {/* Jira Account Linking */}
      <div className='space-y-3'>
        <div>
          <h3 className='text-lg font-semibold flex items-center gap-2'>
            <FaJira className='h-5 w-5' />
            Jira Account
          </h3>
          <p className='text-sm text-muted-foreground'>
            Link this person to their Jira account for work activity tracking.
            Changes are applied immediately.
          </p>
        </div>
        <JiraAccountLinker
          personId={person.id}
          personName={formData.name || 'New Person'}
          personEmail={formData.email || ''}
          jiraAccount={jiraAccount}
        />
      </div>

      {/* GitHub Account Linking */}
      <div className='space-y-3'>
        <div>
          <h3 className='text-lg font-semibold flex items-center gap-2'>
            <FaGithub className='h-5 w-5' />
            GitHub Account
          </h3>
          <p className='text-sm text-muted-foreground'>
            Link this person to their GitHub account for PR activity tracking.
            Changes are applied immediately.
          </p>
        </div>
        <GithubAccountLinker
          personId={person.id}
          personName={formData.name || 'New Person'}
          githubAccount={githubAccount}
        />
      </div>
    </>
  ) : undefined

  return (
    <FormTemplate
      sections={sections}
      sidebar={sidebar}
      onSubmit={handleSubmit}
      submitButton={{
        text: person ? 'Update Person' : 'Create Person',
        loadingText: person ? 'Updating...' : 'Creating...',
        disabled: !formData.name.trim(),
      }}
      generalError={errors.general}
      isSubmitting={isSubmitting}
    />
  )
}
