import { ClerkClient, createClerkClient } from '@clerk/backend'
import type {
  ClerkCommercePlan,
  ClerkBillingPlansResponse,
} from './clerk-types'

let globalClerkClient: ClerkClient | null = null

export function getClerkClient(): ClerkClient {
  if (!globalClerkClient) {
    globalClerkClient = createClerkClient({
      secretKey: process.env.CLERK_SECRET_KEY || '',
    })
  }
  return globalClerkClient
}

const CLERK_API_BASE = 'https://api.clerk.com/v1'

/**
 * Fetch all billing plans from Clerk
 * Returns plans sorted by price (free first, then by ascending price)
 */
export async function getClerkBillingPlans(): Promise<ClerkCommercePlan[]> {
  if (!process.env.CLERK_SECRET_KEY) {
    console.warn('CLERK_SECRET_KEY not configured, cannot fetch billing plans')
    return []
  }

  try {
    const response = await fetch(
      `${CLERK_API_BASE}/billing/plans?payer_type=org`,
      {
        headers: {
          Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
        },
        next: { revalidate: 3600 }, // Cache for 1 hour
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error(
        `Failed to fetch Clerk billing plans: ${response.status} ${errorText}`
      )
      return []
    }

    const data = (await response.json()) as ClerkBillingPlansResponse

    // Sort plans: free plans first, then by ascending price
    return data.data
      .filter(plan => plan.publicly_visible)
      .sort((a, b) => {
        // Free plans (fee.amount === 0) come first
        if (a.fee.amount === 0 && b.fee.amount !== 0) return -1
        if (a.fee.amount !== 0 && b.fee.amount === 0) return 1
        // Then sort by price ascending
        return a.fee.amount - b.fee.amount
      })
  } catch (error) {
    console.error('Error fetching Clerk billing plans:', error)
    return []
  }
}
