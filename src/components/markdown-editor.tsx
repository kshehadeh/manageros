'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'
import { Markdown } from 'tiptap-markdown'
import { useTheme } from '@/lib/hooks/use-theme'
import { useEffect, useRef } from 'react'
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
  heightClassName?: string
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = 'Start typing...',
  maxLength,
  className = '',
  heightClassName = 'max-h-[300px]',
}: MarkdownEditorProps) {
  const { theme } = useTheme()
  const editorRef = useRef<ReturnType<typeof useEditor> | null>(null)

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
      handlePaste: (view, event) => {
        const text = event.clipboardData?.getData('text/plain') || ''

        // Check if the pasted text contains markdown syntax patterns
        const hasMarkdownSyntax =
          /^[\s\S]*(#{1,6}\s+|[-*+]\s+|^\d+\.\s+|>\s+|```|`|\[.*\]\(.*\)|!\[.*\]\(.*\)|^\|.*\|$|^---+\s*$)[\s\S]*$/m.test(
            text
          )

        if (hasMarkdownSyntax && text.trim() && editorRef.current) {
          // Prevent default paste behavior
          event.preventDefault()

          // Get current selection
          const { from, to } = view.state.selection

          // Get the text content around the cursor from ProseMirror
          const selectedText = view.state.doc.textBetween(from, to)

          // Get current markdown content
          const currentMarkdown =
            editorRef.current.storage.markdown?.getMarkdown() || ''

          // Find the insertion point in markdown by finding the selected text
          // If there's a selection, find it in the markdown string
          let insertPosition = currentMarkdown.length

          if (selectedText && from < to) {
            // Try to find the selected text in markdown (might be slightly different due to formatting)
            const index = currentMarkdown.indexOf(selectedText)
            if (index !== -1) {
              insertPosition = index
            } else {
              // Fallback: approximate position based on document structure
              // Try to find approximate position in markdown
              const beforeText = currentMarkdown.slice(
                0,
                Math.min(from, currentMarkdown.length)
              )
              insertPosition = beforeText.length
            }
          } else {
            // No selection - insert at cursor position
            // Approximate cursor position in markdown by using text length before cursor
            const textBeforeCursor = view.state.doc.textBetween(0, from)
            // Use the length of text before cursor as approximation for markdown position
            insertPosition = Math.min(
              textBeforeCursor.length,
              currentMarkdown.length
            )
          }

          // Insert the markdown text
          const beforeSelection = currentMarkdown.slice(0, insertPosition)
          const afterSelection = currentMarkdown.slice(
            insertPosition + (from < to ? selectedText.length : 0)
          )
          const newMarkdown = beforeSelection + text + afterSelection

          // Set the new content as markdown - TipTap's Markdown extension will parse it
          editorRef.current.commands.setContent(newMarkdown)

          // Set cursor position after the pasted content
          // Approximate new position in ProseMirror document
          const newTextBefore = newMarkdown.slice(
            0,
            insertPosition + text.length
          )
          const approximatePosition = Math.min(
            newTextBefore.length,
            editorRef.current.state.doc.content.size
          )
          editorRef.current.commands.setTextSelection(approximatePosition)

          return true
        }

        // Let TipTap handle the paste normally for non-markdown content
        return false
      },
    },
    onUpdate: ({ editor }) => {
      const markdown = editor.storage.markdown?.getMarkdown() || ''
      onChange(markdown)
    },
  })

  // Store editor reference for use in paste handler
  useEffect(() => {
    editorRef.current = editor
  }, [editor])

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
      <div
        className={cn(heightClassName, 'overflow-y-auto')}
        data-scrollable-editor
      >
        <EditorContent editor={editor} />
      </div>

      {/* Character count */}
      <div className='px-4 py-2 border-t text-xs text-muted-foreground bg-accent'>
        {maxLength
          ? `${editor.storage.characterCount.characters()}/${maxLength} characters`
          : `${editor.storage.characterCount.characters()} characters`}
      </div>
    </div>
  )
}
