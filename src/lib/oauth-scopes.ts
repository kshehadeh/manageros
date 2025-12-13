import type { PermissionType } from './auth-utils'

/**
 * OAuth scope definitions that map to ManagerOS permissions
 * These scopes are used when creating OAuth applications in Clerk Dashboard
 */
export const OAUTH_SCOPES = {
  // People scopes
  'read:people': {
    description: 'Read people data',
    permissions: ['person.view'] as PermissionType[],
  },
  'write:people': {
    description: 'Create, update, and delete people',
    permissions: [
      'person.create',
      'person.edit',
      'person.delete',
    ] as PermissionType[],
  },
  // Task scopes
  'read:tasks': {
    description: 'Read tasks',
    permissions: ['task.view'] as PermissionType[],
  },
  'write:tasks': {
    description: 'Create, update, and delete tasks',
    permissions: [
      'task.create',
      'task.edit',
      'task.delete',
    ] as PermissionType[],
  },
  // Initiative scopes
  'read:initiatives': {
    description: 'Read initiatives',
    permissions: ['initiative.view'] as PermissionType[],
  },
  'write:initiatives': {
    description: 'Create, update, and delete initiatives',
    permissions: [
      'initiative.create',
      'initiative.edit',
      'initiative.delete',
    ] as PermissionType[],
  },
  // Meeting scopes
  'read:meetings': {
    description: 'Read meetings',
    permissions: ['meeting.view'] as PermissionType[],
  },
  'write:meetings': {
    description: 'Create, update, and delete meetings',
    permissions: [
      'meeting.create',
      'meeting.edit',
      'meeting.delete',
    ] as PermissionType[],
  },
  // Admin scope
  admin: {
    description: 'Full admin access (organization admins only)',
    permissions: [
      // This scope grants all permissions - checked separately in validation
    ] as PermissionType[],
  },
} as const

export type OAuthScope = keyof typeof OAUTH_SCOPES

/**
 * Get all available OAuth scopes
 */
export function getAvailableScopes(): OAuthScope[] {
  return Object.keys(OAUTH_SCOPES) as OAuthScope[]
}

/**
 * Get permissions for a given scope
 */
export function getPermissionsForScope(scope: OAuthScope): PermissionType[] {
  return OAUTH_SCOPES[scope].permissions
}

/**
 * Get permissions for multiple scopes
 */
export function getPermissionsForScopes(scopes: string[]): PermissionType[] {
  const permissions = new Set<PermissionType>()

  for (const scope of scopes) {
    if (scope === 'admin') {
      // Admin scope grants all permissions - return all
      return getAllPermissions()
    }

    if (scope in OAUTH_SCOPES) {
      const scopePermissions = getPermissionsForScope(scope as OAuthScope)
      scopePermissions.forEach(perm => permissions.add(perm))
    }
  }

  return Array.from(permissions)
}

/**
 * Get all available permissions (for admin scope)
 */
function getAllPermissions(): PermissionType[] {
  return [
    'task.create',
    'task.edit',
    'task.delete',
    'task.view',
    'meeting.create',
    'meeting.edit',
    'meeting.delete',
    'meeting.view',
    'person.create',
    'person.import',
    'person.edit',
    'person.delete',
    'person.view',
    'meeting-instance.create',
    'meeting-instance.edit',
    'meeting-instance.delete',
    'meeting-instance.view',
    'initiative.create',
    'initiative.edit',
    'initiative.delete',
    'initiative.view',
    'report.access',
    'report.create',
    'report.edit',
    'report.delete',
    'report.view',
    'feedback.create',
    'feedback.edit',
    'feedback.delete',
    'feedback.view',
    'oneonone.create',
    'oneonone.edit',
    'oneonone.delete',
    'oneonone.view',
    'feedback-campaign.create',
    'feedback-campaign.edit',
    'feedback-campaign.delete',
    'feedback-campaign.view',
    'user.link-person',
    'person.overview.view',
    'job-role.create',
    'job-role.edit',
    'job-role.delete',
    'job-role.view',
    'organization.invitation.view',
    'note.create',
    'note.edit',
    'note.delete',
    'note.view',
  ]
}

/**
 * Check if a scope string is valid
 */
export function isValidScope(scope: string): scope is OAuthScope {
  return scope in OAUTH_SCOPES
}

/**
 * Parse scope string (space-separated) into array of scopes
 */
export function parseScopes(scopeString: string): OAuthScope[] {
  return scopeString
    .split(' ')
    .filter(scope => scope.trim().length > 0)
    .filter(isValidScope)
}

/**
 * Check if token has required scope for a permission
 */
export function hasScopeForPermission(
  tokenScopes: string[],
  requiredPermission: PermissionType
): boolean {
  // Admin scope grants all permissions
  if (tokenScopes.includes('admin')) {
    return true
  }

  // Check if any scope grants the required permission
  const permissions = getPermissionsForScopes(tokenScopes)
  return permissions.includes(requiredPermission)
}
