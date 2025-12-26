'use client'

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  createToleranceRule,
  updateToleranceRule,
} from '@/lib/actions/tolerance-rules'
import { getRuleFormFields } from '@/lib/tolerance-rules/form-registry'
import type {
  ToleranceRule,
  ToleranceRuleType,
  CreateToleranceRuleInput,
  UpdateToleranceRuleInput,
  ToleranceRuleConfig,
} from '@/types/tolerance-rule'

interface ToleranceRuleFormProps {
  rule?: ToleranceRule
}

// Default configs for each rule type
const getDefaultConfig = (ruleType: ToleranceRuleType): ToleranceRuleConfig => {
  switch (ruleType) {
    case 'one_on_one_frequency':
      return {
        warningThresholdDays: 14,
        urgentThresholdDays: 30,
        onlyFullTimeEmployees: false,
      }
    case 'initiative_checkin':
      return { warningThresholdDays: 14 }
    case 'feedback_360':
      return { warningThresholdMonths: 6 }
    case 'manager_span':
      return { maxDirectReports: 8 }
  }
}

export function ToleranceRuleForm({ rule }: ToleranceRuleFormProps) {
  const router = useRouter()
  const isEditing = !!rule

  const [ruleType, setRuleType] = useState<ToleranceRuleType>(
    (rule?.ruleType || 'one_on_one_frequency') as ToleranceRuleType
  )
  const [name, setName] = useState(rule?.name || '')
  const [description, setDescription] = useState(rule?.description || '')
  const [isEnabled, setIsEnabled] = useState(rule?.isEnabled ?? true)
  const [config, setConfig] = useState<ToleranceRuleConfig>(
    rule?.config || getDefaultConfig(ruleType)
  )

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Get the form component for the current rule type
  const FormFields = useMemo(() => getRuleFormFields(ruleType), [ruleType])

  // Update config when rule type changes
  const handleRuleTypeChange = (newRuleType: ToleranceRuleType) => {
    setRuleType(newRuleType)
    if (!rule || rule.ruleType !== newRuleType) {
      setConfig(getDefaultConfig(newRuleType))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrors({})

    try {
      const input: CreateToleranceRuleInput | UpdateToleranceRuleInput = {
        ruleType,
        name,
        description: description || undefined,
        isEnabled,
        config,
      }

      if (isEditing && rule) {
        await updateToleranceRule(rule.id, input as UpdateToleranceRuleInput)
      } else {
        await createToleranceRule(input as CreateToleranceRuleInput)
      }

      router.push('/organization/settings/tolerance-rules')
      router.refresh()
    } catch (error) {
      console.error('Error saving rule:', error)
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Error saving rule. Please try again.'
      setErrors({ general: errorMessage })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      {errors.general && (
        <div className='rounded-md bg-destructive/15 p-3 text-sm text-destructive'>
          {errors.general}
        </div>
      )}

      <div className='space-y-2'>
        <Label htmlFor='ruleType'>Rule Type</Label>
        <Select
          value={ruleType}
          onValueChange={handleRuleTypeChange}
          disabled={isEditing}
        >
          <SelectTrigger id='ruleType'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='one_on_one_frequency'>1:1 Frequency</SelectItem>
            <SelectItem value='initiative_checkin'>
              Initiative Check-In
            </SelectItem>
            <SelectItem value='feedback_360'>360 Feedback</SelectItem>
            <SelectItem value='manager_span'>Manager Span</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className='space-y-2'>
        <Label htmlFor='name'>
          Name <span className='text-destructive'>*</span>
        </Label>
        <Input
          id='name'
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />
      </div>

      <div className='space-y-2'>
        <Label htmlFor='description'>Description</Label>
        <Textarea
          id='description'
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={3}
        />
      </div>

      <div className='space-y-4'>
        {/* Type assertion needed because FormFields expects specific config type from registry */}
        {/* The registry ensures type safety at runtime */}
        {React.createElement(FormFields, {
          config: config as never,
          onChange: setConfig as never,
        })}
      </div>

      <div className='flex items-center space-x-2'>
        <input
          type='checkbox'
          id='isEnabled'
          checked={isEnabled}
          onChange={e => setIsEnabled(e.target.checked)}
          className='h-4 w-4 rounded border-gray-300'
        />
        <Label htmlFor='isEnabled' className='cursor-pointer'>
          Enable this rule
        </Label>
      </div>

      <div className='flex justify-end gap-2'>
        <Button type='button' variant='outline' onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type='submit' disabled={isSubmitting}>
          {isSubmitting
            ? 'Saving...'
            : isEditing
              ? 'Update Rule'
              : 'Create Rule'}
        </Button>
      </div>
    </form>
  )
}
