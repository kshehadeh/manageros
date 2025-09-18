'use client'

import Breadcrumb from './breadcrumb'

export default function TopBar() {
  return (
    <header className='h-16 bg-neutral-900 border-b border-neutral-800 px-6 flex items-center'>
      <Breadcrumb />
    </header>
  )
}
