/**
 * Gets the base URL for the application from the incoming request
 * Uses x-forwarded-proto and host headers to determine the actual URL
 * clients are using to connect (important for OAuth flows behind proxies)
 *
 * @param request - Optional Request object to derive URL from
 * @returns The base URL for the application
 */
export function getBaseUrlFromRequest(request: Request): string {
  const headers = request.headers

  // Get protocol from x-forwarded-proto header (set by proxies/load balancers)
  // Default to https in production, http otherwise
  const forwardedProto = headers.get('x-forwarded-proto')
  const protocol =
    forwardedProto || (process.env.NODE_ENV === 'production' ? 'https' : 'http')

  // Get host from x-forwarded-host or host header
  const forwardedHost = headers.get('x-forwarded-host')
  const host = forwardedHost || headers.get('host') || 'localhost:3000'

  return `${protocol}://${host}`
}

/**
 * Gets the base URL for the application
 * Priority order:
 * 1. VERCEL_PROJECT_PRODUCTION_URL (production domain on Vercel)
 * 2. NEXTAUTH_URL (explicitly set, should include protocol)
 * 3. VERCEL_URL (automatically set by Vercel, needs https:// prefix)
 * 4. Production fallback (if in production)
 * 5. Localhost (development only)
 * @returns The base URL for the application
 */
export function getBaseUrl(): string {
  // Check VERCEL_PROJECT_PRODUCTION_URL first (production domain)
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  }

  // Check VERCEL_URL (automatically set by Vercel, needs https:// prefix)
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  // Production fallback
  if (process.env.NODE_ENV === 'production') {
    return 'https://www.mpath.dev'
  }

  // Development fallback
  return 'http://localhost:3000'
}
