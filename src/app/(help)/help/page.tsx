import { redirect } from 'next/navigation'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Help Center | mpath',
  description: 'Browse help topics and documentation for mpath',
}

/**
 * Help index page - redirects to Mintlify documentation
 */
export default function HelpIndexPage() {
  redirect('https://help.mpath.dev')
}
