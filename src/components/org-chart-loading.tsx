'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface OrgChartLoadingProps {
  className?: string
}

export function OrgChartLoading({ className }: OrgChartLoadingProps) {
  // Create a hierarchical layout of skeleton nodes
  // Top level (1 node)
  // Second level (2-3 nodes)
  // Third level (4-6 nodes)

  return (
    <div
      className={cn(
        'border rounded-lg overflow-hidden bg-background',
        'relative',
        className
      )}
      style={{
        width: '100%',
        height: '80vh',
        maxWidth: '100%',
        maxHeight: '80vh',
      }}
    >
      {/* Background pattern - dots similar to ReactFlow */}
      <div
        className='absolute inset-0 opacity-30'
        style={{
          backgroundImage: `radial-gradient(circle, hsl(var(--muted-foreground)) 1px, transparent 1px)`,
          backgroundSize: '20px 20px',
        }}
      />

      {/* Skeleton Controls - top right */}
      <div className='absolute top-4 right-4 z-10 flex gap-2'>
        <Skeleton className='h-8 w-8 rounded-md' />
        <Skeleton className='h-8 w-8 rounded-md' />
        <Skeleton className='h-8 w-8 rounded-md' />
        <Skeleton className='h-8 w-8 rounded-md' />
      </div>

      {/* Skeleton MiniMap - bottom right */}
      <div className='absolute bottom-4 right-4 z-10'>
        <Skeleton className='h-32 w-32 rounded-md border-2' />
      </div>

      {/* Skeleton Nodes in hierarchical layout */}
      <div className='relative w-full h-full flex flex-col items-center justify-start pt-16 pb-20'>
        {/* Top level - 1 node */}
        <div className='mb-24'>
          <OrgChartNodeSkeleton />
        </div>

        {/* Second level - 2-3 nodes */}
        <div className='flex gap-16 mb-24'>
          <OrgChartNodeSkeleton />
          <OrgChartNodeSkeleton />
          <OrgChartNodeSkeleton />
        </div>

        {/* Third level - 4-6 nodes */}
        <div className='flex gap-12'>
          <OrgChartNodeSkeleton />
          <OrgChartNodeSkeleton />
          <OrgChartNodeSkeleton />
          <OrgChartNodeSkeleton />
        </div>
      </div>
    </div>
  )
}

function OrgChartNodeSkeleton() {
  return (
    <div className='bg-card border-2 border-border rounded-lg shadow-sm min-w-[200px]'>
      <div className='p-3'>
        {/* Header with name and badge */}
        <div className='flex items-center justify-between mb-2'>
          <Skeleton className='h-4 w-24' />
          <Skeleton className='h-5 w-8 rounded-full' />
        </div>

        {/* Role/Description */}
        <Skeleton className='h-3 w-32 mb-1' />
        <Skeleton className='h-3 w-28 mb-1' />

        {/* Email/Additional info */}
        <Skeleton className='h-3 w-36 mb-2' />

        {/* Status/Bottom section */}
        <div className='flex items-center justify-end mt-2'>
          <Skeleton className='h-5 w-16 rounded-full' />
        </div>
      </div>
    </div>
  )
}
