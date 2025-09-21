import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

    // Set a custom header to indicate if this is a public route
    const isPublicRoute =
      pathname.startsWith('/feedback-form/') ||
      pathname.startsWith('/auth/signin') ||
      pathname.startsWith('/auth/signup')

    const response = NextResponse.next()
    response.headers.set('x-pathname', pathname)
    response.headers.set('x-is-public', isPublicRoute.toString())

    // Allow access to organization creation page for users without organizations
    if (pathname === '/organization/create' && token && !token.organizationId) {
      return response
    }

    // Redirect users with organizations away from organization creation page
    if (token && token.organizationId && pathname === '/organization/create') {
      return NextResponse.redirect(new URL('/', req.url))
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
        const isPublicRoute =
          pathname.startsWith('/feedback-form/') ||
          pathname.startsWith('/auth/signin') ||
          pathname.startsWith('/auth/signup')

        if (isPublicRoute) {
          return true
        }

        // Require authentication for all other routes
        return !!token
      },
    },
  }
)

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
}
