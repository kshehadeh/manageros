'use client'

import { Button } from '@/components/ui/button'
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
import { SectionHeader } from '@/components/ui/section-header'
import { DateTimePickerWithNaturalInput } from '@/components/ui/datetime-picker-with-natural-input'
import { useState } from 'react'
import { createPerson, updatePerson } from '@/lib/actions/person'
import { type PersonFormData, personSchema } from '@/lib/validations'
import { UserLinkForm } from '@/components/user-link-form'
import { JiraAccountLinker } from '@/components/jira-account-linker'
import { GithubAccountLinker } from '@/components/github-account-linker'
import { AlertCircle, User, Users, Calendar } from 'lucide-react'
import { FaJira, FaGithub } from 'react-icons/fa'

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
      role: string
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

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrors({})

    try {
      // Validate the form data using Zod schema
      const validatedData = personSchema.parse(formData)

      if (person) {
        await updatePerson(person.id, validatedData)
      } else {
        await createPerson(validatedData)
      }
    } catch (error: unknown) {
      console.error('Error submitting form:', error)

      // Don't handle redirect errors - let them bubble up
      if (error && typeof error === 'object' && 'digest' in error) {
        const digest = (error as { digest?: string }).digest
        if (digest?.startsWith('NEXT_REDIRECT')) {
          throw error // Re-throw redirect errors
        }
      }

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
    } finally {
      setIsSubmitting(false)
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

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      {/* General Error Message */}
      {errors.general && (
        <div className='bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-destructive text-sm flex items-center gap-2'>
          <AlertCircle className='h-4 w-4' />
          {errors.general}
        </div>
      )}

      <div className='flex flex-col lg:flex-row gap-6'>
        {/* Main Form Content */}
        <div className='flex-1 space-y-6'>
          {/* Basic Information */}
          <div className='space-y-4'>
            <SectionHeader icon={User} title='Basic Information' />
            <div className='space-y-4'>
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
          </div>

          {/* Team & Reporting */}
          <div className='space-y-4'>
            <SectionHeader icon={Users} title='Team & Reporting' />
            <div className='space-y-4'>
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
          </div>

          {/* Status & Dates */}
          <div className='space-y-4'>
            <SectionHeader icon={Calendar} title='Status & Dates' />
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='status'>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={value =>
                    handleInputChange(
                      'status',
                      value as PersonFormData['status']
                    )
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
                  <p className='text-sm text-destructive'>
                    {errors.employeeType}
                  </p>
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
          </div>

          {/* Submit Button */}
          <div className='flex justify-end gap-2'>
            <Button
              type='submit'
              disabled={isSubmitting || !formData.name.trim()}
              className='min-w-[120px]'
            >
              {isSubmitting
                ? person
                  ? 'Updating...'
                  : 'Creating...'
                : person
                  ? 'Update Person'
                  : 'Create Person'}
            </Button>
          </div>
        </div>

        {/* Right Sidebar - Account Linking Sections */}
        {person && (
          <div className='w-full lg:w-80 space-y-6'>
            {/* User Account Linking */}
            <div className='space-y-3'>
              <div>
                <h3 className='text-lg font-semibold'>User Account</h3>
                <p className='text-sm text-muted-foreground'>
                  Link this person to a user account for system access. Changes
                  are applied immediately.
                </p>
              </div>
              <UserLinkForm personId={person!.id} linkedUser={person!.user} />
            </div>

            {/* Jira Account Linking */}
            <div className='space-y-3'>
              <div>
                <h3 className='text-lg font-semibold flex items-center gap-2'>
                  <FaJira className='h-5 w-5' />
                  Jira Account
                </h3>
                <p className='text-sm text-muted-foreground'>
                  Link this person to their Jira account for work activity
                  tracking. Changes are applied immediately.
                </p>
              </div>
              <JiraAccountLinker
                personId={person!.id}
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
                  Link this person to their GitHub account for PR activity
                  tracking. Changes are applied immediately.
                </p>
              </div>
              <GithubAccountLinker
                personId={person!.id}
                personName={formData.name || 'New Person'}
                githubAccount={githubAccount}
              />
            </div>
          </div>
        )}
      </div>
    </form>
  )
}
