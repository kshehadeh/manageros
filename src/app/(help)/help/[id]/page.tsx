import { redirect } from 'next/navigation'
import { Metadata } from 'next'

interface HelpTopicPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({
  params,
}: HelpTopicPageProps): Promise<Metadata> {
  const { id } = await params

  return {
    title: `Help Topic | Help Center | mpath`,
    description: `View help documentation for ${id}`,
  }
}

/**
 * Help topic page - redirects to Mintlify documentation
 */
export default async function HelpTopicPage({ params }: HelpTopicPageProps) {
  const { id } = await params
  redirect(`https://help.mpath.dev/${id}`)
}
