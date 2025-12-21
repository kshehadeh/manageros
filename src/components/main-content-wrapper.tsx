'use client'

import { ReactNode } from 'react'

interface MainContentWrapperProps {
  children: ReactNode
}

export function MainContentWrapper({ children }: MainContentWrapperProps) {
  // No margin needed - sidebar will push content when it's relative on desktop
  // Make this a container for container queries so child elements can respond to available width
  return (
    <div className='flex-1 flex flex-col overflow-hidden lg:ml-0 @container'>
      {children}
    </div>
  )
}
