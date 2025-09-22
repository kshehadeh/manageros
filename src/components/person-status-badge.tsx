import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export type PersonStatus = 'active' | 'inactive' | 'pending'

export type PersonStatusBadgeSize = 'sm' | 'md' | 'lg'

interface PersonStatusBadgeProps {
  status: PersonStatus | string
  size?: PersonStatusBadgeSize
  className?: string
}

const statusConfig = {
  active: {
    variant: 'success' as const,
    label: 'ACTIVE',
  },
  inactive: {
    variant: 'error' as const,
    label: 'INACTIVE',
  },
  pending: {
    variant: 'warning' as const,
    label: 'PENDING',
  },
}

const sizeConfig = {
  sm: 'text-xs px-1.5 py-0.5',
  md: 'text-xs px-2.5 py-0.5',
  lg: 'text-sm px-3 py-1',
}

export function PersonStatusBadge({
  status,
  size = 'md',
  className,
}: PersonStatusBadgeProps) {
  const config = statusConfig[status as PersonStatus] || statusConfig.pending
  const sizeClasses = sizeConfig[size]

  return (
    <Badge variant={config.variant} className={cn(sizeClasses, className)}>
      {config.label}
    </Badge>
  )
}
