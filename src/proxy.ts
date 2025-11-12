import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse, type NextRequest } from 'next/server'

// Define public routes in a single location to avoid duplication
// Routes ending with '/' will match that path and all sub-paths
const PUBLIC_ROUTES = [
  '/',
  '/landing/',
  '/pricing',
  '/feedback-form/', // Matches /feedback-form and all sub-routes like /feedback-form/[token]
  '/auth/signin',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/reset-password',
]

// Create a matcher for public routes
const isPublicRouteMatcher = createRouteMatcher(PUBLIC_ROUTES)

// Helper to check if a pathname matches any public route (including prefix matching)
function isPublicRoute(pathname: string, req: NextRequest): boolean {
  // First check with the matcher
  if (isPublicRouteMatcher(req)) {
    return true
  }

  // Also check for routes that end with '/' - they should match all sub-paths
  return PUBLIC_ROUTES.some(route => {
    if (route.endsWith('/') && route !== '/') {
      return pathname.startsWith(route)
    }
    return false
  })
}

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl

  const response = NextResponse.next()
  response.headers.set('x-pathname', pathname)

  // Get auth state early to check for authenticated users on root path
  const authResult = await auth({ treatPendingAsSignedOut: false })
  const { userId } = authResult

  // Redirect authenticated users from root to dashboard
  if (pathname === '/' && userId) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Allow public routes without authentication
  if (isPublicRoute(pathname, req)) {
    console.log('Public route:', pathname)
    return response
  }

  // For API routes, let the route handler check auth and return 401
  // Note: auth state was already checked above for root path redirect
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
