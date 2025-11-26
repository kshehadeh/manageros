import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

// Cookie name for tracking organization removal
const ORG_REMOVED_COOKIE = 'manageros_org_removed'

/**
 * Route handler that sets a cookie to indicate the user was removed from an organization
 * and redirects to the organization setup page.
 *
 * This is called when getCurrentUser detects org removal but can't set cookies
 * (because it's called from server components where cookies are read-only).
 */
export async function GET() {
  const cookieStore = await cookies()
  try {
    cookieStore.set(ORG_REMOVED_COOKIE, 'true', {
      maxAge: 60, // 1 minute - just long enough for the redirect
      path: '/',
      httpOnly: false, // Allow client-side access
      sameSite: 'lax',
    })
  } catch (error) {
    // If cookie setting fails, still redirect - the page will work without the cookie
    console.error('Failed to set org-removed cookie:', error)
  }

  redirect('/organization/new')
}
