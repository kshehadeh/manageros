import { Button } from '@/components/ui/button'
import { SectionHeader } from '@/components/ui/section-header'
import { AlertCircle } from 'lucide-react'
import { type ReactNode } from 'react'

type LucideIcon = React.ComponentType<{ className?: string }>

export interface FormSection {
  title: string
  icon: LucideIcon
  action?: ReactNode
  content: ReactNode
}

export interface FormTemplateProps {
  sections: FormSection[]
  sidebar?: ReactNode
  onSubmit: (e: React.FormEvent) => void | Promise<void>
  submitButton: {
    text: string
    loadingText?: string
    disabled?: boolean
    icon?: LucideIcon
  }
  generalError?: string
  isSubmitting: boolean
  className?: string
}

export function FormTemplate({
  sections,
  sidebar,
  onSubmit,
  submitButton,
  generalError,
  isSubmitting,
  className = '',
}: FormTemplateProps) {
  const SubmitIcon = submitButton.icon

  return (
    <form onSubmit={onSubmit} className={`space-y-6 ${className}`}>
      {/* General Error Message */}
      {generalError && (
        <div className='bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-destructive text-sm flex items-center gap-2'>
          <AlertCircle className='h-4 w-4' />
          {generalError}
        </div>
      )}

      <div className='flex flex-col lg:flex-row gap-6'>
        {/* Main Form Content */}
        <div className='flex-1 space-y-6'>
          {sections.map((section, index) => (
            <div key={index} className='space-y-4'>
              <SectionHeader
                icon={section.icon}
                title={section.title}
                action={section.action}
              />
              <div className='space-y-4'>{section.content}</div>
            </div>
          ))}

          {/* Submit Button */}
          <div className='flex justify-end gap-2'>
            <Button
              type='submit'
              disabled={isSubmitting || submitButton.disabled}
              className='min-w-[120px]'
            >
              {SubmitIcon && (
                <SubmitIcon
                  className={isSubmitting ? 'hidden' : 'mr-2 h-4 w-4'}
                />
              )}
              {isSubmitting
                ? submitButton.loadingText || 'Saving...'
                : submitButton.text}
            </Button>
          </div>
        </div>

        {/* Right Sidebar */}
        {sidebar && <div className='w-full lg:w-80 space-y-6'>{sidebar}</div>}
      </div>
    </form>
  )
}
