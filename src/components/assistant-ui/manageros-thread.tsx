import {
  ArrowDownIcon,
  ArrowUpIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  PencilIcon,
  RefreshCwIcon,
  Square,
  Users,
  Rocket,
  ListTodo,
  Calendar,
  Building2,
  BriefcaseIcon,
  MessageCircle,
  BotIcon,
  UserIcon,
  GitPullRequestIcon,
  BugIcon,
  ClockIcon,
} from 'lucide-react'

import {
  ActionBarPrimitive,
  BranchPickerPrimitive,
  ComposerPrimitive,
  ErrorPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
  type ToolCallMessagePartComponent,
} from '@assistant-ui/react'

import type { FC } from 'react'
import { LazyMotion, MotionConfig, domAnimation } from 'motion/react'
import * as m from 'motion/react-m'

import { Button } from '@/components/ui/button'
import { MarkdownText } from '@/components/assistant-ui/markdown-text'
import { TooltipIconButton } from '@/components/assistant-ui/tooltip-icon-button'
import { UserMessageAttachments } from '@/components/assistant-ui/attachment'

import { cn } from '@/lib/utils'
import { toolIds } from '../../lib/ai/tool-ids'

// Map tool names to their corresponding icons
const getToolIcon = (toolName: string) => {
  switch (toolName) {
    case toolIds.people:
      return Users
    case toolIds.initiatives:
      return Rocket
    case toolIds.tasks:
      return ListTodo
    case toolIds.meetings:
      return Calendar
    case toolIds.teams:
      return Building2
    case toolIds.jobRoleLookup:
      return BriefcaseIcon
    case toolIds.feedback:
      return MessageCircle
    case toolIds.currentUser:
      return UserIcon
    case toolIds.github:
      return GitPullRequestIcon
    case toolIds.jira:
      return BugIcon
    case toolIds.dateTime:
      return ClockIcon
    case toolIds.personLookup:
      return UserIcon
    default:
      return BotIcon
  }
}

const getToolDescription = (toolName: string) => {
  switch (toolName) {
    case toolIds.people:
      return 'Searching people'
    case toolIds.initiatives:
      return 'Searching initiatives'
    case toolIds.tasks:
      return 'Searching tasks'
    case toolIds.meetings:
      return 'Searching meetings'
    case toolIds.teams:
      return 'Searching teams'
    case toolIds.jobRoleLookup:
      return 'Searching job roles'
    case toolIds.feedback:
      return 'Searching feedback'
    case toolIds.currentUser:
      return 'Searching information about the current user'
    case toolIds.github:
      return 'Searching GitHub activity'
    case toolIds.jira:
      return 'Searching Jira activity'
    case toolIds.dateTime:
      return 'Searching date and time'
    case toolIds.personLookup:
      return 'Searching people'
    default:
      return 'Searching the organization'
  }
}

interface ManagerOSThreadProps {
  exampleQuestions?: string[]
}

export const ManagerOSThread: FC<ManagerOSThreadProps> = ({
  exampleQuestions = [
    'List initiatives that are currently in progress',
    'Who manages Karim Shehadeh?',
    'Show me all high priority tasks',
    'What teams do we have?',
    'Find meetings scheduled for this week',
  ],
}) => {
  return (
    <LazyMotion features={domAnimation}>
      <MotionConfig reducedMotion='user'>
        <ThreadPrimitive.Root
          className='aui-root aui-thread-root @container flex h-full flex-col bg-background'
          style={{
            ['--thread-max-width' as string]: '44rem',
          }}
        >
          <ThreadPrimitive.Viewport className='aui-thread-viewport relative flex flex-1 flex-col overflow-x-auto overflow-y-scroll px-4'>
            <ThreadPrimitive.If empty>
              <ThreadWelcome exampleQuestions={exampleQuestions} />
            </ThreadPrimitive.If>

            <ThreadPrimitive.Messages
              components={{
                UserMessage,
                EditComposer,
                AssistantMessage,
              }}
            />

            <ThreadPrimitive.If empty={false}>
              <div className='aui-thread-viewport-spacer min-h-8 grow' />
            </ThreadPrimitive.If>

            <Composer />
          </ThreadPrimitive.Viewport>
        </ThreadPrimitive.Root>
      </MotionConfig>
    </LazyMotion>
  )
}

const ThreadScrollToBottom: FC = () => {
  return (
    <ThreadPrimitive.ScrollToBottom asChild>
      <TooltipIconButton
        tooltip='Scroll to bottom'
        variant='outline'
        className='aui-thread-scroll-to-bottom absolute -top-12 z-10 self-center rounded-full p-4 disabled:invisible dark:bg-background dark:hover:bg-accent'
      >
        <ArrowDownIcon />
      </TooltipIconButton>
    </ThreadPrimitive.ScrollToBottom>
  )
}

const ThreadWelcome: FC<{ exampleQuestions: string[] }> = ({
  exampleQuestions,
}) => {
  return (
    <div className='aui-thread-welcome-root mx-auto my-auto flex w-full max-w-[var(--thread-max-width)] flex-grow flex-col'>
      <div className='aui-thread-welcome-center flex w-full flex-grow flex-col items-center justify-center'>
        <div className='aui-thread-welcome-message flex size-full flex-col justify-center px-8'>
          <m.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className='aui-thread-welcome-message-motion-1 text-2xl font-semibold'
          >
            Hello there!
          </m.div>
          <m.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ delay: 0.1 }}
            className='aui-thread-welcome-message-motion-2 text-2xl text-muted-foreground/65'
          >
            Ask me anything about your organization&apos;s data
          </m.div>
        </div>
      </div>
      <ThreadSuggestions exampleQuestions={exampleQuestions} />
    </div>
  )
}

const ThreadSuggestions: FC<{ exampleQuestions: string[] }> = ({
  exampleQuestions,
}) => {
  return (
    <div className='aui-thread-welcome-suggestions grid w-full gap-2 pb-4 @md:grid-cols-2'>
      {exampleQuestions.map((question, index) => (
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.05 * index }}
          key={`suggested-action-${question}-${index}`}
          className='aui-thread-welcome-suggestion-display [&:nth-child(n+3)]:hidden @md:[&:nth-child(n+3)]:block'
        >
          <ThreadPrimitive.Suggestion prompt={question} send asChild>
            <Button
              variant='ghost'
              className='aui-thread-welcome-suggestion h-auto w-full flex-1 flex-wrap items-start justify-start gap-1 rounded-3xl border px-5 py-4 text-left text-sm @md:flex-col dark:hover:bg-accent/60'
              aria-label={question}
            >
              <span className='aui-thread-welcome-suggestion-text-1 font-medium'>
                {question}
              </span>
            </Button>
          </ThreadPrimitive.Suggestion>
        </m.div>
      ))}
    </div>
  )
}

const Composer: FC = () => {
  // Handle clicks on the composer wrapper to ensure input is focused
  const handleComposerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only focus if clicking on the wrapper itself, not on buttons or other interactive elements
    const target = e.target as HTMLElement
    if (
      target.tagName !== 'BUTTON' &&
      target.tagName !== 'INPUT' &&
      target.tagName !== 'TEXTAREA' &&
      !target.closest('button')
    ) {
      const composerInput = document.querySelector(
        '[aria-label="Message input"]'
      ) as HTMLTextAreaElement
      if (
        composerInput &&
        !composerInput.disabled &&
        composerInput.offsetParent !== null
      ) {
        composerInput.focus()
      }
    }
  }

  return (
    <div
      className='aui-composer-wrapper sticky bottom-0 mx-auto flex w-full max-w-[var(--thread-max-width)] flex-col gap-4 overflow-visible rounded-t-3xl bg-background pb-4 md:pb-6'
      onClick={handleComposerClick}
    >
      <ThreadScrollToBottom />
      <ComposerPrimitive.Root className='aui-composer-root relative flex w-full flex-col rounded-3xl border border-border bg-muted px-1 pt-2 shadow-[0_9px_9px_0px_rgba(0,0,0,0.01),0_2px_5px_0px_rgba(0,0,0,0.06)] dark:border-muted-foreground/15'>
        <ComposerPrimitive.Input
          placeholder='Ask about your organization...'
          className='aui-composer-input mb-1 max-h-32 min-h-16 w-full resize-none bg-transparent px-3.5 pt-1.5 pb-3 text-sm outline-none placeholder:text-muted-foreground focus:outline-none'
          rows={1}
          autoFocus
          aria-label='Message input'
        />
        <ComposerAction />
      </ComposerPrimitive.Root>
    </div>
  )
}

const ComposerAction: FC = () => {
  return (
    <div className='aui-composer-action-wrapper relative mx-1 mt-2 mb-2 flex items-center justify-end'>
      <ThreadPrimitive.If running={false}>
        <ComposerPrimitive.Send asChild>
          <TooltipIconButton
            tooltip='Send message'
            side='bottom'
            type='submit'
            variant='default'
            size='icon'
            className='aui-composer-send size-[34px] rounded-full p-1'
            aria-label='Send message'
          >
            <ArrowUpIcon className='aui-composer-send-icon size-5' />
          </TooltipIconButton>
        </ComposerPrimitive.Send>
      </ThreadPrimitive.If>

      <ThreadPrimitive.If running>
        <ComposerPrimitive.Cancel asChild>
          <Button
            type='button'
            variant='default'
            size='icon'
            className='aui-composer-cancel size-[34px] rounded-full border border-muted-foreground/60 hover:bg-primary/75 dark:border-muted-foreground/90'
            aria-label='Stop generating'
          >
            <Square className='aui-composer-cancel-icon size-3.5 fill-white dark:fill-black' />
          </Button>
        </ComposerPrimitive.Cancel>
      </ThreadPrimitive.If>
    </div>
  )
}

const MessageError: FC = () => {
  return (
    <MessagePrimitive.Error>
      <ErrorPrimitive.Root className='aui-message-error-root mt-2 rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive dark:bg-destructive/5 dark:text-red-200'>
        <ErrorPrimitive.Message className='aui-message-error-message line-clamp-2' />
        <div className='mt-2'>
          <ActionBarPrimitive.Reload asChild>
            <Button variant='outline' size='sm'>
              Try Again
            </Button>
          </ActionBarPrimitive.Reload>
        </div>
      </ErrorPrimitive.Root>
    </MessagePrimitive.Error>
  )
}

const AssistantMessage: FC = () => {
  return (
    <MessagePrimitive.Root asChild>
      <div
        className='aui-assistant-message-root relative mx-auto w-full max-w-[var(--thread-max-width)] animate-in py-4 duration-150 ease-out fade-in slide-in-from-bottom-1 last:mb-24'
        data-role='assistant'
      >
        <div className='aui-assistant-message-content mx-2 leading-7 break-words text-foreground text-sm'>
          <MessagePrimitive.Parts
            components={{
              Text: MarkdownText,
              tools: { Fallback: ManagerOSToolFallback },
            }}
          />
          <MessageError />
        </div>

        <div className='aui-assistant-message-footer mt-2 ml-2 flex'>
          <BranchPicker />
          <AssistantActionBar />
        </div>
      </div>
    </MessagePrimitive.Root>
  )
}

const ManagerOSToolFallback: ToolCallMessagePartComponent = ({ toolName }) => {
  const IconComponent = getToolIcon(toolName)
  return (
    <div className='flex items-center gap-2 text-xs text-muted-foreground mb-2'>
      <div className='flex items-center gap-1'>
        <IconComponent className='h-3 w-3 text-primary' />
        {getToolDescription(toolName)}
      </div>
    </div>
  )
}

const AssistantActionBar: FC = () => {
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide='not-last'
      autohideFloat='single-branch'
      className='aui-assistant-action-bar-root col-start-3 row-start-2 -ml-1 flex gap-1 text-muted-foreground data-floating:absolute data-floating:rounded-md data-floating:border data-floating:bg-background data-floating:p-1 data-floating:shadow-sm'
    >
      <ActionBarPrimitive.Copy asChild>
        <TooltipIconButton tooltip='Copy'>
          <MessagePrimitive.If copied>
            <CheckIcon />
          </MessagePrimitive.If>
          <MessagePrimitive.If copied={false}>
            <CopyIcon />
          </MessagePrimitive.If>
        </TooltipIconButton>
      </ActionBarPrimitive.Copy>
      <ActionBarPrimitive.Reload asChild>
        <TooltipIconButton tooltip='Refresh'>
          <RefreshCwIcon />
        </TooltipIconButton>
      </ActionBarPrimitive.Reload>
    </ActionBarPrimitive.Root>
  )
}

const UserMessage: FC = () => {
  return (
    <MessagePrimitive.Root asChild>
      <div
        className='aui-user-message-root mx-auto grid w-full max-w-[var(--thread-max-width)] animate-in auto-rows-auto grid-cols-[minmax(72px,1fr)_auto] gap-y-2 px-2 py-4 duration-150 ease-out fade-in slide-in-from-bottom-1 first:mt-3 last:mb-5 [&:where(>*)]:col-start-2'
        data-role='user'
      >
        <UserMessageAttachments />

        <div className='aui-user-message-content-wrapper relative col-start-2 min-w-0'>
          <div className='aui-user-message-content rounded-3xl bg-muted px-5 py-2.5 break-words text-foreground text-sm'>
            <MessagePrimitive.Parts />
          </div>
          <div className='aui-user-action-bar-wrapper absolute top-1/2 left-0 -translate-x-full -translate-y-1/2 pr-2'>
            <UserActionBar />
          </div>
        </div>

        <BranchPicker className='aui-user-branch-picker col-span-full col-start-1 row-start-3 -mr-1 justify-end' />
      </div>
    </MessagePrimitive.Root>
  )
}

const UserActionBar: FC = () => {
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide='not-last'
      className='aui-user-action-bar-root flex flex-col items-end'
    >
      <ActionBarPrimitive.Edit asChild>
        <TooltipIconButton tooltip='Edit' className='aui-user-action-edit p-4'>
          <PencilIcon />
        </TooltipIconButton>
      </ActionBarPrimitive.Edit>
    </ActionBarPrimitive.Root>
  )
}

const EditComposer: FC = () => {
  return (
    <div className='aui-edit-composer-wrapper mx-auto flex w-full max-w-[var(--thread-max-width)] flex-col gap-4 px-2 first:mt-4'>
      <ComposerPrimitive.Root className='aui-edit-composer-root ml-auto flex w-full max-w-7/8 flex-col rounded-xl bg-muted'>
        <ComposerPrimitive.Input
          className='aui-edit-composer-input flex min-h-[60px] w-full resize-none bg-transparent p-4 text-foreground outline-none'
          autoFocus
        />

        <div className='aui-edit-composer-footer mx-3 mb-3 flex items-center justify-center gap-2 self-end'>
          <ComposerPrimitive.Cancel asChild>
            <Button variant='ghost' size='sm' aria-label='Cancel edit'>
              Cancel
            </Button>
          </ComposerPrimitive.Cancel>
          <ComposerPrimitive.Send asChild>
            <Button size='sm' aria-label='Update message'>
              Update
            </Button>
          </ComposerPrimitive.Send>
        </div>
      </ComposerPrimitive.Root>
    </div>
  )
}

const BranchPicker: FC<BranchPickerPrimitive.Root.Props> = ({
  className,
  ...rest
}) => {
  return (
    <BranchPickerPrimitive.Root
      hideWhenSingleBranch
      className={cn(
        'aui-branch-picker-root mr-2 -ml-2 inline-flex items-center text-xs text-muted-foreground',
        className
      )}
      {...rest}
    >
      <BranchPickerPrimitive.Previous asChild>
        <TooltipIconButton tooltip='Previous'>
          <ChevronLeftIcon />
        </TooltipIconButton>
      </BranchPickerPrimitive.Previous>
      <span className='aui-branch-picker-state font-medium'>
        <BranchPickerPrimitive.Number /> / <BranchPickerPrimitive.Count />
      </span>
      <BranchPickerPrimitive.Next asChild>
        <TooltipIconButton tooltip='Next'>
          <ChevronRightIcon />
        </TooltipIconButton>
      </BranchPickerPrimitive.Next>
    </BranchPickerPrimitive.Root>
  )
}
