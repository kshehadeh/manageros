import { Badge } from '@/components/ui/badge'
import { Calendar, Play, CheckCircle, Pause, Clock } from 'lucide-react'

export type FeedbackCampaignStatus =
  | 'draft'
  | 'active'
  | 'completed'
  | 'cancelled'

interface FeedbackCampaignStatusBadgeProps {
  status: FeedbackCampaignStatus | string
  showIcon?: boolean
  className?: string
  isCurrentlyActive?: boolean
  isPending?: boolean
}

const statusConfig = {
  draft: {
    variant: 'neutral' as const,
    label: 'DRAFT',
    icon: Calendar,
  },
  active: {
    variant: 'success' as const,
    label: 'ACTIVE',
    icon: Play,
  },
  completed: {
    variant: 'info' as const,
    label: 'COMPLETED',
    icon: CheckCircle,
  },
  cancelled: {
    variant: 'error' as const,
    label: 'CANCELLED',
    icon: Pause,
  },
  pending: {
    variant: 'warning' as const,
    label: 'PENDING',
    icon: Clock,
  },
}

export function FeedbackCampaignStatusBadge({
  status,
  showIcon = true,
  className,
  isCurrentlyActive = false,
  isPending = false,
}: FeedbackCampaignStatusBadgeProps) {
  // If campaign is pending, use pending config
  if (isPending && status === 'active') {
    const IconComponent = statusConfig.pending.icon
    return (
      <Badge variant={statusConfig.pending.variant} className={className}>
        {showIcon && <IconComponent className='h-4 w-4' />}
        <span className={showIcon ? 'ml-1' : ''}>
          {statusConfig.pending.label}
        </span>
      </Badge>
    )
  }

  const config =
    statusConfig[status as FeedbackCampaignStatus] || statusConfig.draft
  const IconComponent = config.icon

  // For active campaigns that are currently within their date range, show "CURRENTLY ACTIVE"
  const label =
    status === 'active' && isCurrentlyActive ? 'CURRENTLY ACTIVE' : config.label

  return (
    <Badge variant={config.variant} className={className}>
      {showIcon && <IconComponent className='h-4 w-4' />}
      <span className={showIcon ? 'ml-1' : ''}>{label}</span>
    </Badge>
  )
}
