# Clerk JWT Template Setup for ManagerOS

This guide explains how to configure Clerk's JWT template to include ManagerOS-specific data (organization ID, user ID, etc.) in the session token.

## Overview

By default, Clerk's JWT tokens only include basic user information. To include ManagerOS-specific data like `organizationId`, `managerOSUserId`, `personId`, etc., you need to:

1. Set up a JWT template in Clerk Dashboard
2. Use the `syncUserDataToClerk()` function to populate user metadata
3. Access the data via `auth()` session claims

## Step 1: Create JWT Template in Clerk Dashboard

1. Go to your [Clerk Dashboard](https://dashboard.clerk.com)
2. Navigate to **JWT Templates** in the sidebar
3. Click **New template** or edit the default template
4. Give it a name (e.g., "ManagerOS Session")
5. In the **Token Claims** section, add the following custom claims:

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

**Important**: Make sure to use `public_metadata` (with underscore) - this is Clerk's syntax for accessing public metadata.

6. Save the template
7. **Make this template the default** for your application (or assign it to specific applications if you have multiple)

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
import { syncUserDataToClerk } from '@/lib/clerk-session-sync'

// After user joins/leaves organization
await syncUserDataToClerk(clerkUserId)
```

## Benefits

1. **Performance**: No database lookup needed - data is in the JWT token
2. **Availability**: Data is available in middleware and all server components
3. **Consistency**: Data is synced automatically via webhooks
4. **Security**: Data is signed in the JWT token

## Important Notes

- The JWT template must be configured in Clerk Dashboard for this to work
- User metadata is synced automatically, but you may need to sign out/in for changes to appear in the token
- If session claims are not available, the system falls back to database lookup
- Public metadata is readable on both frontend and backend, but only writable from backend

## Troubleshooting

### Data not appearing in session claims?

1. Verify the JWT template is saved in Clerk Dashboard
2. Check that `syncUserDataToClerk()` has been called for the user
3. User may need to sign out and sign back in to get a new token
4. Check Clerk Dashboard → Users → [User] → Metadata to verify data is synced

### Data is outdated?

- Call `syncUserDataToClerk(clerkUserId)` after any user data changes
- The webhook handlers automatically sync on user updates
- Users will get updated data on their next token refresh
