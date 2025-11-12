import * as React from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

export interface HelpBlockAction {
  label: string
  href?: string
  onClick?: () => void
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export interface HelpBlockProps {
  title: string
  description: string | React.ReactNode
  icon: LucideIcon
  variant?: 'info' | 'warning' | 'success' | 'neutral'
  action?: HelpBlockAction
  className?: string
}

const variantStyles = {
  info: {
    container:
      'border-badge-info/50 bg-badge-info/10 dark:bg-badge-info/5 dark:border-badge-info/30',
    icon: 'text-badge-info-text',
    title: 'text-badge-info-text',
    description: 'text-foreground',
  },
  warning: {
    container:
      'border-badge-warning/50 bg-badge-warning/10 dark:bg-badge-warning/5 dark:border-badge-warning/30',
    icon: 'text-badge-warning-text',
    title: 'text-badge-warning-text',
    description: 'text-foreground',
  },
  success: {
    container:
      'border-badge-success/50 bg-badge-success/10 dark:bg-badge-success/5 dark:border-badge-success/30',
    icon: 'text-badge-success-text',
    title: 'text-badge-success-text',
    description: 'text-foreground',
  },
  neutral: {
    container: 'border-border bg-muted/50 dark:bg-muted/30 dark:border-border',
    icon: 'text-muted-foreground',
    title: 'text-foreground',
    description: 'text-muted-foreground',
  },
}

export function HelpBlock({
  title,
  description,
  icon: Icon,
  variant = 'info',
  action,
  className,
}: HelpBlockProps) {
  const styles = variantStyles[variant]

  return (
    <Alert className={cn(styles.container, '[&>svg]:!text-current', className)}>
      <Icon className={cn('h-4 w-4', styles.icon)} />
      <AlertTitle className={styles.title}>{title}</AlertTitle>
      <AlertDescription className={styles.description}>
        <div className='space-y-3'>
          {typeof description === 'string' ? <p>{description}</p> : description}
          {action && (
            <Button
              asChild={!!action.href}
              variant={action.variant || 'outline'}
              size={action.size || 'sm'}
              onClick={action.onClick}
            >
              {action.href ? (
                <Link href={action.href}>{action.label}</Link>
              ) : (
                <span>{action.label}</span>
              )}
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  )
}
