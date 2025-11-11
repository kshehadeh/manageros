'use client'

import { cn } from '@/lib/utils'

interface LoadingProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'spinner' | 'dots' | 'pulse'
}

export function Loading({
  className,
  size = 'md',
  variant = 'spinner',
}: LoadingProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  }

  if (variant === 'spinner') {
    return (
      <div className={cn('animate-spin', sizeClasses[size], className)}>
        <svg
          className='h-full w-full'
          xmlns='http://www.w3.org/2000/svg'
          fill='none'
          viewBox='0 0 24 24'
        >
          <circle
            className='opacity-25'
            cx='12'
            cy='12'
            r='10'
            stroke='currentColor'
            strokeWidth='4'
          />
          <path
            className='opacity-75'
            fill='currentColor'
            d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
          />
        </svg>
      </div>
    )
  }

  if (variant === 'dots') {
    return (
      <div className={cn('flex space-x-sm', className)}>
        <div className='h-2 w-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]' />
        <div className='h-2 w-2 bg-current rounded-full animate-bounce [animation-delay:-0.15s]' />
        <div className='h-2 w-2 bg-current rounded-full animate-bounce' />
      </div>
    )
  }

  if (variant === 'pulse') {
    return (
      <div
        className={cn(
          'animate-pulse bg-current rounded',
          sizeClasses[size],
          className
        )}
      />
    )
  }

  return null
}

export function PageLoading({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex items-center justify-center min-h-[200px]',
        className
      )}
    >
      <div className='flex flex-col items-center space-y-xl'>
        <Loading size='lg' />
        <p className='text-sm text-muted-foreground'>Loading...</p>
      </div>
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse bg-muted rounded', className)} />
}
