import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// Define public routes in a single location to avoid duplication
const PUBLIC_ROUTES = [
  '/',
  '/landing/',
  '/feedback-form/',
  '/auth/signin',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/reset-password',
]

// Create a matcher for public routes
const isPublicRouteMatcher = createRouteMatcher(PUBLIC_ROUTES)

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl

  const response = NextResponse.next()
  response.headers.set('x-pathname', pathname)

  // Allow public routes without authentication
  if (isPublicRouteMatcher(req)) {
    console.log('Public route:', pathname)
    return response
  }

  // Get auth state - this sets up the auth context
  const authResult = await auth({ treatPendingAsSignedOut: false })
  const { userId } = authResult

  // For API routes, let the route handler check auth and return 401
  // The auth context is now available for the route handler
  if (pathname.startsWith('/api/')) {
    return response
  }

  // For non-API routes, redirect to sign-in if not authenticated
  if (!userId) {
    const signInUrl = new URL('/auth/signin', req.url)
    signInUrl.searchParams.set('redirect_url', pathname)
    return NextResponse.redirect(signInUrl)
  }

  return response
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
