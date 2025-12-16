'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import type { FC } from 'react'
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
import { Tool, ToolHeader } from './tool'
import { Loader } from './loader'
import { DEFAULT_EXAMPLE_QUESTIONS } from '@/lib/ai/constants'

interface ChatProps {
  exampleQuestions?: string[]
}

export const Chat: FC<ChatProps> = ({
  exampleQuestions = DEFAULT_EXAMPLE_QUESTIONS,
}) => {
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  })

  const isLoading = status === 'streaming' || status === 'submitted'
  const isEmpty = messages.length === 0

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
                        const toolPart = part as unknown as { state: string }
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

                        return (
                          <Tool key={index}>
                            <ToolHeader
                              title={getToolDisplayName(toolName)}
                              type={partType as `tool-${string}`}
                              state={mappedState}
                            />
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
  }
  return names[toolName] || toolName
}
