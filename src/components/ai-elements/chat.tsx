'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import type { FC } from 'react'
import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Bot } from 'lucide-react'

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
  ConversationEmptyState,
} from './conversation'
import { Message, MessageContent, MessageResponse } from './message'
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
} from './prompt-input'
import { Button } from '@/components/ui/button'
import { Tool, ToolHeader, ToolContent, ToolOutput } from './tool'
import { Loader } from './loader'
import { DEFAULT_EXAMPLE_QUESTIONS } from '@/lib/ai/constants'
import { parseActionResponse } from '@/lib/ai/action-parser'
import type { ToolUIPart } from 'ai'

/**
 * Ensures a URL is relative by removing any protocol/host/domain
 * and ensuring it starts with a forward slash
 */
function ensureRelativeUrl(url: string): string {
  try {
    // If it's already a relative URL (starts with /), return as-is
    if (url.startsWith('/')) {
      return url
    }

    // If it's an absolute URL, extract the pathname
    if (url.startsWith('http://') || url.startsWith('https://')) {
      const urlObj = new URL(url)
      return urlObj.pathname + urlObj.search
    }

    // If it doesn't start with /, add it
    return url.startsWith('/') ? url : `/${url}`
  } catch {
    // If URL parsing fails, ensure it starts with /
    return url.startsWith('/') ? url : `/${url}`
  }
}

interface ChatProps {
  exampleQuestions?: string[]
}

export const Chat: FC<ChatProps> = ({
  exampleQuestions = DEFAULT_EXAMPLE_QUESTIONS,
}) => {
  const router = useRouter()
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  })

  const isLoading = status === 'streaming' || status === 'submitted'
  const isEmpty = messages.length === 0
  const processedActionRef = useRef<Set<string>>(new Set())

  // Auto-navigate when action results are detected
  useEffect(() => {
    messages.forEach(message => {
      if (message.role !== 'assistant') return

      message.parts?.forEach(part => {
        const partType = part.type as string

        // Check tool parts for action results
        if (partType.startsWith('tool-')) {
          const toolPart = part as ToolUIPart
          const toolOutput: ToolUIPart['output'] | undefined =
            toolPart.output as ToolUIPart['output'] | undefined

          // Check if tool has output (regardless of state - output might be available even if state isn't 'output-available')
          if (toolOutput !== undefined && toolOutput !== null) {
            const actionResult = parseActionResponse(toolOutput)

            if (
              actionResult &&
              actionResult.actionType === 'navigate' &&
              actionResult.url
            ) {
              // URL should already be normalized by parseActionResponse, but ensure it's relative
              const relativeUrl = ensureRelativeUrl(actionResult.url)

              // Create a unique key for this action to avoid duplicate navigations
              const actionKey = `${message.id}-${relativeUrl}`

              if (!processedActionRef.current.has(actionKey)) {
                processedActionRef.current.add(actionKey)
                // Navigate automatically with relative URL
                router.push(relativeUrl)
              }
            }
          }
        }

        // Also check text parts for URLs that might be action results
        // (in case AI includes URLs in its text response)
        if (part.type === 'text') {
          const textPart = part as unknown as { text: string }
          const text = textPart.text || ''

          // Look for URLs in the text that match our action patterns
          // Pattern: URLs like /oneonones/new, /people/new, etc.
          const actionUrlPattern = /\/(?:oneonones|people)\/new[^\s)]*/g
          const matches = text.match(actionUrlPattern)

          if (matches && matches.length > 0) {
            // Use the first match (most likely the action URL)
            const url = matches[0]
            const relativeUrl = ensureRelativeUrl(url)

            // Create a unique key for this action to avoid duplicate navigations
            const actionKey = `${message.id}-${relativeUrl}`

            if (!processedActionRef.current.has(actionKey)) {
              processedActionRef.current.add(actionKey)
              // Navigate automatically with relative URL
              router.push(relativeUrl)
            }
          }
        }
      })
    })
  }, [messages, router])

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage({ text: suggestion })
  }

  const handleSubmit = ({ text }: { text: string }) => {
    if (text.trim()) {
      sendMessage({ text })
    }
  }

  return (
    <div className='flex h-full flex-col'>
      <Conversation className='flex-1'>
        <ConversationContent>
          {isEmpty ? (
            <ConversationEmptyState
              title='Hello there!'
              description="Ask me anything about your organization's data"
              icon={<Bot className='size-8' />}
            >
              <div className='flex flex-col items-center gap-4 mt-4 px-4 w-full'>
                <div className='flex items-center gap-2'>
                  <Bot className='size-8 text-muted-foreground' />
                </div>
                <div className='text-center'>
                  <h3 className='font-semibold text-lg'>Hello there!</h3>
                  <p className='text-muted-foreground text-sm'>
                    Ask me anything about your organization&apos;s data
                  </p>
                </div>
                <div className='flex flex-wrap justify-center gap-2 mt-4 w-full'>
                  {exampleQuestions.map((question, index) => (
                    <Button
                      key={index}
                      variant='outline'
                      size='sm'
                      onClick={() => handleSuggestionClick(question)}
                      className='h-auto py-2 px-3 text-left whitespace-normal'
                    >
                      {question}
                    </Button>
                  ))}
                </div>
              </div>
            </ConversationEmptyState>
          ) : (
            <>
              {messages.map(message => (
                <Message key={message.id} from={message.role}>
                  <MessageContent>
                    {message.parts?.map((part, index) => {
                      // Handle text parts
                      if (part.type === 'text') {
                        const textPart = part as unknown as { text: string }
                        return (
                          <MessageResponse key={index}>
                            {textPart.text}
                          </MessageResponse>
                        )
                      }

                      // Handle tool parts (type starts with 'tool-')
                      const partType = part.type as string
                      if (partType.startsWith('tool-')) {
                        const toolPart = part as ToolUIPart
                        const toolName = partType.replace('tool-', '')

                        // Map state to allowed values
                        type ToolState =
                          | 'input-streaming'
                          | 'input-available'
                          | 'output-available'
                          | 'output-error'
                        const stateMap: Record<string, ToolState> = {
                          'input-streaming': 'input-streaming',
                          'input-available': 'input-available',
                          'output-available': 'output-available',
                          'output-error': 'output-error',
                          'output-denied': 'output-error',
                        }
                        const mappedState =
                          stateMap[toolPart.state] || 'input-available'

                        // Check if tool output contains an action result
                        const toolOutput: ToolUIPart['output'] | undefined =
                          toolPart.output as ToolUIPart['output'] | undefined
                        const actionResult = toolOutput
                          ? parseActionResponse(toolOutput)
                          : null

                        return (
                          <Tool key={index}>
                            <ToolHeader
                              title={getToolDisplayName(toolName)}
                              type={partType as `tool-${string}`}
                              state={mappedState}
                            />
                            {toolOutput !== undefined &&
                              toolOutput !== null && (
                                <ToolContent>
                                  <ToolOutput
                                    output={toolOutput}
                                    errorText={toolPart.errorText}
                                  />
                                  {actionResult &&
                                    actionResult.actionType === 'navigate' && (
                                      <div className='p-4 border-t text-sm text-muted-foreground'>
                                        <p>Navigating to the form...</p>
                                      </div>
                                    )}
                                </ToolContent>
                              )}
                          </Tool>
                        )
                      }

                      return null
                    })}
                  </MessageContent>
                </Message>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <div className='flex items-center gap-2 text-muted-foreground px-2'>
                  <Loader size={16} />
                  <span className='text-sm'>Thinking...</span>
                </div>
              )}
            </>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      {/* Input area */}
      <div className='p-4 border-t'>
        <PromptInput onSubmit={handleSubmit}>
          <PromptInputTextarea placeholder='Ask about your organization...' />
          <PromptInputFooter>
            <div />
            <PromptInputSubmit status={status} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  )
}

// Helper function to get display names for tools
function getToolDisplayName(toolName: string): string {
  const names: Record<string, string> = {
    people: 'Search People',
    initiatives: 'Search Initiatives',
    tasks: 'Search Tasks',
    meetings: 'Search Meetings',
    teams: 'Search Teams',
    jobRoleLookup: 'Search Job Roles',
    feedback: 'Search Feedback',
    currentUser: 'Get Current User',
    github: 'Search GitHub',
    jira: 'Search Jira',
    dateTime: 'Get Date/Time',
    personLookup: 'Lookup Person',
    teamLookup: 'Lookup Team',
    createOneOnOneAction: 'Create 1:1 Meeting',
    createPersonAction: 'Create Person',
  }
  return names[toolName] || toolName
}
