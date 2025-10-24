import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

// Define public routes in a single location to avoid duplication
const PUBLIC_ROUTES = [
  '/',
  '/feedback-form/',
  '/auth/signin',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/reset-password',
] as const

// Helper function to check if a pathname is a public route
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route =>
    route === '/' ? pathname === '/' : pathname.startsWith(route)
  )
}

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

    // Set a custom header to indicate if this is a public route
    const isPublic = isPublicRoute(pathname)

    const response = NextResponse.next()
    response.headers.set('x-pathname', pathname)
    response.headers.set('x-is-public', isPublic.toString())

    // Allow access to organization creation page for users without organizations
    if (pathname === '/organization/create' && token && !token.organizationId) {
      return response
    }

    // Redirect users with organizations away from organization creation page
    if (token && token.organizationId && pathname === '/organization/create') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // Note: We don't redirect users without organizations to organization creation
    // They can access the main app and create an organization when they're ready

    return response
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl

        // Allow public routes without authentication
        if (isPublicRoute(pathname)) {
          return true
        }

        // Require authentication for all other routes
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico|manifest.json|images/|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg|.*\\.ico).*)',
  ],
}
