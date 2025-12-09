'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'
import Image from '@tiptap/extension-image'
import { Markdown } from 'tiptap-markdown'
import { useTheme } from '@/lib/hooks/use-theme'
import { useEffect, useRef, useCallback, useState } from 'react'
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
  ImageIcon,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  maxLength?: number
  className?: string
  heightClassName?: string
}

/**
 * Upload an image file to the server and return the URL
 */
async function uploadImage(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch('/api/notes/upload-image', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to upload image')
  }

  const data = await response.json()
  return data.url
}

/**
 * Validate an image file before upload
 */
function validateImageFile(file: File): string | null {
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
  ]

  if (!allowedTypes.includes(file.type)) {
    return 'Only JPEG, PNG, GIF, and WebP images are allowed'
  }

  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) {
    return 'Image size must be less than 10MB'
  }

  return null
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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  // Handle image upload and insertion
  const handleImageUpload = useCallback(async (file: File) => {
    const validationError = validateImageFile(file)
    if (validationError) {
      toast.error(validationError)
      return
    }

    if (!editorRef.current) return

    setIsUploadingImage(true)
    try {
      const url = await uploadImage(file)
      const editor = editorRef.current

      // Insert image node directly using the schema
      const { schema } = editor.state
      const imageNode = schema.nodes.image?.create({
        src: url,
        alt: file.name,
      })

      if (imageNode) {
        const transaction = editor.state.tr.replaceSelectionWith(imageNode)
        editor.view.dispatch(transaction)
        editor.commands.focus()
      }

      toast.success('Image uploaded successfully')
    } catch (error) {
      console.error('Failed to upload image:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to upload image'
      )
    } finally {
      setIsUploadingImage(false)
    }
  }, [])

  // Handle file input change
  const handleFileInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (file) {
        handleImageUpload(file)
      }
      // Reset the input so the same file can be selected again
      event.target.value = ''
    },
    [handleImageUpload]
  )

  // Handle image button click
  const handleImageButtonClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  // Handle drag over to prevent default browser behavior
  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
  }, [])

  // Handle drop on the editor container
  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      event.stopPropagation()

      const files = event.dataTransfer?.files
      if (files && files.length > 0) {
        for (const file of Array.from(files)) {
          if (file.type.startsWith('image/')) {
            handleImageUpload(file)
            return
          }
        }
      }
    },
    [handleImageUpload]
  )

  // Handle paste on the editor container
  const handlePaste = useCallback(
    (event: React.ClipboardEvent) => {
      const items = event.clipboardData?.items
      if (items) {
        for (const item of Array.from(items)) {
          if (item.type.startsWith('image/')) {
            event.preventDefault()
            event.stopPropagation()
            const file = item.getAsFile()
            if (file) {
              handleImageUpload(file)
            }
            return
          }
        }
      }
      // Let other paste handlers (like markdown) handle non-image pastes
    },
    [handleImageUpload]
  )

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
      Image.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      Markdown.configure({
        html: true,
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
        // Check for image files in clipboard
        const items = event.clipboardData?.items
        if (items) {
          for (const item of Array.from(items)) {
            if (item.type.startsWith('image/')) {
              event.preventDefault()
              const file = item.getAsFile()
              if (file) {
                handleImageUpload(file)
              }
              return true
            }
          }
        }

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
      handleDrop: (view, event, _slice, moved) => {
        // Don't handle if it's a move operation within the editor
        if (moved) return false

        // Check for image files in drop
        const files = event.dataTransfer?.files
        if (files && files.length > 0) {
          for (const file of Array.from(files)) {
            if (file.type.startsWith('image/')) {
              event.preventDefault()
              handleImageUpload(file)
              return true
            }
          }
        }

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
      {/* Hidden file input for image upload */}
      <input
        ref={fileInputRef}
        type='file'
        accept='image/jpeg,image/jpg,image/png,image/gif,image/webp'
        onChange={handleFileInputChange}
        className='hidden'
      />

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
        <Button
          type='button'
          onClick={handleImageButtonClick}
          disabled={isUploadingImage}
          variant='ghost'
          size='sm'
          className='h-8 w-8 p-0'
          title='Insert image (or paste/drag an image)'
        >
          {isUploadingImage ? (
            <Loader2 className='h-4 w-4 animate-spin' />
          ) : (
            <ImageIcon className='h-4 w-4' />
          )}
        </Button>
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
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onPaste={handlePaste}
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
