import { DataTableLoading } from '@/components/ui/data-table-loading'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { User, UserPlus, Upload, Workflow } from 'lucide-react'
import { TableCell, TableRow } from '@/components/ui/table'

export default function LoadingPage() {
  return (
    <DataTableLoading
      title='People'
      titleIcon={User}
      subtitle={<Skeleton className='h-5 w-5 rounded' />}
      actions={
        <div className='flex flex-wrap items-center gap-3'>
          <Button
            disabled
            variant='outline'
            className='flex items-center gap-2'
          >
            <Workflow className='w-4 h-4' />
            <span className='hidden sm:inline'>Chart</span>
          </Button>
          <Button
            disabled
            variant='outline'
            className='flex items-center gap-2'
          >
            <Upload className='w-4 h-4' />
            <span className='hidden sm:inline'>Import CSV</span>
          </Button>
          <Button disabled className='flex items-center gap-2'>
            <UserPlus className='w-4 h-4' />
            <span className='hidden sm:inline'>Create Person</span>
          </Button>
        </div>
      }
      columns={[
        { minWidth: '250px', skeletonWidth: '16px' },
        { width: '150px', skeletonWidth: '12px' },
        { width: '150px', skeletonWidth: '16px' },
        { width: '150px', skeletonWidth: '20px' },
        { width: '100px', skeletonWidth: '12px' },
      ]}
      pageSectionClassName='-mx-3 md:mx-0'
      renderRow={index => (
        <TableRow key={index}>
          <TableCell>
            <div className='flex items-center gap-3'>
              <Skeleton className='h-10 w-10 rounded-full' />
              <div className='flex flex-col space-y-1'>
                <Skeleton className='h-4 w-32' />
                <Skeleton className='h-3 w-40' />
              </div>
            </div>
          </TableCell>
          <TableCell>
            <Skeleton className='h-4 w-24' />
          </TableCell>
          <TableCell>
            <Skeleton className='h-4 w-28' />
          </TableCell>
          <TableCell>
            <Skeleton className='h-4 w-20' />
          </TableCell>
          <TableCell>
            <Skeleton className='h-5 w-16 rounded-full' />
          </TableCell>
          <TableCell>
            <Skeleton className='h-8 w-8 rounded-md' />
          </TableCell>
        </TableRow>
      )}
    />
  )
}
