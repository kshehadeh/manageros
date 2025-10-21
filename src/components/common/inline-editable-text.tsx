'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MarkdownEditor } from '@/components/markdown-editor'
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
  const inputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing) {
      if (multiline && textareaRef.current) {
        textareaRef.current.focus()
        textareaRef.current.select()
      } else if (!multiline && inputRef.current) {
        inputRef.current.focus()
        inputRef.current.select()
      }
    }
  }, [isEditing, multiline])

  const handleStartEdit = () => {
    if (disabled || isLoading) return
    setEditValue(value)
    setIsEditing(true)
  }

  const handleSave = async () => {
    if (editValue === value || isLoading) {
      setIsEditing(false)
      return
    }

    setIsLoading(true)
    try {
      await onValueChange(editValue.trim())
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update value:', error)
      // Reset to original value on error
      setEditValue(value)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setEditValue(value)
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Enter' && multiline && e.metaKey) {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancel()
    }
  }

  if (isEditing) {
    return (
      <div className={cn('space-y-2', className)}>
        {multiline ? (
          <MarkdownEditor
            value={editValue}
            onChange={setEditValue}
            placeholder={placeholder}
          />
        ) : (
          <div className='flex items-center gap-2 w-full'>
            <Input
              ref={inputRef}
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={isLoading}
              className='flex-1 min-w-0 leading-tight'
            />
            <Button
              size='sm'
              onClick={handleSave}
              disabled={isLoading}
              className='h-8 w-8 p-0 flex-shrink-0'
            >
              <Check className='h-3 w-3' />
            </Button>
            <Button
              size='sm'
              variant='outline'
              onClick={handleCancel}
              disabled={isLoading}
              className='h-8 w-8 p-0 flex-shrink-0'
            >
              <X className='h-3 w-3' />
            </Button>
          </div>
        )}
        {multiline && (
          <div className='flex items-center gap-2'>
            <Button
              size='sm'
              onClick={handleSave}
              disabled={isLoading}
              className='h-8'
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
            >
              <X className='h-3 w-3 mr-1' />
              Cancel
            </Button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'group cursor-pointer rounded-md p-2 -m-2 hover:bg-muted/50 transition-colors',
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}
      onClick={handleStartEdit}
    >
      <div className='flex items-start justify-between'>
        <div className='flex-1 min-w-0'>
          {value ? (
            multiline ? (
              <div className='whitespace-pre-wrap text-sm'>{value}</div>
            ) : (
              <div className='text-sm font-medium'>{value}</div>
            )
          ) : (
            <div className='text-sm text-muted-foreground italic'>
              {emptyStateText}
            </div>
          )}
        </div>
        <Edit2 className='h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0' />
      </div>
    </div>
  )
}
