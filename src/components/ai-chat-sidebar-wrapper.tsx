'use client'

import { AIChatSidebar } from '@/components/ai-chat-sidebar'
import { useAIChat } from '@/components/ai-chat-provider'

export function AIChatSidebarWrapper() {
  const { isAIChatOpen, setIsAIChatOpen } = useAIChat()

  return (
    <AIChatSidebar
      isOpen={isAIChatOpen}
      onClose={() => setIsAIChatOpen(false)}
    />
  )
}
