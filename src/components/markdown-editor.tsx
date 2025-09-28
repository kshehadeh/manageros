/* eslint-disable no-unused-vars */
'use client'

import MDEditor from '@uiw/react-md-editor'
import { useTheme } from '@/lib/hooks/use-theme'

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  maxLength?: number
  className?: string
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = 'Start typing...',
  maxLength,
  className = '',
}: MarkdownEditorProps) {
  const { theme } = useTheme()

  const handleChange = (val?: string) => {
    const newValue = val || ''
    if (!maxLength || newValue.length <= maxLength) {
      onChange(newValue)
    }
  }

  return (
    <div className={className}>
      <MDEditor
        value={value}
        onChange={handleChange}
        data-color-mode={theme === 'dark' ? 'dark' : 'light'}
        preview='edit'
        hideToolbar={false}
        visibleDragbar={false}
        height={300}
        textareaProps={{
          placeholder: placeholder,
          style: {
            fontSize: 14,
            fontFamily:
              'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
          },
        }}
        toolbarHeight={40}
      />

      {/* Character count */}
      <div className='px-4 py-2 border-t text-xs text-muted-foreground bg-accent'>
        {maxLength
          ? `${value.length}/${maxLength} characters`
          : `${value.length} characters`}
      </div>
    </div>
  )
}
