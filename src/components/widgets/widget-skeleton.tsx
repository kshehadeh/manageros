import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface WidgetSkeletonProps {
  minWidth?: string
  className?: string
}

/**
 * Skeleton component for widget cards
 * Matches the layout of WidgetCard
 */
export function WidgetSkeleton({
  minWidth,
  className = '',
}: WidgetSkeletonProps) {
  return (
    <Card
      className={`bg-card text-card-foreground rounded-sm ${className}`}
      style={{ minWidth }}
    >
      <CardHeader className='px-lg py-md pb-sm border-b border-dotted border-border relative flex flex-row items-center justify-center min-h-[2.5rem]'>
        <CardTitle className='text-sm font-bold font-mono flex items-center gap-2 text-muted-foreground pb-0 mb-0'>
          <Skeleton className='h-3 w-3 rounded' />
          <Skeleton className='h-4 w-24' />
        </CardTitle>
      </CardHeader>
      <CardContent className='px-lg pb-md pt-2'>
        <div className='flex items-center justify-center'>
          <Skeleton className='h-12 w-16' />
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Skeleton component for chart widgets
 * Matches the layout of chart widgets
 */
export function ChartWidgetSkeleton({
  minWidth,
  className = '',
}: WidgetSkeletonProps) {
  return (
    <Card
      className={`bg-card text-card-foreground rounded-sm ${className}`}
      style={{ minWidth }}
    >
      <CardHeader className='px-lg py-md pb-sm border-b border-dotted border-border relative flex flex-row items-center justify-center min-h-[2.5rem]'>
        <CardTitle className='text-sm font-bold font-mono flex items-center gap-2 text-muted-foreground pb-0 mb-0'>
          <Skeleton className='h-3 w-3 rounded' />
          <Skeleton className='h-4 w-32' />
        </CardTitle>
      </CardHeader>
      <CardContent className='px-lg pb-md pt-2'>
        <Skeleton className='h-[200px] w-full' />
      </CardContent>
    </Card>
  )
}
