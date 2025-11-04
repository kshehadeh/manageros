import { getReportInstance } from '@/lib/actions/report'
import { requireAuth } from '@/lib/auth-utils'
import ReactMarkdown from 'react-markdown'
import { ReportInstanceBreadcrumbClient } from '@/components/report-instance-breadcrumb-client'
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
  await requireAuth({ requireOrganization: true })
  const instance = await getReportInstance((await params).id)

  const markdown = (instance as { outputMarkdown?: string }).outputMarkdown
  const isWebRenderer = instance.renderer === 'web'

  return (
    <ReportInstanceBreadcrumbClient
      reportName={instance.reportName}
      instanceId={instance.id}
    >
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
    </ReportInstanceBreadcrumbClient>
  )
}
