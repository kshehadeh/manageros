/**
 * Organization-related types
 */

export interface PendingInvitation {
  id: string
  email: string
  organizationId: string
  status: 'pending' | 'accepted' | 'revoked' | 'expired'
  expiresAt: string
  createdAt: string
  updatedAt: string
  acceptedAt: string | null
  organization: {
    id: string
    clerkOrganizationId: string
    description: string | null
    name: string // Organization name from Clerk
  }
  invitedBy: {
    name: string
    email: string
  }
}
