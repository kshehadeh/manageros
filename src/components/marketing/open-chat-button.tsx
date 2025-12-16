'use client'

import { Button } from '@/components/ui/button'
import { Crisp } from 'crisp-sdk-web'

interface OpenChatButtonProps {
  children: React.ReactNode
  className?: string
  size?: 'default' | 'sm' | 'lg' | 'icon'
  variant?:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link'
}

export function OpenChatButton({
  children,
  className,
  size = 'lg',
  variant = 'outline',
}: OpenChatButtonProps) {
  const openChat = () => {
    try {
      Crisp.chat.open()
    } catch (error) {
      console.error('Error opening Crisp chat:', error)
    }
  }

  return (
    <Button
      onClick={openChat}
      size={size}
      variant={variant}
      className={className}
    >
      {children}
    </Button>
  )
}
