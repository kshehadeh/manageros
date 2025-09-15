import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

    // Allow access to organization creation page for users without organizations
    if (pathname === '/organization/create' && token && !token.organizationId) {
      return NextResponse.next()
    }

    // Redirect users with organizations away from organization creation page
    if (token && token.organizationId && pathname === '/organization/create') {
      return NextResponse.redirect(new URL('/', req.url))
    }

    // Note: We don't redirect users without organizations to organization creation
    // They can access the main app and create an organization when they're ready
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: [
    '/((?!api/auth|auth/signin|auth/signup|organization/create|_next/static|_next/image|favicon.ico).*)',
  ],
}
