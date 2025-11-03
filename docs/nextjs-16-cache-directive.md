# Next.js 16 "use cache" Directive for Database Queries

## Overview

Next.js 16 introduces the `"use cache"` directive as the **recommended way** to cache database queries and expensive computations. This provides a cleaner, more intuitive API than `unstable_cache` for persistent, global caching across requests.

**Important:** This feature requires enabling `cacheComponents: true` in `next.config.ts`.

## Key Features

- **Simpler syntax**: Just add `"use cache"` at the top of functions
- **Automatic caching**: Functions are automatically cached based on their parameters
- **Tag-based invalidation**: Use `cacheTag()` to tag entries for selective invalidation
- **Time-based revalidation**: Use `cacheLife()` to set expiration profiles
- **Persistent global cache**: Results are cached across requests (unlike React's `cache()`)

## Configuration

Enable Cache Components in `next.config.ts`:

```typescript
const nextConfig: NextConfig = {
  experimental: {
    cacheComponents: true,
  },
}
```

This enables the `"use cache"` directive and all related APIs (`cacheLife`, `cacheTag`, etc.).

## Basic Usage

### Function-Level Caching

Add `"use cache"` at the top of async functions that query the database:

```typescript
export async function getPersonById(id: string) {
  'use cache'

  const user = await getCurrentUser()

  if (!user.organizationId) {
    return null
  }

  return await prisma.person.findFirst({
    where: { id, organizationId: user.organizationId },
  })
}
```

### Adding Cache Tags

Use `cacheTag()` to tag cache entries for selective invalidation:

```typescript
import { cacheTag } from 'next/cache'

export async function getPersonById(id: string) {
  'use cache'

  const user = await getCurrentUser()

  // Tag this cache entry
  cacheTag(`person-${id}`)
  cacheTag(`people-org-${user.organizationId}`)

  return await prisma.person.findFirst({
    where: { id, organizationId: user.organizationId },
  })
}
```

### Setting Cache Lifetime

Use `cacheLife()` with predefined profiles or custom configuration:

```typescript
import { cacheTag, cacheLife } from 'next/cache'

export async function getPersonById(id: string) {
  'use cache'

  cacheLife('hours') // Uses 'hours' profile: 5min stale, 1hr revalidate, 1 day expire
  cacheTag(`person-${id}`)

  const user = await getCurrentUser()
  return await prisma.person.findFirst({
    where: { id, organizationId: user.organizationId },
  })
}
```

**Available Profiles:**

- `'seconds'` - 30s stale, 1s revalidate, 1min expire
- `'minutes'` - 5min stale, 1min revalidate, 1hr expire
- `'hours'` - 5min stale, 1hr revalidate, 1 day expire
- `'days'` - 5min stale, 1 day revalidate, 1 week expire
- `'weeks'` - 5min stale, 1 week revalidate, 30 days expire
- `'max'` - 5min stale, 30 days revalidate, never expire
- `'default'` - 5min stale, 15min revalidate, never expire

**Custom Configuration:**

```typescript
cacheLife({
  stale: 300, // 5 minutes - client cache duration
  revalidate: 3600, // 1 hour - server revalidation interval
  expire: 86400, // 1 day - cache expiration
})
```

## Combining with React `cache()`

You can combine `"use cache"` with React's `cache()` for maximum optimization:

```typescript
import { cache } from 'react'
import { cacheTag, cacheLife } from 'next/cache'

// Request-level deduplication (React cache)
export const getPersonById = cache(async (id: string) => {
  // Persistent global cache (Next.js "use cache")
  'use cache'

  cacheLife('hours')
  cacheTag(`person-${id}`)

  const user = await getCurrentUser()
  return await prisma.person.findFirst({
    where: { id, organizationId: user.organizationId },
  })
})
```

**Benefits:**

- React `cache()` prevents duplicate calls within a single request
- `"use cache"` provides persistent caching across requests
- Maximum efficiency: request deduplication + persistent caching

## Cache Invalidation

### Using `revalidateTag()`

Invalidate specific cache entries when data changes. **Note:** In Next.js 16, `revalidateTag` requires a profile parameter:

```typescript
import { revalidateTag, revalidatePath } from 'next/cache'

export async function updatePerson(id: string, data: PersonFormData) {
  // Update database
  await prisma.person.update({ where: { id }, data })

  // Invalidate cache tags (profile is required in Next.js 16)
  revalidateTag(`person-${id}`, 'default')
  revalidateTag(`people-org-${user.organizationId}`, 'default')

  // Also revalidate Next.js route cache
  revalidatePath(`/people/${id}`)
}
```

### Invalidation Strategies

**Granular Invalidation** (Recommended):

```typescript
// Only invalidate what changed
revalidateTag(`person-${id}`, 'default')
```

**Broad Invalidation**:

```typescript
// Invalidate all people in org (use sparingly)
revalidateTag(`people-org-${organizationId}`, 'default')
```

**Cascading Invalidation**:

```typescript
// Invalidate related entities
revalidateTag(`person-${id}`, 'default')
revalidateTag(`people-org-${organizationId}`, 'default')
revalidateTag(`hierarchy-org-${organizationId}`, 'default')
```

## Cache Tag Strategy

### Tag Hierarchy

Use a consistent tagging strategy:

```typescript
// Item-level tags
;`person-${id}` // Specific person
`person-detail-${id}` // Person with full relations
// Collection-level tags
`people-org-${organizationId}` // All people in org
`hierarchy-org-${organizationId}` // Org hierarchy
// Related entity tags
`feedback-person-${personId}` // Feedback for person
`feedback-count-person-${personId}` // Feedback count
```

### Tag Naming Conventions

- **Item tags**: `{entity}-{id}` (e.g., `person-123`)
- **Collection tags**: `{entity-plural}-org-{orgId}` (e.g., `people-org-456`)
- **Related tags**: `{related-entity}-{parent-entity}-{id}` (e.g., `feedback-person-123`)

## Examples

### Basic Person Query

```typescript
export async function getPersonById(id: string) {
  'use cache'

  cacheLife('hours') // 5 minutes stale, 1 hour revalidate, 1 day expire
  cacheTag(`person-${id}`)

  const user = await getCurrentUser()
  if (!user.organizationId) {
    return null
  }

  return await prisma.person.findFirst({
    where: { id, organizationId: user.organizationId },
  })
}
```

### Organization-Level Query

```typescript
export async function getPeopleForOrganization() {
  'use cache'

  cacheLife('minutes') // 5 minutes stale, 1 minute revalidate, 1 hour expire
  const user = await getCurrentUser()

  if (!user.organizationId) {
    return []
  }

  cacheTag(`people-org-${user.organizationId}`)

  return await prisma.person.findMany({
    where: { organizationId: user.organizationId },
    include: {
      /* relations */
    },
  })
}
```

### With Request Deduplication

```typescript
import { cache } from 'react'
import { cacheTag, cacheLife } from 'next/cache'

export const getPersonWithDetail = cache(async (id: string) => {
  'use cache'

  cacheLife('hours')
  cacheTag(`person-${id}`)
  cacheTag(`person-detail-${id}`)

  const user = await getCurrentUser()

  return await prisma.person.findFirst({
    where: { id, organizationId: user.organizationId },
    include: {
      /* full relations */
    },
  })
})
```

### Mutation with Invalidation

```typescript
import { revalidateTag, revalidatePath } from 'next/cache'

export async function updatePerson(id: string, data: PersonFormData) {
  const user = await getCurrentUser()

  // Update database
  await prisma.person.update({
    where: { id, organizationId: user.organizationId },
    data,
  })

  // Invalidate cache tags
  revalidateTag(`person-${id}`, 'default')
  revalidateTag(`person-detail-${id}`, 'default')
  revalidateTag(`people-org-${user.organizationId}`, 'default')
  revalidateTag(`hierarchy-org-${user.organizationId}`, 'default')

  // Revalidate routes
  revalidatePath(`/people/${id}`)
  revalidatePath('/people')
}
```

## Security Considerations

### User Authorization

Always verify authorization inside cached functions:

```typescript
export async function getPersonById(id: string) {
  'use cache'

  cacheTag(`person-${id}`)

  const user = await getCurrentUser() // Get user inside function

  // Authorization check
  if (!user.organizationId) {
    return null
  }

  // Query with organization filter
  return await prisma.person.findFirst({
    where: {
      id,
      organizationId: user.organizationId, // Enforce org boundary
    },
  })
}
```

### Organization Isolation

Include organization ID in cache tags to prevent cross-org access:

```typescript
cacheTag(`person-${id}`)
cacheTag(`people-org-${organizationId}`) // Include org context
```

## Performance Tips

- Cache expensive queries (complex joins, aggregations)
- Cache frequently accessed data (people lists, hierarchies)
- Use shorter lifetimes for frequently changing data
- Use longer lifetimes for stable reference data
- Monitor cache hit rates to optimize lifetimes

## Comparison: "use cache" vs unstable_cache

| Feature          | `"use cache"`                | `unstable_cache`        |
| ---------------- | ---------------------------- | ----------------------- |
| **Syntax**       | Directive at top of function | Wrapper function        |
| **Readability**  | Clean, simple                | More verbose            |
| **Cache keys**   | Automatic (based on params)  | Manual key array        |
| **Tags**         | `cacheTag()` function        | In options object       |
| **Lifetime**     | `cacheLife()` profiles       | `revalidate` in options |
| **Available in** | Next.js 16+ (with config)    | Next.js 13+             |

## Best Practices

1. **Use "use cache" for persistent caching** - Cross-request caching
2. **Combine with React cache()** - For request-level deduplication
3. **Tag consistently** - Use clear, hierarchical tag naming
4. **Set appropriate lifetimes** - Based on data volatility
5. **Invalidate on mutations** - Always call `revalidateTag()` with profile after updates
6. **Include org context** - In tags for multi-tenant apps
7. **Verify authorization** - Inside cached functions, not outside
