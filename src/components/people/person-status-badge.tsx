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
  sm: 'text-xs px-md py-xs',
  md: 'text-sm px-lg py-xs',
  lg: 'text-md px-lg py-sm',
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
