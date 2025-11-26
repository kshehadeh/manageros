# Clerk Session Token Setup for ManagerOS

This guide explains how to configure Clerk's session token to include ManagerOS-specific data (organization ID, user ID, etc.) in the session claims.

## Overview

By default, Clerk's session tokens only include basic user information. To include ManagerOS-specific data like `organizationId`, `managerOSUserId`, `personId`, etc., you need to:

1. **Customize the Session Token** in Clerk Dashboard (required for `auth().sessionClaims`)
2. Use the `syncUserDataToClerk()` function to populate user metadata
3. Access the data via `auth()` session claims

## Important: Session Token vs JWT Templates

Clerk has two different concepts:

- **Session Token** (used by `auth()`): This is what's stored in cookies and used for authentication. Custom claims must be added via "Customize session token" in the Sessions page. This is what affects `auth().sessionClaims`.
- **JWT Templates** (used by `getToken()`): These are used for backend API requests, not for session tokens.

**For `auth().sessionClaims` to work, you MUST customize the Session Token, not just create a JWT Template.**

## Step 1: Customize Session Token in Clerk Dashboard

1. Go to your [Clerk Dashboard](https://dashboard.clerk.com)
2. Navigate to **Sessions** in the sidebar
3. Scroll down to **Customize session token** section
4. Click **Edit** or **Add claims** in the Claims editor
5. Add the following custom claims:

```json
{
  "managerOSUserId": "{{user.public_metadata.managerOSUserId}}",
  "organizationId": "{{user.public_metadata.organizationId}}",
  "organizationName": "{{user.public_metadata.organizationName}}",
  "organizationSlug": "{{user.public_metadata.organizationSlug}}",
  "personId": "{{user.public_metadata.personId}}",
  "role": "{{user.public_metadata.role}}"
}
```

**Important**:

- Make sure to use `public_metadata` (with underscore) - this is Clerk's syntax for accessing public metadata.
- The session token has a size limit (~1.2KB for custom claims after default claims), so keep claims small.

6. Click **Save** to apply the changes

## Alternative: JWT Templates (for API calls only)

If you need custom claims in JWT tokens for API calls (using `getToken()`), you can also create a JWT Template:

1. Go to **JWT Templates** in the sidebar
2. Click **New template** or edit the default template
3. Add the same claims as above
4. Use `getToken({ template: 'template-name' })` to get the token with custom claims

**Note**: JWT Templates do NOT affect `auth().sessionClaims` - they're only for tokens retrieved via `getToken()`.

## Step 2: How It Works

### Automatic Syncing

The system automatically syncs user data to Clerk's public metadata when:

- A user is created (via webhook)
- A user is updated (via webhook)
- A user is linked to an existing account (via `getCurrentUser()`)

### Accessing Data

Once configured, you can access the data in two ways:

#### Method 1: Via `getCurrentUser()` (Recommended)

```typescript
import { getCurrentUser } from '@/lib/auth-utils'

// This will automatically use session claims if available, or fall back to database
const user = await getCurrentUser()
console.log(user.organizationId) // Available without database lookup!
```

#### Method 2: Directly from `auth()`

```typescript
import { auth } from '@clerk/nextjs/server'

const { sessionClaims } = await auth()
const managerOSUserId = sessionClaims.managerOSUserId as string
const organizationId = sessionClaims.organizationId as string | null
```

## Step 3: Manual Syncing (If Needed)

If you need to manually sync user data (e.g., after organization changes), use:

```typescript
import { syncUserDataToClerk } from '@/lib/clerk'

// After user joins/leaves organization
await syncUserDataToClerk(clerkUserId)
```

## Benefits

1. **Performance**: No database lookup needed - data is in the JWT token
2. **Availability**: Data is available in middleware and all server components
3. **Consistency**: Data is synced automatically via webhooks
4. **Security**: Data is signed in the JWT token

## Important Notes

- **The Session Token must be customized in Clerk Dashboard** (Sessions → Customize session token) for this to work
- User metadata is synced automatically, but you may need to sign out/in for changes to appear in the token
- If session claims are not available, the system falls back to database lookup
- Public metadata is readable on both frontend and backend, but only writable from backend
- Session token size is limited to ~4KB total (including default claims), so custom claims should be kept small

## Troubleshooting

### Data not appearing in session claims?

1. **Verify the Session Token is customized** in Clerk Dashboard (Sessions → Customize session token)
   - ⚠️ **Important**: Creating a JWT Template alone is NOT enough - you must customize the Session Token
2. Check that `syncUserDataToClerk()` has been called for the user
3. User may need to sign out and sign back in to get a new token with custom claims
4. Check Clerk Dashboard → Users → [User] → Metadata to verify data is synced to public metadata
5. Check the browser console - the `console.log(sessionClaims)` in `getCurrentUser()` will show what claims are available

### Data is outdated?

- Call `syncUserDataToClerk(clerkUserId)` after any user data changes
- The webhook handlers automatically sync on user updates
- Users will get updated data on their next token refresh
