'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'
import { Markdown } from 'tiptap-markdown'
import { useTheme } from '@/lib/hooks/use-theme'
import { useEffect } from 'react'
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading2,
  Quote,
  Code,
  Undo,
  Redo,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

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
      CharacterCount.configure({
        limit: maxLength,
      }),
      Markdown.configure({
        html: false,
      }),
    ],
    content: value || '',
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm max-w-none focus:outline-none min-h-[300px] px-4 py-3',
          theme === 'dark' ? 'prose-invert' : ''
        ),
      },
    },
    onUpdate: ({ editor }) => {
      const markdown = editor.storage.markdown?.getMarkdown() || ''
      onChange(markdown)
    },
  })

  useEffect(() => {
    if (editor) {
      try {
        const currentMarkdown = editor.storage.markdown?.getMarkdown() || ''
        if (value !== currentMarkdown) {
          // Set content from markdown string - tiptap-markdown handles markdown parsing
          editor.commands.setContent(value || '')
        }
      } catch {
        // Fallback if markdown storage is not available yet
        const currentContent = editor.getHTML()
        if (value !== currentContent) {
          editor.commands.setContent(value || '')
        }
      }
    }
  }, [value, editor])

  if (!editor) {
    return null
  }

  const MenuButton = ({
    onClick,
    active,
    children,
    disabled,
  }: {
    onClick: () => void
    active?: boolean
    children: React.ReactNode
    disabled?: boolean
  }) => (
    <Button
      type='button'
      onClick={onClick}
      disabled={disabled}
      variant={active ? 'default' : 'ghost'}
      size='sm'
      className='h-8 w-8 p-0'
    >
      {children}
    </Button>
  )

  return (
    <div className={cn('border rounded-md overflow-hidden', className)}>
      {/* Toolbar */}
      <div className='flex items-center gap-1 p-2 border-b bg-muted/50'>
        <MenuButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
        >
          <Bold className='h-4 w-4' />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
        >
          <Italic className='h-4 w-4' />
        </MenuButton>
        <MenuButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          active={editor.isActive('heading', { level: 2 })}
        >
          <Heading2 className='h-4 w-4' />
        </MenuButton>
        <div className='w-px h-6 bg-border mx-1' />
        <MenuButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
        >
          <List className='h-4 w-4' />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
        >
          <ListOrdered className='h-4 w-4' />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')}
        >
          <Quote className='h-4 w-4' />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          active={editor.isActive('codeBlock')}
        >
          <Code className='h-4 w-4' />
        </MenuButton>
        <div className='w-px h-6 bg-border mx-1' />
        <MenuButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <Undo className='h-4 w-4' />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <Redo className='h-4 w-4' />
        </MenuButton>
      </div>

      {/* Editor */}
      <EditorContent editor={editor} />

      {/* Character count */}
      <div className='px-4 py-2 border-t text-xs text-muted-foreground bg-accent'>
        {maxLength
          ? `${editor.storage.characterCount.characters()}/${maxLength} characters`
          : `${editor.storage.characterCount.characters()} characters`}
      </div>
    </div>
  )
}
