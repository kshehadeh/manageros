/* eslint-disable camelcase */
/**
 * Clerk API helper utilities for tests
 * These functions use the Clerk API to create and manage test users
 * This ensures we don't leave test users in Clerk after tests complete
 */

/**
 * Clerk API client for managing users
 * Uses Clerk's REST API to create and delete test users
 */
export class ClerkTestHelper {
  private apiKey: string
  private baseUrl: string

  constructor() {
    this.apiKey = process.env.CLERK_SECRET_KEY || ''
    this.baseUrl = process.env.CLERK_API_URL || 'https://api.clerk.com/v1'

    if (!this.apiKey) {
      throw new Error(
        'CLERK_SECRET_KEY environment variable is required for tests'
      )
    }
  }

  /**
   * Create a test user in Clerk
   * Returns the Clerk user ID and a password (for testing)
   */
  async createTestUser(email: string, name: string, password?: string) {
    const testPassword = password || `TestPassword${Date.now()}!`

    const response = await fetch(`${this.baseUrl}/users`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email_address: [email],
        first_name: name.split(' ')[0] || name,
        last_name: name.split(' ').slice(1).join(' ') || '',
        password: testPassword,
        skip_password_checks: true,
        skip_password_requirement: true,
        public_metadata: {
          testUser: true,
          createdAt: new Date().toISOString(),
        },
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(
        `Failed to create Clerk user: ${response.status} ${error}`
      )
    }

    const user = await response.json()
    return { id: user.id as string, password: testPassword }
  }

  /**
   * Delete a test user from Clerk
   */
  async deleteTestUser(clerkUserId: string) {
    const response = await fetch(`${this.baseUrl}/users/${clerkUserId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
    })

    if (!response.ok && response.status !== 404) {
      const error = await response.text()
      throw new Error(
        `Failed to delete Clerk user: ${response.status} ${error}`
      )
    }
  }

  /**
   * Get a user by email
   */
  async getUserByEmail(email: string) {
    const response = await fetch(
      `${this.baseUrl}/users?email_address=${encodeURIComponent(email)}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      }
    )

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to get Clerk user: ${response.status} ${error}`)
    }

    const data = await response.json()
    return data.length > 0 ? data[0] : null
  }

  /**
   * Get a user by ID
   */
  async getUserById(clerkUserId: string) {
    const response = await fetch(`${this.baseUrl}/users/${clerkUserId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to get Clerk user: ${response.status} ${error}`)
    }

    return await response.json()
  }

  /**
   * Delete a user by email (helper method)
   */
  async deleteUserByEmail(email: string) {
    const user = await this.getUserByEmail(email)
    if (user) {
      await this.deleteTestUser(user.id)
    }
  }

  /**
   * Update user metadata in Clerk
   * This is used to sync ManagerOS user data to Clerk
   */
  async updateUserMetadata(
    clerkUserId: string,
    metadata: {
      managerOSUserId: string
      organizationId: string | null
      organizationName: string | null
      organizationSlug: string | null
      personId: string | null
      role: string
    }
  ) {
    // Use the update user endpoint with public_metadata
    const response = await fetch(`${this.baseUrl}/users/${clerkUserId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        public_metadata: metadata,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(
        `Failed to update Clerk user metadata: ${response.status} ${error}`
      )
    }

    return await response.json()
  }
}

/**
 * Singleton instance of ClerkTestHelper
 */
let clerkHelperInstance: ClerkTestHelper | null = null

export function getClerkHelper(): ClerkTestHelper {
  if (!clerkHelperInstance) {
    clerkHelperInstance = new ClerkTestHelper()
  }
  return clerkHelperInstance
}
