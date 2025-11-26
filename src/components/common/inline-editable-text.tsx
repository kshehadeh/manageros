'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import ContentEditable, { ContentEditableEvent } from 'react-contenteditable'
import { Button } from '@/components/ui/button'
import { MarkdownEditor } from '@/components/markdown-editor'
import { ReadonlyNotesField } from '@/components/readonly-notes-field'
import { Check, X, Edit2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface InlineEditableTextProps {
  value: string
  onValueChange: (_value: string) => Promise<void>
  placeholder?: string
  multiline?: boolean
  className?: string
  disabled?: boolean
  emptyStateText?: string
}

export function InlineEditableText({
  value,
  onValueChange,
  placeholder,
  multiline = false,
  className,
  disabled = false,
  emptyStateText = 'Click to edit',
}: InlineEditableTextProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const [isLoading, setIsLoading] = useState(false)
  const contentEditableRef = useRef<HTMLElement>(null!)

  // Update editValue when value prop changes
  useEffect(() => {
    if (!isEditing) {
      setEditValue(value)
    }
  }, [value, isEditing])

  const handleStartEdit = useCallback(() => {
    if (disabled || isLoading) return
    setEditValue(value)
    setIsEditing(true)
  }, [disabled, isLoading, value])

  const handleSave = useCallback(async () => {
    const trimmedValue = editValue.trim()
    if (trimmedValue === value || isLoading) {
      setIsEditing(false)
      return
    }

    setIsLoading(true)
    try {
      await onValueChange(trimmedValue)
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update value:', error)
      // Reset to original value on error
      setEditValue(value)
    } finally {
      setIsLoading(false)
    }
  }, [editValue, value, isLoading, onValueChange])

  const handleCancel = useCallback(() => {
    setEditValue(value)
    setIsEditing(false)
  }, [value])

  const handleChange = useCallback((e: ContentEditableEvent) => {
    // Strip HTML tags and decode entities for plain text
    const text = e.target.value
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
    setEditValue(text)
  }, [])

  const handleBlur = useCallback(
    (e: React.FocusEvent) => {
      // Don't blur if clicking on save/cancel buttons
      const relatedTarget = e.relatedTarget as HTMLElement
      if (relatedTarget?.closest('[data-inline-edit-action]')) {
        return
      }
      handleSave()
    },
    [handleSave]
  )

  // Focus and select content when entering edit mode
  useEffect(() => {
    if (isEditing && !multiline && contentEditableRef.current) {
      contentEditableRef.current.focus()
      // Select all text
      const range = document.createRange()
      range.selectNodeContents(contentEditableRef.current)
      const selection = window.getSelection()
      selection?.removeAllRanges()
      selection?.addRange(range)
    }
  }, [isEditing, multiline])

  // Handle keyboard events directly on the contenteditable element
  // This is more reliable than the onKeyDown prop for contenteditable
  useEffect(() => {
    if (!isEditing || multiline || !contentEditableRef.current) return

    const element = contentEditableRef.current
    const handleKeyDownEvent = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleSave()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        handleCancel()
      }
    }

    element.addEventListener('keydown', handleKeyDownEvent)
    return () => {
      element.removeEventListener('keydown', handleKeyDownEvent)
    }
  }, [isEditing, multiline, handleSave, handleCancel])

  // Multiline editing uses the existing MarkdownEditor
  if (multiline) {
    if (isEditing) {
      return (
        <div className={cn(className)}>
          <MarkdownEditor
            value={editValue}
            onChange={setEditValue}
            placeholder={placeholder}
            heightClassName='max-h-[200px]'
          />
          <div className='flex items-center gap-2 mt-2'>
            <Button
              size='sm'
              onClick={handleSave}
              disabled={isLoading}
              className='h-8'
              data-inline-edit-action
            >
              <Check className='h-3 w-3 mr-1' />
              Save
            </Button>
            <Button
              size='sm'
              variant='outline'
              onClick={handleCancel}
              disabled={isLoading}
              className='h-8'
              data-inline-edit-action
            >
              <X className='h-3 w-3 mr-1' />
              Cancel
            </Button>
          </div>
        </div>
      )
    }

    return (
      <div
        className={cn(
          'group cursor-pointer rounded-md hover:bg-muted/50 transition-colors',
          disabled && 'cursor-not-allowed opacity-50'
        )}
        onClick={handleStartEdit}
      >
        <div className='flex items-start justify-between'>
          <div className='flex-1 min-w-0'>
            {value ? (
              <ReadonlyNotesField
                content={value}
                variant='default'
                showEmptyState={false}
              />
            ) : (
              <div className='text-muted-foreground italic'>
                {emptyStateText}
              </div>
            )}
          </div>
          <Edit2 className='h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0' />
        </div>
      </div>
    )
  }

  // Single-line editing uses ContentEditable for natural CSS inheritance
  if (isEditing) {
    return (
      <div className={cn('flex items-center gap-2 w-full', className)}>
        <ContentEditable
          innerRef={contentEditableRef}
          html={editValue}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={isLoading}
          className={cn(
            'flex-1 min-w-0 outline-none',
            'bg-transparent border-b-2 border-primary/50',
            'focus:border-primary transition-colors',
            '[&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-muted-foreground [&:empty]:before:pointer-events-none'
          )}
          data-placeholder={placeholder}
          tagName='span'
        />
        <Button
          size='sm'
          onClick={handleSave}
          disabled={isLoading}
          className='h-8 w-8 p-0 shrink-0'
          data-inline-edit-action
        >
          <Check className='h-3 w-3' />
        </Button>
        <Button
          size='sm'
          variant='outline'
          onClick={handleCancel}
          disabled={isLoading}
          className='h-8 w-8 p-0 shrink-0'
          data-inline-edit-action
        >
          <X className='h-3 w-3' />
        </Button>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'group cursor-pointer rounded-md hover:bg-muted/50 transition-colors inline-flex items-center gap-2',
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}
      onClick={handleStartEdit}
    >
      {value ? (
        <span>{value}</span>
      ) : (
        <span className='text-muted-foreground italic'>{emptyStateText}</span>
      )}
      <Edit2 className='h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0' />
    </div>
  )
}
