'use client'

import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo)
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return (
          <FallbackComponent
            error={this.state.error!}
            resetError={this.resetError}
          />
        )
      }

      return (
        <div className='flex flex-col items-center justify-center p-8 text-center'>
          <div className='mb-4 rounded-full bg-destructive/10 p-4'>
            <AlertTriangle className='h-8 w-8 text-destructive' />
          </div>
          <h3 className='mb-2 text-lg font-semibold'>Something went wrong</h3>
          <p className='mb-4 text-sm text-muted-foreground max-w-md'>
            An unexpected error occurred. This has been logged and we&apos;ll
            look into it.
          </p>
          <div className='flex gap-2'>
            <Button variant='outline' onClick={this.resetError}>
              <RefreshCw className='mr-2 h-4 w-4' />
              Try Again
            </Button>
            <Button variant='ghost' onClick={() => window.location.reload()}>
              Reload Page
            </Button>
          </div>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className='mt-4 text-left'>
              <summary className='cursor-pointer text-sm text-muted-foreground'>
                Error Details (Development)
              </summary>
              <pre className='mt-2 rounded bg-muted p-2 text-xs overflow-auto max-w-md'>
                {this.state.error.stack}
              </pre>
            </details>
          )}
        </div>
      )
    }

    return this.props.children
  }
}
