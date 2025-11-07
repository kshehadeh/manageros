import { Skeleton } from '@/components/ui/skeleton'
import { PageSection } from '@/components/ui/page-section'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { Button } from '@/components/ui/button'
import { Calendar, Plus } from 'lucide-react'
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
    <PageContainer>
      <PageHeader
        title='Meetings'
        titleIcon={Calendar}
        subtitle="Manage and track your organization's meetings"
        actions={
          <Button disabled className='flex items-center gap-2'>
            <Plus className='h-4 w-4' />
            Create Meeting
          </Button>
        }
      />

      <PageContent>
        <PageSection>
          <div className='rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='min-w-[300px]'>
                    <Skeleton className='h-4 w-20' />
                  </TableHead>
                  <TableHead className='w-[150px]'>
                    <Skeleton className='h-4 w-16' />
                  </TableHead>
                  <TableHead className='w-[120px]'>
                    <Skeleton className='h-4 w-12' />
                  </TableHead>
                  <TableHead className='w-[150px]'>
                    <Skeleton className='h-4 w-20' />
                  </TableHead>
                  <TableHead className='w-[100px]'>
                    <Skeleton className='h-4 w-16' />
                  </TableHead>
                  <TableHead className='w-[80px]' />
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className='space-y-1'>
                        <Skeleton className='h-4 w-48' />
                        <Skeleton className='h-3 w-32' />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Skeleton className='h-4 w-24' />
                    </TableCell>
                    <TableCell>
                      <Skeleton className='h-4 w-20' />
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center gap-2'>
                        {Array.from({ length: 3 }).map((_, j) => (
                          <Skeleton key={j} className='h-6 w-6 rounded-full' />
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Skeleton className='h-5 w-16 rounded-full' />
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
      </PageContent>
    </PageContainer>
  )
}
