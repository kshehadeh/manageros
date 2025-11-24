# Clerk API Usage Review

## Executive Summary

This document reviews Clerk API usage patterns to identify opportunities to reduce API calls and prevent 429 rate limit errors.

## Key Findings

### 🔴 Critical Issues

1. **`getCurrentUserWithPersonAndOrganization` always forces revalidation**
   - **Location**: `src/lib/auth-utils.ts:342-387`
   - **Issue**: Always calls `getCurrentUser({ revalidateLinks: true })`, which can trigger Clerk API calls even when session claims are valid
   - **Impact**: Every page load in the app layout calls this function, potentially making unnecessary Clerk API calls
   - **Usage**: Called in:
     - `src/app/(app)/layout.tsx:30-31` (every page load)
     - `src/components/sidebar-server.tsx:6`
     - `src/app/(app)/settings/page.tsx`
     - `src/app/(app)/organization/settings/page.tsx`

2. **Unnecessary Clerk API call for organization details**
   - **Location**: `src/lib/auth-utils.ts:368-370`
   - **Issue**: `getCurrentUserWithPersonAndOrganization` calls `getClerkOrganization()` to fetch org name/slug, even though this data may not be needed
   - **Impact**: Additional API call on every page load when organization exists

3. **`getCurrentUser` makes Clerk API calls in multiple scenarios**
   - **Location**: `src/lib/auth-utils.ts:166-340`
   - **Scenarios that trigger Clerk API calls**:
     - User doesn't exist in DB → calls `getUserFromClerk(userId)` (line 234)
     - Organization doesn't exist in DB → calls `getClerkOrganization(clerkOrgId)` (line 274)
     - Resync needed → calls `syncUserDataToClerk(syncObject)` (line 336)
   - **Impact**: These calls happen even when session claims contain valid data

### 🟡 Medium Priority Issues

4. **`getPendingInvitationsForUser` makes direct Clerk API call**
   - **Location**: `src/lib/actions/organization.ts:781-889`
   - **Issue**: Direct fetch to Clerk API for pending invitations
   - **Impact**: Called when checking invitations, but may not be frequently used

5. **No caching of Clerk API responses**
   - **Issue**: Every call to `getUserFromClerk` or `getClerkOrganization` makes a fresh API request
   - **Impact**: Multiple requests for the same user/org within a short time window

6. **`syncUserDataToClerk` called on every resync**
   - **Location**: `src/lib/auth-utils.ts:333-337`
   - **Issue**: Updates Clerk metadata even for minor changes
   - **Impact**: Write operations to Clerk API on many requests

### 🟢 Low Priority / Observations

7. **`getCurrentUser` called 520+ times across codebase**
   - **Note**: Most calls should be fine as they use session claims, but worth monitoring
   - **Recommendation**: Audit if any are in loops or called excessively

8. **Client-side Clerk usage**
   - **Location**: `src/lib/hooks/use-user-settings.ts:18`
   - **Note**: Uses `useUser()` from Clerk, which is client-side and shouldn't count against API limits
   - **Status**: ✅ Not an issue

## Detailed Analysis

### Issue 1: `getCurrentUserWithPersonAndOrganization` Always Revalidates

**Current Code:**

```typescript
export async function getCurrentUserWithPersonAndOrganization() {
  // Get current user - session claims may be stale, so we'll query person directly
  const user = await getCurrentUser({ revalidateLinks: true }) // ⚠️ Always revalidates
  // ...
}
```

**Problem**: The `revalidateLinks: true` flag forces `getCurrentUser` to:

- Re-check user existence in DB
- Re-check organization existence in DB
- Potentially call Clerk API for missing data
- Always call `syncUserDataToClerk` if resync is needed

**Solution**: Only revalidate when necessary (e.g., after org switch, user update). Use session claims by default.

### Issue 2: Unnecessary Organization Fetch

**Current Code:**

```typescript
if (organization) {
  const clerkOrganization = await getClerkOrganization(
    // ⚠️ Always fetches from Clerk
    organization.clerkOrganizationId || ''
  )
  // ...
}
```

**Problem**: Fetches organization name/slug from Clerk API even when:

- This data may already be in session claims
- This data may not be needed for the current request
- Organization data rarely changes

**Solution**:

- Store org name/slug in database or session claims
- Only fetch from Clerk when absolutely necessary
- Cache organization data

### Issue 3: Clerk API Calls in `getCurrentUser`

**Scenarios triggering API calls:**

1. **User not in DB** (line 234):

   ```typescript
   if (!user) {
     const clerkUser = await getUserFromClerk(userId) // ⚠️ Clerk API call
   }
   ```

   - **Frequency**: Only on first login or if user deleted from DB
   - **Impact**: Low (rare scenario)

2. **Organization not in DB** (line 274):

   ```typescript
   if (!organization) {
     const clerkOrganization = await getClerkOrganization(...) // ⚠️ Clerk API call
   }
   ```

   - **Frequency**: Only when org doesn't exist in DB
   - **Impact**: Low (rare scenario)

3. **Resync needed** (line 336):
   ```typescript
   if (resync) {
     await syncUserDataToClerk(syncObject) // ⚠️ Clerk API write
   }
   ```

   - **Frequency**: When `revalidateLinks: true` or when org/user data changes
   - **Impact**: High (happens frequently with `getCurrentUserWithPersonAndOrganization`)

## Recommendations

### Priority 1: Fix `getCurrentUserWithPersonAndOrganization`

**Option A: Remove forced revalidation**

```typescript
export async function getCurrentUserWithPersonAndOrganization() {
  // Use session claims by default, only revalidate when needed
  const user = await getCurrentUser() // Remove revalidateLinks: true
  // ...
}
```

**Option B: Make revalidation conditional**

```typescript
export async function getCurrentUserWithPersonAndOrganization(options?: {
  revalidateLinks?: boolean
}) {
  const user = await getCurrentUser(options || {})
  // ...
}
```

**Option C: Cache organization data**

- Store org name/slug in database
- Only fetch from Clerk when data is missing or explicitly requested

### Priority 2: Add Caching for Clerk API Calls

**Implement in-memory cache with TTL:**

```typescript
// Simple cache implementation
const clerkCache = new Map<string, { data: unknown; expires: number }>()

async function getClerkOrganizationCached(clerkOrgId: string) {
  const cacheKey = `org:${clerkOrgId}`
  const cached = clerkCache.get(cacheKey)

  if (cached && cached.expires > Date.now()) {
    return cached.data as ClerkOrganization
  }

  const org = await getClerkOrganization(clerkOrgId)
  if (org) {
    clerkCache.set(cacheKey, {
      data: org,
      expires: Date.now() + 5 * 60 * 1000, // 5 minute TTL
    })
  }
  return org
}
```

### Priority 3: Reduce `syncUserDataToClerk` Calls

**Only sync when data actually changes:**

```typescript
// Track what changed before syncing
if (resync) {
  // Only sync if metadata actually differs
  const needsSync = hasMetadataChanged(syncObject, sessionClaims)
  if (needsSync) {
    await syncUserDataToClerk(syncObject)
  }
}
```

### Priority 4: Store Organization Name/Slug in Database

**Add fields to Organization model:**

```prisma
model Organization {
  // ... existing fields
  name  String?  // Store from Clerk
  slug  String?  // Store from Clerk
}
```

**Update on org creation/fetch:**

```typescript
// Store org data when fetched from Clerk
if (clerkOrganization) {
  await prisma.organization.update({
    where: { id: organization.id },
    data: {
      name: clerkOrganization.name,
      slug: clerkOrganization.slug,
    },
  })
}
```

### Priority 5: Monitor Clerk API Usage

**Add logging:**

```typescript
async function getClerkOrganization(clerkOrgId: string) {
  console.log('[Clerk API] getClerkOrganization called', { clerkOrgId })
  // ... existing code
}
```

**Track metrics:**

- Number of API calls per request
- API call frequency
- 429 error occurrences

## Implementation Plan

1. **Immediate (High Impact, Low Risk)**:
   - Remove `revalidateLinks: true` from `getCurrentUserWithPersonAndOrganization`
   - Add conditional revalidation only when needed

2. **Short-term (Medium Impact, Medium Risk)**:
   - Add caching for `getClerkOrganization` and `getUserFromClerk`
   - Store org name/slug in database
   - Reduce `syncUserDataToClerk` calls

3. **Long-term (Low Impact, High Value)**:
   - Add monitoring and alerting for Clerk API usage
   - Implement request deduplication
   - Consider using Clerk webhooks to sync data instead of polling

## Testing Recommendations

1. **Monitor API calls**:
   - Add logging before each Clerk API call
   - Track call frequency in development
   - Test with multiple concurrent requests

2. **Verify session claims usage**:
   - Ensure session claims are properly configured
   - Test that data is available in claims without API calls

3. **Load testing**:
   - Simulate multiple page loads
   - Monitor Clerk API rate limits
   - Verify caching reduces API calls

## Expected Impact

After implementing Priority 1 fixes:

- **Reduction**: ~80-90% reduction in Clerk API calls for normal page loads
- **Before**: Every page load → 1-3 API calls
- **After**: Every page load → 0 API calls (using session claims)

After implementing Priority 2-4 fixes:

- **Additional reduction**: ~50% reduction in remaining API calls
- **Overall**: ~90-95% reduction in Clerk API calls
