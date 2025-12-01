import { getHelpContent, getAllHelpContent } from '@/lib/help-content-loader'
import { HelpMarkdownRenderer } from '@/components/help/help-markdown-renderer'
import { Link } from '@/components/ui/link'
import { ChevronRight, HelpCircle } from 'lucide-react'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'

interface HelpTopicPageProps {
  params: Promise<{ id: string }>
}

export async function generateStaticParams() {
  const allHelp = getAllHelpContent()
  return allHelp.map(topic => ({
    id: topic.id,
  }))
}

export async function generateMetadata({
  params,
}: HelpTopicPageProps): Promise<Metadata> {
  const { id } = await params
  const helpContent = getHelpContent(id)

  if (!helpContent) {
    return {
      title: 'Help Topic Not Found | mpath',
    }
  }

  return {
    title: `${helpContent.title} | Help Center | mpath`,
    description:
      helpContent.content
        .split('\n')
        .find(line => line.trim() && !line.startsWith('#'))
        ?.substring(0, 160) || `Learn about ${helpContent.title}`,
  }
}

export default async function HelpTopicPage({ params }: HelpTopicPageProps) {
  const { id } = await params
  const helpContent = getHelpContent(id)

  if (!helpContent) {
    notFound()
  }

  return (
    <div className='space-y-8'>
      {/* Breadcrumb Navigation */}
      <nav className='flex items-center gap-2 text-sm text-white/60'>
        <Link href='/' className='transition-colors hover:text-white'>
          Home
        </Link>
        <ChevronRight className='h-4 w-4' />
        <Link href='/help' className='transition-colors hover:text-white'>
          Help
        </Link>
        <ChevronRight className='h-4 w-4' />
        <span className='text-white/80'>{helpContent.title}</span>
      </nav>

      {/* Help Content */}
      <article className='space-y-6'>
        <header className='space-y-2'>
          <div className='flex items-center gap-3'>
            <HelpCircle className='h-6 w-6 text-primary' />
            <h1 className='text-3xl font-semibold text-white'>
              {helpContent.title}
            </h1>
          </div>
          {helpContent.category && (
            <p className='text-base text-white/60'>
              Category: {helpContent.category}
            </p>
          )}
        </header>

        <div className='rounded-lg border border-white/10 bg-white/5 p-8'>
          <HelpMarkdownRenderer content={helpContent.content} />
        </div>
      </article>
    </div>
  )
}
