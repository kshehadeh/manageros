'use client'

import { DefaultChatTransport } from 'ai'
import { useChat, type UIMessage } from '@ai-sdk/react'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Send,
  Bot,
  User,
  X,
  Users,
  Rocket,
  ListTodo,
  Calendar,
  Building2,
  Expand,
  Shrink,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { AiResponseText } from './ai-response-text'
import { useUserSettings } from '@/lib/hooks/use-user-settings'
import { useAIChat } from '@/components/ai-chat-provider'

interface AIChatSidebarProps {
  isOpen: boolean
  onClose: () => void
}

type MessagePart = UIMessage['parts'][number]

// Map tool names to their corresponding icons
const getToolIcon = (toolName: string) => {
  switch (toolName) {
    case 'people':
      return Users
    case 'initiatives':
      return Rocket
    case 'tasks':
      return ListTodo
    case 'meetings':
      return Calendar
    case 'teams':
      return Building2
    default:
      return Bot // fallback icon
  }
}

export function AIChatSidebar({ isOpen, onClose }: AIChatSidebarProps) {
  const { settings, updateSetting, isLoaded } = useUserSettings()
  const { openedViaKeyboard, setOpenedViaKeyboard } = useAIChat()
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const transport = useMemo(
    () => new DefaultChatTransport({ api: '/api/chat' }),
    []
  )
  const { messages, sendMessage, status } = useChat({
    transport: transport,
  })

  const isLoading = status === 'submitted' || status === 'streaming'

  const handleInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setInputValue(event.target.value)
    },
    []
  )

  const handleFormSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      const trimmedInput = inputValue.trim()

      if (!trimmedInput) {
        return
      }

      setInputValue('')
      void sendMessage({ text: trimmedInput }).catch(() => {
        setInputValue(trimmedInput)
      })
    },
    [inputValue, sendMessage]
  )

  // Focus input when opened via keyboard
  useEffect(() => {
    if (isOpen && openedViaKeyboard && inputRef.current) {
      // Small delay to ensure the sidebar is fully rendered
      const timeoutId = setTimeout(() => {
        inputRef.current?.focus()
        setOpenedViaKeyboard(false) // Reset the flag
      }, 100)

      return () => clearTimeout(timeoutId)
    }
  }, [isOpen, openedViaKeyboard, setOpenedViaKeyboard])

  // Handle Escape key to close the AI chat
  useEffect(() => {
    if (!isOpen) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const renderMessagePart = useCallback((part: MessagePart, index: number) => {
    const key = (() => {
      if ('id' in part && part.id) {
        return `${part.type}-${part.id}`
      }
      if (
        part.type.startsWith('tool-') &&
        'toolCallId' in part &&
        part.toolCallId
      ) {
        return `${part.type}-${part.toolCallId}`
      }
      return `${part.type}-${index}`
    })()

    if (part.type === 'text' || part.type === 'reasoning') {
      return (
        <div key={key} className='text-sm leading-relaxed'>
          <AiResponseText text={part.text} />
        </div>
      )
    }

    if (part.type === 'file') {
      return (
        <a
          key={key}
          href={part.url}
          target='_blank'
          rel='noopener noreferrer'
          className='text-xs underline break-all'
        >
          {part.filename ?? part.url}
        </a>
      )
    }

    if (part.type === 'source-url') {
      return (
        <a
          key={key}
          href={part.url}
          target='_blank'
          rel='noopener noreferrer'
          className='text-xs underline'
        >
          {part.title ?? part.url}
        </a>
      )
    }

    if (part.type === 'source-document') {
      return (
        <div key={key} className='text-xs space-y-1'>
          <div className='font-medium'>{part.title}</div>
          <div className='text-muted-foreground'>
            {part.filename ?? part.mediaType}
          </div>
        </div>
      )
    }

    if (part.type === 'dynamic-tool' || part.type.startsWith('tool-')) {
      const toolName =
        part.type === 'dynamic-tool'
          ? 'dynamic'
          : part.type.replace('tool-', '')

      // Get the appropriate icon for the tool
      const IconComponent = getToolIcon(toolName)

      return (
        <div
          key={key}
          className='flex items-center gap-2 text-xs text-muted-foreground'
        >
          <div className='flex items-center gap-1'>
            <IconComponent className='h-3 w-3 text-primary' />
            Calling {toolName}...
          </div>
        </div>
      )
    }

    if (typeof part.type === 'string' && part.type.startsWith('data-')) {
      const data = 'data' in part ? part.data : null
      return (
        <pre
          key={key}
          className='text-xs whitespace-pre-wrap rounded bg-muted p-2'
        >
          {JSON.stringify(data, null, 2)}
        </pre>
      )
    }

    if (part.type === 'step-start') {
      return ''
    }

    return (
      <pre
        key={key}
        className='text-xs whitespace-pre-wrap rounded bg-muted p-2 text-muted-foreground'
      >
        {JSON.stringify(part, null, 2)}
      </pre>
    )
  }, [])

  const exampleQuestions = [
    'List initiatives that are currently in progress',
    'Who manages Karim Shehadeh?',
    'Show me all high priority tasks',
    'What teams do we have?',
    'Find meetings scheduled for this week',
  ]

  if (!isOpen) return null

  return (
    <div
      className={cn(
        'fixed top-0 h-full bg-card shadow-lg z-50 flex flex-col',
        // Mobile: always fullscreen
        'w-full left-0',
        // Desktop: sidebar mode unless fullscreen
        'md:w-96 md:right-0 md:left-auto md:border-l',
        // Desktop fullscreen mode
        settings.chatWindowSettings.isFullscreen &&
          'md:w-full md:left-0 md:right-0 md:border-l-0'
      )}
    >
      {/* Header */}
      <div className='flex items-center justify-between p-4 border-b'>
        <div className='flex items-center gap-2'>
          <Bot className='h-5 w-5 text-primary' />
          <h2 className='font-semibold'>AI Chat</h2>
        </div>
        <div className='flex items-center gap-1'>
          {/* Desktop fullscreen toggle - hidden on mobile */}
          <Button
            variant='ghost'
            size='sm'
            onClick={() =>
              updateSetting('chatWindowSettings', {
                ...settings.chatWindowSettings,
                isFullscreen: !settings.chatWindowSettings.isFullscreen,
              })
            }
            className='hidden md:flex'
            disabled={!isLoaded}
          >
            {settings.chatWindowSettings.isFullscreen ? (
              <Shrink className='h-4 w-4' />
            ) : (
              <Expand className='h-4 w-4' />
            )}
          </Button>
          <Button variant='ghost' size='sm' onClick={onClose}>
            <X className='h-4 w-4' />
          </Button>
        </div>
      </div>

      <>
        {/* Messages */}
        <ScrollArea className='flex-1 p-4'>
          <div className='space-y-4'>
            {messages.length === 0 && (
              <div className='space-y-3'>
                <p className='text-sm text-muted-foreground'>
                  Ask me anything about your organization&apos;s data:
                </p>
                <div className='space-y-2'>
                  {exampleQuestions.map((question, index) => (
                    <Button
                      key={index}
                      variant='outline'
                      size='sm'
                      className='w-full justify-start text-left h-auto p-2'
                      onClick={() => {
                        setInputValue(question)
                      }}
                    >
                      <span className='text-xs'>{question}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message: UIMessage) => (
              <div
                key={message.id}
                className={cn(
                  'flex gap-3',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role === 'assistant' && (
                  <Avatar className='h-8 w-8'>
                    <AvatarFallback>
                      <Bot className='h-4 w-4' />
                    </AvatarFallback>
                  </Avatar>
                )}

                <Card
                  className={cn(
                    'max-w-[80%]',
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}
                >
                  <CardContent className='p-3 space-y-2'>
                    {message.parts.map((part, index) =>
                      renderMessagePart(part, index)
                    )}
                  </CardContent>
                </Card>

                {message.role === 'user' && (
                  <Avatar className='h-8 w-8'>
                    <AvatarFallback>
                      <User className='h-4 w-4' />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}

            {isLoading && (
              <div className='flex gap-3'>
                <Avatar className='h-8 w-8'>
                  <AvatarFallback>
                    <Bot className='h-4 w-4' />
                  </AvatarFallback>
                </Avatar>
                <Card className='bg-muted'>
                  <CardContent className='p-3'>
                    <div className='text-sm text-muted-foreground'>
                      Thinking...
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className='p-4 border-t'>
          <form onSubmit={handleFormSubmit} className='flex gap-2'>
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={handleInputChange}
              placeholder='Ask about your organization...'
              disabled={isLoading}
              className='flex-1'
            />
            <Button type='submit' disabled={isLoading || !inputValue?.trim()}>
              <Send className='h-4 w-4' />
            </Button>
          </form>
        </div>
      </>
    </div>
  )
}
