'use client'

import { useState } from 'react'
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
import type {
  ToleranceRule,
  ToleranceRuleType,
  CreateToleranceRuleInput,
  UpdateToleranceRuleInput,
  ManagerSpanConfig,
  Feedback360Config,
  OneOnOneFrequencyConfig,
  ToleranceRuleConfig,
} from '@/types/tolerance-rule'

interface ToleranceRuleFormProps {
  rule?: ToleranceRule
}

export function ToleranceRuleForm({ rule }: ToleranceRuleFormProps) {
  const router = useRouter()
  const isEditing = !!rule

  const [formData, setFormData] = useState({
    ruleType: (rule?.ruleType || 'one_on_one_frequency') as ToleranceRuleType,
    name: rule?.name || '',
    description: rule?.description || '',
    isEnabled: rule?.isEnabled ?? true,
    // Config fields based on rule type
    warningThresholdDays:
      (rule?.config as OneOnOneFrequencyConfig)?.warningThresholdDays || 14,
    urgentThresholdDays:
      (rule?.config as OneOnOneFrequencyConfig)?.urgentThresholdDays || 30,
    warningThresholdMonths:
      (rule?.config as Feedback360Config)?.warningThresholdMonths || 6,
    maxDirectReports:
      (rule?.config as ManagerSpanConfig)?.maxDirectReports || 8,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrors({})

    try {
      let config: ToleranceRuleConfig
      switch (formData.ruleType) {
        case 'one_on_one_frequency':
          config = {
            warningThresholdDays: Number(formData.warningThresholdDays),
            urgentThresholdDays: Number(formData.urgentThresholdDays),
          }
          break
        case 'initiative_checkin':
          config = {
            warningThresholdDays: Number(formData.warningThresholdDays),
          }
          break
        case 'feedback_360':
          config = {
            warningThresholdMonths: Number(formData.warningThresholdMonths),
          }
          break
        case 'manager_span':
          config = {
            maxDirectReports: Number(formData.maxDirectReports),
          }
          break
      }

      const input: CreateToleranceRuleInput | UpdateToleranceRuleInput = {
        ruleType: formData.ruleType,
        name: formData.name,
        description: formData.description || undefined,
        isEnabled: formData.isEnabled,
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

  const renderConfigFields = () => {
    switch (formData.ruleType) {
      case 'one_on_one_frequency':
        return (
          <>
            <div className='space-y-2'>
              <Label htmlFor='warningThresholdDays'>
                Warning Threshold (days)
              </Label>
              <Input
                id='warningThresholdDays'
                type='number'
                min='1'
                value={formData.warningThresholdDays}
                onChange={e =>
                  setFormData({
                    ...formData,
                    warningThresholdDays: parseInt(e.target.value) || 0,
                  })
                }
                required
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='urgentThresholdDays'>
                Urgent Threshold (days)
              </Label>
              <Input
                id='urgentThresholdDays'
                type='number'
                min='1'
                value={formData.urgentThresholdDays}
                onChange={e =>
                  setFormData({
                    ...formData,
                    urgentThresholdDays: parseInt(e.target.value) || 0,
                  })
                }
                required
              />
            </div>
          </>
        )
      case 'initiative_checkin':
        return (
          <div className='space-y-2'>
            <Label htmlFor='warningThresholdDays'>
              Warning Threshold (days)
            </Label>
            <Input
              id='warningThresholdDays'
              type='number'
              min='1'
              value={formData.warningThresholdDays}
              onChange={e =>
                setFormData({
                  ...formData,
                  warningThresholdDays: parseInt(e.target.value) || 0,
                })
              }
              required
            />
          </div>
        )
      case 'feedback_360':
        return (
          <div className='space-y-2'>
            <Label htmlFor='warningThresholdMonths'>
              Warning Threshold (months)
            </Label>
            <Input
              id='warningThresholdMonths'
              type='number'
              min='1'
              value={formData.warningThresholdMonths}
              onChange={e =>
                setFormData({
                  ...formData,
                  warningThresholdMonths: parseInt(e.target.value) || 0,
                })
              }
              required
            />
          </div>
        )
      case 'manager_span':
        return (
          <div className='space-y-2'>
            <Label htmlFor='maxDirectReports'>Maximum Direct Reports</Label>
            <Input
              id='maxDirectReports'
              type='number'
              min='1'
              value={formData.maxDirectReports}
              onChange={e =>
                setFormData({
                  ...formData,
                  maxDirectReports: parseInt(e.target.value) || 0,
                })
              }
              required
            />
          </div>
        )
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
          value={formData.ruleType}
          onValueChange={value =>
            setFormData({ ...formData, ruleType: value as ToleranceRuleType })
          }
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
          value={formData.name}
          onChange={e => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div className='space-y-2'>
        <Label htmlFor='description'>Description</Label>
        <Textarea
          id='description'
          value={formData.description}
          onChange={e =>
            setFormData({ ...formData, description: e.target.value })
          }
          rows={3}
        />
      </div>

      <div className='space-y-4'>{renderConfigFields()}</div>

      <div className='flex items-center space-x-2'>
        <input
          type='checkbox'
          id='isEnabled'
          checked={formData.isEnabled}
          onChange={e =>
            setFormData({ ...formData, isEnabled: e.target.checked })
          }
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
