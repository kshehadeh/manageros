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
