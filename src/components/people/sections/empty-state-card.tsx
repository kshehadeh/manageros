import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { Link } from '@/components/ui/link'

interface EmptyStateCardProps {
  title: string
  description: string
  actionLabel: string
  actionHref: string
  icon?: React.ComponentType<{ className?: string }>
}

export function EmptyStateCard({
  title,
  description,
  actionLabel,
  actionHref,
  icon: Icon,
}: EmptyStateCardProps) {
  return (
    <Card className='flex-1 min-w-[300px]'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          {Icon && <Icon className='w-5 h-5' />}
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild variant='outline' className='w-full'>
          <Link href={actionHref}>
            {actionLabel}
            <ArrowRight className='w-4 h-4 ml-2' />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
