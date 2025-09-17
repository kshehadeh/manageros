'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'

export default function Navigation() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <header className='flex items-center justify-between mb-6'>
        <h1 className='text-xl font-semibold'>ManagerOS</h1>
        <div className='text-sm text-gray-500'>Loading...</div>
      </header>
    )
  }

  if (!session) {
    return (
      <header className='flex items-center justify-between mb-6'>
        <h1 className='text-xl font-semibold'>ManagerOS</h1>
        <nav className='flex gap-3 text-sm'>
          <Link href='/auth/signin' className='btn'>
            Sign In
          </Link>
          <Link href='/auth/signup' className='btn'>
            Sign Up
          </Link>
        </nav>
      </header>
    )
  }

  return (
    <header className='flex items-center justify-between mb-6'>
      <div>
        <h1 className='text-xl font-semibold'>ManagerOS</h1>
        <p className='text-sm text-gray-600'>
          {session.user.organizationName} • {session.user.name} (
          {session.user.role})
        </p>
      </div>
      <nav className='flex gap-3 text-sm'>
        <Link href='/' className='btn'>
          Home
        </Link>
        <Link href='/initiatives' className='btn'>
          Initiatives
        </Link>
        <Link href='/people' className='btn'>
          People
        </Link>
        <Link href='/teams' className='btn'>
          Teams
        </Link>
        <Link href='/oneonones' className='btn'>
          1:1s
        </Link>
        <Link href='/feedback' className='btn'>
          Feedback
        </Link>
        {session.user.role === 'ADMIN' && (
          <Link href='/organization/invitations' className='btn'>
            Invitations
          </Link>
        )}
        <button
          onClick={() => signOut()}
          className='btn text-red-600 hover:text-red-700'
        >
          Sign Out
        </button>
      </nav>
    </header>
  )
}
