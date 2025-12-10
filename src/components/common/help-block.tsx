import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'
import { PageSection } from '@/components/ui/page-section'
import { SectionHeader } from '@/components/ui/section-header'
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
    container: 'border-badge-info/50 dark:border-badge-info/30',
    icon: 'text-badge-info-text',
    title: 'text-badge-info-text',
    description: 'text-foreground',
  },
  warning: {
    container: 'border-badge-warning/50 dark:border-badge-warning/30',
    icon: 'text-badge-warning-text',
    title: 'text-badge-warning-text',
    description: 'text-foreground',
  },
  success: {
    container: 'border-badge-success/50 dark:border-badge-success/30',
    icon: 'text-badge-success-text',
    title: 'text-badge-success-text',
    description: 'text-foreground',
  },
  neutral: {
    container: 'border-border dark:border-border',
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

  // Construct Tailwind arbitrary variant classes for icon and title
  const iconClass = styles.icon.replace('text-', '[&_svg]:text-')
  const titleClass = styles.title.replace('text-', '[&_h3]:text-')

  return (
    <PageSection
      className={cn(styles.container, className)}
      header={
        <SectionHeader
          icon={Icon}
          title={title}
          className={cn(iconClass, titleClass)}
        />
      }
    >
      <div className={cn('space-y-3', styles.description)}>
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
    </PageSection>
  )
}
