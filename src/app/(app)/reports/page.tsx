import { redirect } from 'next/navigation'
import { listAvailableReports, listReportInstances } from '@/lib/actions/report'
import { getCurrentUser, getActionPermission } from '@/lib/auth-utils'
import { Link } from '@/components/ui/link'
import { BarChart3 } from 'lucide-react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import { HelpIcon } from '@/components/help-icon'

// Map report codeId to help documentation ID
const reportHelpMap: Record<string, string> = {
  'person-overview': 'person-overview-report',
  'person-ai-synopsis': 'ai-synopsis-report',
}

export default async function ReportsPage() {
  const user = await getCurrentUser()
  const canAccess = await getActionPermission(user, 'report.access')
  if (!canAccess) {
    redirect('/dashboard')
  }
  const [reports, recent] = await Promise.all([
    listAvailableReports(),
    listReportInstances(10),
  ])

  return (
    <div className='p-6 space-y-8'>
      <div>
        <div className='flex items-center gap-3 mb-2'>
          <BarChart3 className='h-8 w-8 text-muted-foreground' />
          <h1 className='text-2xl font-semibold'>Reports</h1>
          <HelpIcon helpId='reports' size='lg' />
        </div>
        <p className='text-muted-foreground'>
          Run data reports and view recent runs
        </p>
      </div>

      <section className='space-y-4'>
        <h2 className='text-xl font-medium'>Available reports</h2>
        <div className='grid gap-4 md:grid-cols-2'>
          {reports.map(r => (
            <Card key={r.codeId} className='hover:shadow-md transition-shadow'>
              <CardHeader>
                <div className='flex items-start justify-between'>
                  <div className='flex-1'>
                    <CardTitle className='text-lg'>{r.name}</CardTitle>
                    {r.description && (
                      <CardDescription>{r.description}</CardDescription>
                    )}
                  </div>
                  {reportHelpMap[r.codeId] && (
                    <HelpIcon
                      helpId={reportHelpMap[r.codeId]}
                      size='md'
                      className='ml-2 flex-shrink-0'
                    />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <Button asChild className='w-full'>
                  <Link href={`/reports/${r.codeId}/run`}>Run Report</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className='space-y-4'>
        <h2 className='text-xl font-medium'>Recent runs</h2>
        {recent.length === 0 ? (
          <div className='text-center py-8'>
            <p className='text-muted-foreground'>No recent report runs</p>
          </div>
        ) : (
          <div className='rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Date Run</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent.map(i => (
                  <TableRow
                    key={i.id}
                    className='hover:bg-accent/50 cursor-pointer'
                  >
                    <TableCell className='font-medium'>
                      <div className='space-y-1'>
                        <Link
                          href={`/reports/instances/${i.id}`}
                          className='hover:text-highlight transition-colors'
                        >
                          {i.reportName}
                        </Link>
                        {i.identifierText && (
                          <div className='text-xs text-muted-foreground'>
                            {i.identifierText}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className='text-muted-foreground'>
                      {new Date(i.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          i.status === 'completed'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : i.status === 'failed'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        }`}
                      >
                        {i.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  )
}
