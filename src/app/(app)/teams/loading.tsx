import { DataTableLoading } from '@/components/ui/data-table-loading'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Users2, Plus, Upload, Workflow } from 'lucide-react'
import { TableCell, TableRow } from '@/components/ui/table'

export default function LoadingPage() {
  return (
    <DataTableLoading
      title='Teams'
      titleIcon={Users2}
      subtitle="Manage your organization's team structure"
      actions={
        <div className='flex gap-2'>
          <Button
            disabled
            variant='outline'
            className='flex items-center gap-2'
          >
            <Workflow className='w-4 h-4' />
            Chart
          </Button>
          <Button
            disabled
            variant='outline'
            className='flex items-center gap-2'
          >
            <Upload className='w-4 h-4' />
            Import Teams
          </Button>
          <Button disabled className='flex items-center gap-2'>
            <Plus className='h-4 w-4' />
            Create Team
          </Button>
        </div>
      }
      columns={[
        { minWidth: '250px', skeletonWidth: '16px' },
        { width: '100px', skeletonWidth: '12px' },
        { width: '100px', skeletonWidth: '12px' },
        { width: '150px', skeletonWidth: '20px' },
      ]}
      renderRow={index => (
        <TableRow key={index}>
          <TableCell>
            <div className='flex items-center gap-3'>
              <Skeleton className='h-10 w-10 rounded-full' />
              <div className='space-y-0.5 flex-1'>
                <Skeleton className='h-4 w-32' />
                <Skeleton className='h-3 w-40' />
              </div>
            </div>
          </TableCell>
          <TableCell>
            <Skeleton className='h-4 w-16' />
          </TableCell>
          <TableCell>
            <Skeleton className='h-4 w-16' />
          </TableCell>
          <TableCell>
            <Skeleton className='h-4 w-24' />
          </TableCell>
          <TableCell>
            <Skeleton className='h-8 w-8 rounded-md' />
          </TableCell>
        </TableRow>
      )}
    />
  )
}
