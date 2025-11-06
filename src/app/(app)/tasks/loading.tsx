import { Skeleton } from '@/components/ui/skeleton'
import { PageSection } from '@/components/ui/page-section'
import { Button } from '@/components/ui/button'
import { ListTodo, Plus } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default function LoadingPage() {
  return (
    <div className='page-container'>
      <div className='page-header'>
        <div className='flex items-center justify-between'>
          <div>
            <div className='flex items-center gap-2'>
              <ListTodo className='h-6 w-6 text-muted-foreground' />
              <h1 className='page-title'>Tasks</h1>
            </div>
            <p className='page-subtitle'>
              Manage and track all tasks across your organization
            </p>
          </div>
          <Button disabled className='flex items-center gap-2'>
            <Plus className='h-4 w-4' />
            Create Task
          </Button>
        </div>
      </div>

      <PageSection>
        <div className='rounded-md border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='min-w-[400px]'>
                  <Skeleton className='h-4 w-20' />
                </TableHead>
                <TableHead className='w-[120px]'>
                  <Skeleton className='h-4 w-16' />
                </TableHead>
                <TableHead className='w-[120px]'>
                  <Skeleton className='h-4 w-12' />
                </TableHead>
                <TableHead className='w-[150px]'>
                  <Skeleton className='h-4 w-20' />
                </TableHead>
                <TableHead className='w-[120px]'>
                  <Skeleton className='h-4 w-16' />
                </TableHead>
                <TableHead className='w-[80px]' />
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 10 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className='flex items-start gap-3'>
                      <Skeleton className='h-4 w-4 rounded mt-0.5' />
                      <div className='space-y-1 flex-1'>
                        <Skeleton className='h-4 w-56' />
                        <Skeleton className='h-3 w-40' />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className='h-5 w-20 rounded-full' />
                  </TableCell>
                  <TableCell>
                    <Skeleton className='h-5 w-16 rounded-full' />
                  </TableCell>
                  <TableCell>
                    <Skeleton className='h-4 w-28' />
                  </TableCell>
                  <TableCell>
                    <Skeleton className='h-4 w-24' />
                  </TableCell>
                  <TableCell>
                    <Skeleton className='h-8 w-8 rounded-md' />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </PageSection>
    </div>
  )
}
