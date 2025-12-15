'use client'

import { Button } from '@/components/ui/button'

declare global {
  interface Window {
    $crisp: unknown[]
  }
}

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
    if (typeof window !== 'undefined' && window.$crisp) {
      window.$crisp.push(['do', 'chat:open'])
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
