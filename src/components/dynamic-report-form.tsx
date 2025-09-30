'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'
import { getPeopleForFeedbackFilters } from '@/lib/actions'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

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
}

export function DynamicReportForm({
  reportName,
  reportDescription,
  schemaFields,
  codeId,
  initialData = {},
}: DynamicReportFormProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>(initialData)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [people, setPeople] = useState<
    Array<{ id: string; name: string; email: string | null }>
  >([])
  const router = useRouter()

  const fields = schemaFields

  useEffect(() => {
    // Load people for personId fields
    const loadPeople = async () => {
      try {
        const peopleData = await getPeopleForFeedbackFilters()
        setPeople(peopleData)
      } catch (error) {
        console.error('Error loading people:', error)
      }
    }
    loadPeople()
  }, [])

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
      for (const [key, value] of Object.entries(formData)) {
        if (value !== undefined && value !== null) {
          submitData.append(key, String(value))
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
          <Label htmlFor={field.name} className='text-sm font-medium'>
            {field.name === 'personId' ? 'Person' : field.name}
            {field.required && <span className='text-red-500 ml-1'>*</span>}
          </Label>
          <Select
            value={value}
            onValueChange={val => handleInputChange(field.name, val)}
            required={field.required}
          >
            <SelectTrigger className={hasError ? 'border-red-500' : ''}>
              <SelectValue placeholder='Select a person...' />
            </SelectTrigger>
            <SelectContent>
              {people.map(person => (
                <SelectItem key={person.id} value={person.id}>
                  {person.name} ({person.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasError && (
            <p className='text-sm text-red-500'>{errors[field.name]}</p>
          )}
        </div>
      )
    }

    // Date fields
    if (field.type === 'date' || field.name.toLowerCase().includes('date')) {
      return (
        <div key={field.name} className='space-y-2'>
          <Label htmlFor={field.name} className='text-sm font-medium'>
            {field.name}
            {field.required && <span className='text-red-500 ml-1'>*</span>}
          </Label>
          <Input
            id={field.name}
            type='date'
            value={value}
            onChange={e => handleInputChange(field.name, e.target.value)}
            required={field.required}
            className={hasError ? 'border-red-500' : ''}
          />
          {hasError && (
            <p className='text-sm text-red-500'>{errors[field.name]}</p>
          )}
        </div>
      )
    }

    // Boolean fields
    if (field.type === 'boolean') {
      const boolValue = formData[field.name] ?? field.defaultValue ?? false
      return (
        <div key={field.name} className='flex items-center space-x-2'>
          <Checkbox
            id={field.name}
            checked={!!boolValue}
            onCheckedChange={checked => handleInputChange(field.name, checked)}
            required={field.required}
          />
          <Label htmlFor={field.name} className='text-sm font-medium'>
            {field.name}
            {field.required && <span className='text-red-500 ml-1'>*</span>}
          </Label>
          {hasError && (
            <p className='text-sm text-red-500'>{errors[field.name]}</p>
          )}
        </div>
      )
    }

    // String and number fields (default)
    return (
      <div key={field.name} className='space-y-2'>
        <Label htmlFor={field.name} className='text-sm font-medium'>
          {field.name}
          {field.required && <span className='text-red-500 ml-1'>*</span>}
        </Label>
        <Input
          id={field.name}
          type={field.type === 'number' ? 'number' : 'text'}
          value={value}
          onChange={e => handleInputChange(field.name, e.target.value)}
          required={field.required}
          className={hasError ? 'border-red-500' : ''}
          placeholder={field.description}
        />
        {hasError && (
          <p className='text-sm text-red-500'>{errors[field.name]}</p>
        )}
      </div>
    )
  }

  return (
    <Card className='w-full max-w-2xl mx-auto'>
      <CardHeader>
        <CardTitle>Run {reportName}</CardTitle>
        {reportDescription && (
          <CardDescription>{reportDescription}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className='space-y-6'>
          {fields.length > 0 ? (
            fields.map(renderField)
          ) : (
            <div className='p-4 bg-yellow-50 border border-yellow-200 rounded-md'>
              <p className='text-sm text-yellow-700'>
                No form fields found. This report may not require any input
                parameters.
              </p>
            </div>
          )}

          {errors.submit && (
            <div className='p-3 bg-red-50 border border-red-200 rounded-md'>
              <div className='flex items-center'>
                <AlertCircle className='h-4 w-4 text-red-500 mr-2' />
                <p className='text-sm text-red-700'>{errors.submit}</p>
              </div>
            </div>
          )}

          <div className='flex justify-end space-x-2'>
            <Button
              type='submit'
              disabled={isSubmitting}
              className='min-w-[100px]'
            >
              {isSubmitting ? 'Running...' : 'Run Report'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
