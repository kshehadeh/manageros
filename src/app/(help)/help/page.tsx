import {
  getHelpCategories,
  getHelpContentByCategory,
} from '@/lib/help-content-loader'
import { Link } from '@/components/ui/link'
import { HelpCircle, ChevronRight, Home } from 'lucide-react'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Help Center | mpath',
  description: 'Browse help topics and documentation for mpath',
}

export default function HelpIndexPage() {
  const categories = getHelpCategories()
  const helpByCategory = categories.map(category => ({
    category,
    topics: getHelpContentByCategory(category),
  }))

  return (
    <div className='space-y-12'>
      {/* Breadcrumb Navigation */}
      <nav className='flex items-center gap-2 text-sm text-white/60'>
        <Link
          href='/'
          className='flex items-center gap-1 transition-colors hover:text-white'
        >
          <Home className='h-4 w-4' />
          Home
        </Link>
        <ChevronRight className='h-4 w-4' />
        <span className='text-white/80'>Help</span>
      </nav>
      <div className='space-y-4'>
        <div className='flex items-center gap-3'>
          <HelpCircle className='h-8 w-8 text-primary' />
          <h1 className='text-4xl font-semibold text-white'>Help Center</h1>
        </div>
        <p className='text-lg text-white/70'>
          Find answers to common questions and learn how to use mpath
          effectively.
        </p>
      </div>

      <div className='space-y-10'>
        {helpByCategory.map(({ category, topics }) => (
          <section key={category} className='space-y-4'>
            <h2 className='text-2xl font-semibold text-white border-b border-white/10 pb-2'>
              {category}
            </h2>
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
              {topics.map(topic => (
                <Link
                  key={topic.id}
                  href={`/help/${topic.id}`}
                  className='group rounded-lg border border-white/10 bg-white/5 p-6 transition-all duration-200 hover:border-white/20 hover:bg-white/10 hover:shadow-lg'
                >
                  <h3 className='text-lg font-semibold text-white mb-2 group-hover:text-primary transition-colors'>
                    {topic.title}
                  </h3>
                  {topic.category && (
                    <p className='text-sm text-white/60 mb-3'>
                      {topic.category}
                    </p>
                  )}
                  <p className='text-sm text-white/70 line-clamp-2'>
                    {topic.content.split('\n').find(line => line.trim()) ||
                      'Learn more about this topic...'}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
