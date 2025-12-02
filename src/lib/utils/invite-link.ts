import { randomBytes } from 'crypto'
import { getBaseUrl } from './url-utils'

/**
 * Generates a unique invite link token for feedback campaigns
 * @returns A cryptographically secure random string
 */
export function generateInviteLinkToken(): string {
  return randomBytes(32).toString('hex')
}

/**
 * Generates a full invite link URL for a feedback campaign
 * @param token The invite link token
 * @returns The full URL for the invite link
 */
export function generateInviteLinkUrl(token: string): string {
  const baseUrl = getBaseUrl()
  return `${baseUrl}/feedback-form/${token}`
}
