import { getReportInstance } from '@/lib/actions/report'
import ReactMarkdown from 'react-markdown'
import { PageBreadcrumbSetter } from '@/components/page-breadcrumb-setter'
import { DeleteReportButton } from '@/components/delete-report-button'
import {
  PersonOverviewWebRenderer,
  type PersonOverviewWebRendererProps,
} from '@/components/reports/person-overview-web-renderer'

export default async function ReportInstancePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const instance = await getReportInstance(id)

  const markdown = (instance as { outputMarkdown?: string }).outputMarkdown
  const isWebRenderer = instance.renderer === 'web'

  const pathname = `/reports/instances/${instance.id}`
  const breadcrumbs = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Reports', href: '/reports' },
    { name: instance.reportName, href: pathname },
  ]

  return (
    <PageBreadcrumbSetter breadcrumbs={breadcrumbs}>
      <div className='p-6 space-y-6'>
        <div className='flex items-start justify-between'>
          <div>
            <h1 className='text-2xl font-semibold'>{instance.reportName}</h1>
            <p className='text-muted-foreground'>
              Ran at {new Date(instance.createdAt).toLocaleString()}
            </p>
          </div>
          <DeleteReportButton instanceId={instance.id} />
        </div>

        {isWebRenderer && instance.reportCodeId === 'person-overview' ? (
          <PersonOverviewWebRenderer
            output={instance.output as PersonOverviewWebRendererProps['output']}
          />
        ) : markdown ? (
          <section className='prose max-w-none dark:prose-invert'>
            <ReactMarkdown>{markdown}</ReactMarkdown>
          </section>
        ) : null}
      </div>
    </PageBreadcrumbSetter>
  )
}
