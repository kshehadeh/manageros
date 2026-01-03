'use server'

/**
 * Map ManagerOS role to Clerk organization role
 */
export async function mapManagerOSRoleToClerkRole(
  role: 'OWNER' | 'ADMIN' | 'USER'
): Promise<'org:admin' | 'org:member'> {
  if (role === 'OWNER' || role === 'ADMIN') {
    return 'org:admin'
  }
  return 'org:member'
}

export async function mapClerkRoleToManagerOSRole(
  clerkRole: 'org:admin' | 'org:member',
  isBillingUser: boolean = false
): Promise<'OWNER' | 'ADMIN' | 'USER'> {
  if (clerkRole === 'org:admin') {
    return isBillingUser ? 'OWNER' : 'ADMIN'
  }
  return 'USER'
}
