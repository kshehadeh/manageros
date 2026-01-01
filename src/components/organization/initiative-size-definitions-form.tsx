'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { PageSection } from '@/components/ui/page-section'
import { SectionHeader } from '@/components/ui/section-header'
import { Ruler, Save } from 'lucide-react'
import {
  updateInitiativeSizeDefinitions,
  type InitiativeSizeDefinitionsType,
} from '@/lib/actions/organization'
import {
  ALL_INITIATIVE_SIZES,
  INITIATIVE_SIZE_LABELS,
  INITIATIVE_SIZE_DEFAULT_DESCRIPTIONS,
  type InitiativeSize,
} from '@/lib/initiative-size'

interface InitiativeSizeDefinitionsFormProps {
  initialDefinitions: InitiativeSizeDefinitionsType | null
}

export function InitiativeSizeDefinitionsForm({
  initialDefinitions,
}: InitiativeSizeDefinitionsFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [definitions, setDefinitions] = useState<InitiativeSizeDefinitionsType>(
    initialDefinitions || {}
  )

  const handleChange = (size: InitiativeSize, value: string) => {
    setDefinitions(prev => ({
      ...prev,
      [size]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      await updateInitiativeSizeDefinitions(definitions)
      router.refresh()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to save definitions'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReset = () => {
    const defaults: InitiativeSizeDefinitionsType = {}
    for (const size of ALL_INITIATIVE_SIZES) {
      defaults[size] = INITIATIVE_SIZE_DEFAULT_DESCRIPTIONS[size]
    }
    setDefinitions(defaults)
  }

  return (
    <form onSubmit={handleSubmit}>
      <PageSection
        header={
          <SectionHeader
            icon={Ruler}
            title='Size Definitions'
            description='Customize what each size means for your team. Leave blank to use defaults.'
          />
        }
      >
        <div className='space-y-6'>
          {ALL_INITIATIVE_SIZES.map(size => (
            <div key={size} className='space-y-2'>
              <Label htmlFor={`size-${size}`} className='text-base font-medium'>
                {INITIATIVE_SIZE_LABELS[size]} ({size.toUpperCase()})
              </Label>
              <Textarea
                id={`size-${size}`}
                value={definitions[size] || ''}
                onChange={e => handleChange(size, e.target.value)}
                placeholder={INITIATIVE_SIZE_DEFAULT_DESCRIPTIONS[size]}
                rows={2}
                className='resize-none'
              />
              <p className='text-xs text-muted-foreground'>
                Default: {INITIATIVE_SIZE_DEFAULT_DESCRIPTIONS[size]}
              </p>
            </div>
          ))}

          {error && (
            <div className='text-sm text-destructive bg-destructive/10 p-3 rounded-md'>
              {error}
            </div>
          )}

          <div className='flex gap-3 pt-4'>
            <Button type='submit' disabled={isSubmitting}>
              <Save className='w-4 h-4 mr-2' />
              {isSubmitting ? 'Saving...' : 'Save Definitions'}
            </Button>
            <Button
              type='button'
              variant='outline'
              onClick={handleReset}
              disabled={isSubmitting}
            >
              Reset to Defaults
            </Button>
          </div>
        </div>
      </PageSection>
    </form>
  )
}
