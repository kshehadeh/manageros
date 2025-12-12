import { DataTableLoading } from '@/components/ui/data-table-loading'
import { Skeleton } from '@/components/ui/skeleton'
import { User } from 'lucide-react'
import { TableCell, TableRow } from '@/components/ui/table'

export default function LoadingPage() {
  return (
    <DataTableLoading
      title={<Skeleton className='h-8 w-32' />}
      titleIcon={User}
      subtitle={<Skeleton className='h-5 w-64' />}
      actions={
        <div className='flex flex-wrap items-center gap-3'>
          <Skeleton className='h-9 w-20 rounded-md' />
          <Skeleton className='h-9 w-28 rounded-md' />
          <Skeleton className='h-9 w-32 rounded-md' />
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
