'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Image from '@tiptap/extension-image'
import { Markdown } from 'tiptap-markdown'
import { useTheme } from '@/lib/hooks/use-theme'
import { useEffect, useRef, useState, useCallback } from 'react'
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
  ImageIcon,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showToolbar, setShowToolbar] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const titleInputRef = useRef<HTMLInputElement>(null)

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
      event.target.value = ''
    },
    [handleImageUpload]
  )

  // Handle image button click
  const handleImageButtonClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  // Handle drag over
  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
  }, [])

  // Handle drop
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

  // Handle paste
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
      Image.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg my-4',
        },
      }),
      Markdown.configure({
        html: true,
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
      {/* Hidden file input for image upload */}
      <input
        ref={fileInputRef}
        type='file'
        accept='image/jpeg,image/jpg,image/png,image/gif,image/webp'
        onChange={handleFileInputChange}
        className='hidden'
      />

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
      <div
        className='flex-1 overflow-y-auto'
        data-scrollable-editor
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onPaste={handlePaste}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
