import { Skeleton } from '@/components/ui/skeleton'
import { SectionHeader } from '@/components/ui/section-header'
import { PageSection } from '@/components/ui/page-section'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { PageMain } from '@/components/ui/page-main'
import { PageSidebar } from '@/components/ui/page-sidebar'
import {
  Calendar,
  User,
  Clock,
  FileText,
  ListTodo,
  Flag,
  Rocket,
  Target,
  Link as LinkIcon,
} from 'lucide-react'

export default function LoadingPage() {
  return (
    <PageContainer>
      <PageHeader
        title='Loading task...'
        titleIcon={ListTodo}
        subtitle={
          <div className='flex flex-wrap items-center gap-3 mt-2 mb-3'>
            <div className='flex items-center gap-1'>
              <Calendar className='w-4 h-4 text-muted-foreground' />
              <Skeleton className='h-4 w-32' />
            </div>
            <div className='flex items-center gap-1'>
              <User className='w-4 h-4 text-muted-foreground' />
              <Skeleton className='h-4 w-28' />
            </div>
            <div className='flex items-center gap-1'>
              <Clock className='w-4 h-4 text-muted-foreground' />
              <Skeleton className='h-4 w-36' />
            </div>
          </div>
        }
        actions={<Skeleton className='h-9 w-9 rounded-md' />}
      />

      <PageContent>
        <PageMain>
          <div className='space-y-6'>
            {/* Task Description Section */}
            <PageSection
              header={<SectionHeader icon={FileText} title='Description' />}
            >
              <div className='space-y-2'>
                <Skeleton className='h-4 w-full' />
                <Skeleton className='h-4 w-full' />
                <Skeleton className='h-4 w-5/6' />
                <Skeleton className='h-4 w-4/5' />
              </div>
            </PageSection>
          </div>
        </PageMain>

        <PageSidebar>
          {/* Details Section */}
          <PageSection header={<SectionHeader icon={Clock} title='Details' />}>
            <div className='text-sm'>
              <table className='w-full'>
                <tbody>
                  {/* Status */}
                  <tr>
                    <td className='py-1 pr-3'>
                      <div className='flex items-center gap-2 text-muted-foreground'>
                        <ListTodo className='w-3.5 h-3.5' />
                        <span className='font-medium'>Status</span>
                      </div>
                    </td>
                    <td className='py-1'>
                      <Skeleton className='h-6 w-24 rounded-full' />
                    </td>
                  </tr>

                  {/* Priority */}
                  <tr>
                    <td className='py-1 pr-3'>
                      <div className='flex items-center gap-2 text-muted-foreground'>
                        <Flag className='w-3.5 h-3.5' />
                        <span className='font-medium'>Priority</span>
                      </div>
                    </td>
                    <td className='py-1'>
                      <Skeleton className='h-6 w-20 rounded-full' />
                    </td>
                  </tr>

                  {/* Assignee */}
                  <tr>
                    <td className='py-1 pr-3'>
                      <div className='flex items-center gap-2 text-muted-foreground'>
                        <User className='w-3.5 h-3.5' />
                        <span className='font-medium'>Assignee</span>
                      </div>
                    </td>
                    <td className='py-1'>
                      <Skeleton className='h-4 w-28' />
                    </td>
                  </tr>

                  {/* Initiative */}
                  <tr>
                    <td className='py-1 pr-3'>
                      <div className='flex items-center gap-2 text-muted-foreground'>
                        <Rocket className='w-3.5 h-3.5' />
                        <span className='font-medium'>Initiative</span>
                      </div>
                    </td>
                    <td className='py-1'>
                      <Skeleton className='h-4 w-36' />
                    </td>
                  </tr>

                  {/* Objective */}
                  <tr>
                    <td className='py-1 pr-3'>
                      <div className='flex items-center gap-2 text-muted-foreground'>
                        <Target className='w-3.5 h-3.5' />
                        <span className='font-medium'>Objective</span>
                      </div>
                    </td>
                    <td className='py-1'>
                      <Skeleton className='h-4 w-32' />
                    </td>
                  </tr>

                  {/* Estimate */}
                  <tr>
                    <td className='py-1 pr-3'>
                      <div className='flex items-center gap-2 text-muted-foreground'>
                        <Clock className='w-3.5 h-3.5' />
                        <span className='font-medium'>Estimate</span>
                      </div>
                    </td>
                    <td className='py-1'>
                      <Skeleton className='h-4 w-20' />
                    </td>
                  </tr>

                  {/* Due Date */}
                  <tr>
                    <td className='py-1 pr-3'>
                      <div className='flex items-center gap-2 text-muted-foreground'>
                        <Calendar className='w-3.5 h-3.5' />
                        <span className='font-medium'>Due</span>
                      </div>
                    </td>
                    <td className='py-1'>
                      <Skeleton className='h-4 w-24' />
                    </td>
                  </tr>

                  {/* Creator */}
                  <tr>
                    <td className='py-1 pr-3'>
                      <div className='flex items-center gap-2 text-muted-foreground'>
                        <User className='w-3.5 h-3.5' />
                        <span className='font-medium'>Creator</span>
                      </div>
                    </td>
                    <td className='py-1'>
                      <Skeleton className='h-4 w-28' />
                    </td>
                  </tr>

                  {/* Updated */}
                  <tr>
                    <td className='py-1 pr-3'>
                      <div className='flex items-center gap-2 text-muted-foreground'>
                        <Clock className='w-3.5 h-3.5' />
                        <span className='font-medium'>Updated</span>
                      </div>
                    </td>
                    <td className='py-1'>
                      <Skeleton className='h-4 w-32' />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </PageSection>

          {/* Links Section */}
          <PageSection header={<SectionHeader icon={LinkIcon} title='Links' />}>
            <div className='space-y-3'>
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className='border rounded-lg p-3 space-y-2'>
                  <Skeleton className='h-4 w-full' />
                  <Skeleton className='h-3 w-3/4' />
                  <div className='flex items-center gap-2 pt-1'>
                    <Skeleton className='h-3 w-16' />
                    <Skeleton className='h-3 w-2' />
                    <Skeleton className='h-3 w-20' />
                  </div>
                </div>
              ))}
            </div>
          </PageSection>
        </PageSidebar>
      </PageContent>
    </PageContainer>
  )
}
