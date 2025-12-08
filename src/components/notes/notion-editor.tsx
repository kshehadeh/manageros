'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { Markdown } from 'tiptap-markdown'
import { useTheme } from '@/lib/hooks/use-theme'
import { useEffect, useRef, useState } from 'react'
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Code,
  Undo,
  Redo,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface NotionEditorProps {
  title?: string
  content: string
  onTitleChange?: (title: string) => void
  onChange: (content: string) => void
  placeholder?: string
  className?: string
  autoFocus?: boolean
}

export function NotionEditor({
  title,
  content,
  onTitleChange,
  onChange,
  placeholder = 'Start writing...',
  className = '',
  autoFocus = false,
}: NotionEditorProps) {
  const { theme } = useTheme()
  const editorRef = useRef<ReturnType<typeof useEditor> | null>(null)
  const [showToolbar, setShowToolbar] = useState(false)
  const titleInputRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Markdown.configure({
        html: false,
      }),
    ],
    content: content || '',
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm max-w-none focus:outline-none min-h-[400px] px-1 py-4',
          'prose-headings:font-semibold prose-headings:mt-6 prose-headings:mb-4',
          'prose-p:my-2 prose-p:leading-relaxed',
          'prose-ul:my-2 prose-ol:my-2',
          'prose-li:my-1',
          'prose-blockquote:border-l-4 prose-blockquote:border-muted-foreground prose-blockquote:pl-4 prose-blockquote:italic',
          'prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm',
          'prose-pre:bg-muted prose-pre:p-4 prose-pre:rounded-lg',
          theme === 'dark' ? 'prose-invert' : ''
        ),
      },
    },
    onUpdate: ({ editor }) => {
      const markdown = editor.storage.markdown?.getMarkdown() || ''
      onChange(markdown)
    },
    onFocus: () => {
      setShowToolbar(true)
    },
    onBlur: () => {
      // Delay hiding toolbar to allow button clicks
      setTimeout(() => {
        if (!editor?.isFocused) {
          setShowToolbar(false)
        }
      }, 200)
    },
  })

  // Store editor reference
  useEffect(() => {
    editorRef.current = editor
  }, [editor])

  // Update content when prop changes
  useEffect(() => {
    if (editor) {
      try {
        const currentMarkdown = editor.storage.markdown?.getMarkdown() || ''
        if (content !== currentMarkdown) {
          editor.commands.setContent(content || '')
        }
      } catch {
        const currentContent = editor.getHTML()
        if (content !== currentContent) {
          editor.commands.setContent(content || '')
        }
      }
    }
  }, [content, editor])

  // Auto-focus editor
  useEffect(() => {
    if (autoFocus && editor && !title) {
      editor.commands.focus()
    }
  }, [autoFocus, editor, title])

  if (!editor) {
    return null
  }

  const MenuButton = ({
    onClick,
    active,
    children,
    disabled,
    title: buttonTitle,
  }: {
    onClick: () => void
    active?: boolean
    children: React.ReactNode
    disabled?: boolean
    title?: string
  }) => (
    <Button
      type='button'
      onClick={onClick}
      disabled={disabled}
      variant={active ? 'default' : 'ghost'}
      size='sm'
      className='h-8 w-8 p-0'
      title={buttonTitle}
    >
      {children}
    </Button>
  )

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Title Input */}
      {onTitleChange && (
        <input
          ref={titleInputRef}
          type='text'
          value={title || ''}
          onChange={e => onTitleChange(e.target.value)}
          placeholder='Untitled'
          className={cn(
            'w-full text-3xl font-bold bg-transparent border-none outline-none',
            'placeholder:text-muted-foreground',
            'mb-4 px-1',
            'focus:ring-0'
          )}
          autoFocus={autoFocus && !title}
        />
      )}

      {/* Floating Toolbar */}
      {showToolbar && (
        <div className='flex items-center gap-1 p-2 mb-2 border rounded-md bg-background shadow-sm sticky top-0 z-10'>
          <MenuButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive('bold')}
            title='Bold (Ctrl+B)'
          >
            <Bold className='h-4 w-4' />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive('italic')}
            title='Italic (Ctrl+I)'
          >
            <Italic className='h-4 w-4' />
          </MenuButton>
          <div className='w-px h-6 bg-border mx-1' />
          <MenuButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            active={editor.isActive('heading', { level: 1 })}
            title='Heading 1'
          >
            <Heading1 className='h-4 w-4' />
          </MenuButton>
          <MenuButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            active={editor.isActive('heading', { level: 2 })}
            title='Heading 2'
          >
            <Heading2 className='h-4 w-4' />
          </MenuButton>
          <MenuButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
            active={editor.isActive('heading', { level: 3 })}
            title='Heading 3'
          >
            <Heading3 className='h-4 w-4' />
          </MenuButton>
          <div className='w-px h-6 bg-border mx-1' />
          <MenuButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive('bulletList')}
            title='Bullet List'
          >
            <List className='h-4 w-4' />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive('orderedList')}
            title='Numbered List'
          >
            <ListOrdered className='h-4 w-4' />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={editor.isActive('blockquote')}
            title='Quote'
          >
            <Quote className='h-4 w-4' />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            active={editor.isActive('codeBlock')}
            title='Code Block'
          >
            <Code className='h-4 w-4' />
          </MenuButton>
          <div className='w-px h-6 bg-border mx-1' />
          <MenuButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title='Undo (Ctrl+Z)'
          >
            <Undo className='h-4 w-4' />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title='Redo (Ctrl+Y)'
          >
            <Redo className='h-4 w-4' />
          </MenuButton>
        </div>
      )}

      {/* Editor */}
      <div className='flex-1 overflow-y-auto' data-scrollable-editor>
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
