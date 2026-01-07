'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { PersonSelect } from '@/components/ui/person-select'
import { SectionHeader } from '@/components/ui/section-header'
import { DateTimePickerWithNaturalInput } from '@/components/ui/datetime-picker-with-natural-input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AlertCircle, FileText, Settings } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { ReportRendererId } from '@/lib/reports/types'

interface FormField {
  name: string
  type: string
  required: boolean
  defaultValue?: unknown
  description?: string
}

interface DynamicReportFormProps {
  reportName: string
  reportDescription?: string
  schemaFields: FormField[]
  codeId: string
  initialData?: Record<string, unknown>
  supportedRenderers: ReportRendererId[]
}

// Helper function to convert field names to human-friendly labels
function getFieldLabel(fieldName: string): string {
  const labelMap: Record<string, string> = {
    fromDate: 'From Date',
    toDate: 'To Date',
    startDate: 'Start Date',
    endDate: 'End Date',
    personId: 'Person',
    includeFeedback: 'Include Feedback',
    includeTasks: 'Include Tasks',
    includeOneOnOnes: 'Include One-on-Ones',
    includeInitiatives: 'Include Initiatives',
    includeReports: 'Include Reports',
    includeSynopsis: 'Include Synopsis',
    teamId: 'Team',
    initiativeId: 'Initiative',
    taskId: 'Task',
    reportId: 'Report',
    userId: 'User',
    managerId: 'Manager',
    directReportId: 'Direct Report',
  }

  return (
    labelMap[fieldName] ||
    fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim()
  )
}

export function DynamicReportForm({
  reportName,
  reportDescription,
  schemaFields,
  codeId,
  initialData = {},
  supportedRenderers,
}: DynamicReportFormProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>(initialData)
  const [renderer, setRenderer] = useState<ReportRendererId>(
    supportedRenderers.includes('web') ? 'web' : 'markdown'
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const fields = schemaFields

  const handleInputChange = (fieldName: string, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value,
    }))

    // Clear error when user starts typing
    if (errors[fieldName]) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: '',
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrors({})

    try {
      // Create FormData from form state
      const submitData = new FormData()
      // Add renderer selection (shared across all reports)
      submitData.append('renderer', renderer)

      for (const [key, value] of Object.entries(formData)) {
        if (value !== undefined && value !== null) {
          // Handle boolean values properly
          if (typeof value === 'boolean') {
            submitData.append(key, value ? 'true' : 'false')
          } else {
            submitData.append(key, String(value))
          }
        }
      }

      // Make API call
      const response = await fetch(`/api/reports/${codeId}/run`, {
        method: 'POST',
        body: submitData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(
          result.error || 'An error occurred while running the report'
        )
      }

      if (result.success && result.redirectUrl) {
        router.push(result.redirectUrl)
      } else {
        throw new Error('Invalid response from server')
      }
    } catch (error) {
      console.error('Form submission error:', error)
      setErrors({
        submit:
          error instanceof Error
            ? error.message
            : 'An error occurred while submitting the form',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderField = (field: FormField) => {
    const value = String(formData[field.name] ?? field.defaultValue ?? '')
    const hasError = !!errors[field.name]

    // Special handling for personId fields
    if (
      field.name.toLowerCase().includes('personid') ||
      field.name === 'personId'
    ) {
      return (
        <div key={field.name} className='space-y-2'>
          <Label htmlFor={field.name}>
            {getFieldLabel(field.name)}
            {field.required && <span className='text-destructive ml-1'>*</span>}
          </Label>
          <PersonSelect
            value={value}
            onValueChange={val => handleInputChange(field.name, val)}
            placeholder='Select a person...'
            showAvatar={true}
            showRole={true}
            className={hasError ? 'border-destructive' : ''}
          />
          {hasError && (
            <p className='text-sm text-destructive'>{errors[field.name]}</p>
          )}
        </div>
      )
    }

    // Date fields
    if (field.type === 'date' || field.name.toLowerCase().includes('date')) {
      return (
        <div key={field.name} className='space-y-2'>
          <DateTimePickerWithNaturalInput
            value={value}
            onChange={val => handleInputChange(field.name, val)}
            label={getFieldLabel(field.name)}
            required={field.required}
            error={hasError}
            dateOnly={true}
            placeholder={`Pick ${getFieldLabel(field.name).toLowerCase()}`}
          />
          {hasError && (
            <p className='text-sm text-destructive'>{errors[field.name]}</p>
          )}
        </div>
      )
    }

    // Boolean fields - check both type and field name patterns
    if (
      field.type === 'boolean' ||
      field.name.toLowerCase().startsWith('include') ||
      field.name.toLowerCase().startsWith('has') ||
      field.name.toLowerCase().startsWith('is') ||
      field.name.toLowerCase().startsWith('show')
    ) {
      const boolValue = formData[field.name] ?? field.defaultValue ?? false
      return (
        <div key={field.name} className='flex items-center space-x-2'>
          <Checkbox
            id={field.name}
            checked={!!boolValue}
            onCheckedChange={checked => handleInputChange(field.name, checked)}
            required={field.required}
          />
          <Label htmlFor={field.name}>
            {getFieldLabel(field.name)}
            {field.required && <span className='text-destructive ml-1'>*</span>}
          </Label>
          {hasError && (
            <p className='text-sm text-destructive'>{errors[field.name]}</p>
          )}
        </div>
      )
    }

    // String and number fields (default)
    return (
      <div key={field.name} className='space-y-2'>
        <Label htmlFor={field.name} className='text-sm font-medium'>
          {getFieldLabel(field.name)}
          {field.required && <span className='text-destructive ml-1'>*</span>}
        </Label>
        <Input
          id={field.name}
          type={field.type === 'number' ? 'number' : 'text'}
          value={value}
          onChange={e => handleInputChange(field.name, e.target.value)}
          required={field.required}
          className={hasError ? 'border-destructive' : ''}
          placeholder={field.description}
        />
        {hasError && (
          <p className='text-sm text-destructive'>{errors[field.name]}</p>
        )}
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className='mb-6'>
        <h1 className='text-2xl font-bold mb-2'>Run {reportName}</h1>
        {reportDescription && (
          <p className='text-muted-foreground'>{reportDescription}</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className='space-y-6'>
        {/* General Error Message */}
        {errors.submit && (
          <div className='bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-destructive text-sm flex items-center gap-2'>
            <AlertCircle className='h-4 w-4' />
            {errors.submit}
          </div>
        )}

        {/* Output Format Selection (shared across all reports) */}
        {supportedRenderers.length > 1 && (
          <div className='space-y-6'>
            <SectionHeader icon={FileText} title='Output Format' />
            <div className='space-y-2'>
              <Label htmlFor='renderer'>Output Format</Label>
              <Select
                value={renderer}
                onValueChange={setRenderer as (value: string) => void}
              >
                <SelectTrigger id='renderer'>
                  <SelectValue placeholder='Select output format' />
                </SelectTrigger>
                <SelectContent>
                  {supportedRenderers.includes('web') && (
                    <SelectItem value='web'>Web (Rich UI)</SelectItem>
                  )}
                  {supportedRenderers.includes('markdown') && (
                    <SelectItem value='markdown'>Markdown</SelectItem>
                  )}
                </SelectContent>
              </Select>
              <p className='text-sm text-muted-foreground'>
                Choose how you want the report results to be displayed
              </p>
            </div>
          </div>
        )}

        {/* Form Fields Section */}
        {fields.length > 0 ? (
          <div className='space-y-6'>
            <SectionHeader icon={Settings} title='Report Parameters' />
            <div className='space-y-4'>{fields.map(renderField)}</div>
          </div>
        ) : (
          <div className='bg-muted/50 border border-muted rounded-lg p-4'>
            <div className='flex items-center gap-2'>
              <FileText className='h-4 w-4 text-muted-foreground' />
              <p className='text-sm text-muted-foreground'>
                No form fields found. This report may not require any input
                parameters.
              </p>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className='flex justify-end'>
          <Button
            type='submit'
            disabled={isSubmitting}
            className='min-w-[120px]'
          >
            {isSubmitting ? 'Running...' : 'Run Report'}
          </Button>
        </div>
      </form>
    </div>
  )
}
