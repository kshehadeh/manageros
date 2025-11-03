# Next.js Global Cache for Database Queries

## Overview

Next.js provides `unstable_cache` for **persistent, global caching** of database queries across requests. Unlike React's `cache()` which only deduplicates within a single request, `unstable_cache` caches results persistently and can be shared across multiple requests, improving performance significantly.

## How It Works

### Global Persistent Cache

`unstable_cache` stores query results in Next.js's Data Cache, which:

- **Persists across requests** - Same query returns cached result for all users
- **Survives deployments** - Cache persists in production
- **Supports cache tags** - Selective invalidation by tags
- **Time-based revalidation** - Automatically refreshes after a duration
- **Tag-based revalidation** - Manual invalidation via `revalidateTag()`

### Key Benefits

- **Reduced database load**: Expensive queries execute once, then served from cache
- **Faster page loads**: Cached results return instantly
- **Shared cache**: Same cached data served to all users (when appropriate)
- **Smart invalidation**: Invalidate specific tags when data changes

## When to Use `unstable_cache`

### ✅ Use `unstable_cache` for:

- **Read-heavy queries** that don't change frequently
- **Expensive aggregations** (counts, statistics, reports)
- **Data that's shared across users** (public data, organization data)
- **Queries with complex joins** that are slow to execute
- **Data that can tolerate stale reads** (acceptable with revalidation)

### ⚠️ Use Carefully For:

- **User-specific sensitive data** - Ensure proper authorization checks
- **Frequently changing data** - Use shorter revalidation times
- **Time-sensitive data** - May need immediate invalidation on updates

### ❌ Don't Use For:

- **Write operations** - These are server actions that should execute immediately
- **Highly personalized data** - If every user gets different results, cache won't help much
- **Real-time data** - Use other strategies for live data

## Implementation Pattern

### Basic Pattern

```typescript
import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-utils'

export async function getPersonById(id: string) {
  const user = await getCurrentUser()

  if (!user.organizationId) {
    return null
  }

  return await unstable_cache(
    async () => {
      return prisma.person.findFirst({
        where: { id, organizationId: user.organizationId },
      })
    },
    [`person-${id}`, `org-${user.organizationId}`], // Cache key parts
    {
      tags: [`person-${id}`, `org-${user.organizationId}`], // Tags for invalidation
      revalidate: 3600, // Revalidate every hour (optional)
    }
  )()
}
```

### Pattern with User Context Inside

When user context is needed, include it in the cache key:

```typescript
export async function getPersonById(id: string) {
  const user = await getCurrentUser()

  return await unstable_cache(
    async () => {
      // User context accessed inside cached function
      return prisma.person.findFirst({
        where: { id, organizationId: user.organizationId },
      })
    },
    [`person-${id}`, `org-${user.organizationId}`],
    {
      tags: [`person-${id}`, `org-${user.organizationId}`],
    }
  )()
}
```

### Pattern for Organization-Level Queries

For queries that return data for an entire organization:

```typescript
export async function getPeopleForOrganization() {
  const user = await getCurrentUser()

  if (!user.organizationId) {
    return []
  }

  return await unstable_cache(
    async () => {
      return prisma.person.findMany({
        where: { organizationId: user.organizationId },
      })
    },
    [`people-org-${user.organizationId}`],
    {
      tags: [`people-org-${user.organizationId}`],
      revalidate: 300, // 5 minutes
    }
  )()
}
```

## Cache Key Strategy

### Good Cache Keys

Cache keys should:

- Include all parameters that affect the result
- Include organization/user context when needed
- Be consistent across calls
- Include entity IDs for granular invalidation

```typescript
// ✅ Good - includes all relevant parameters
unstable_cache(
  async () => {
    /* query */
  },
  ['person', id, `org-${organizationId}`],
  { tags: ['person', `person-${id}`, `org-${organizationId}`] }
)

// ❌ Bad - missing organization context
unstable_cache(
  async () => {
    /* query */
  },
  ['person', id],
  { tags: ['person'] }
)
```

### Cache Tags Strategy

Tags enable selective invalidation:

```typescript
// Tag hierarchy for flexible invalidation
{
  tags: [
    `person-${id}`, // Specific person
    `org-${organizationId}`, // All org data
    'people', // All people data
  ]
}
```

## Cache Invalidation

### Using `revalidateTag()`

Invalidate specific cache entries when data changes:

```typescript
import { revalidateTag, revalidatePath } from 'next/cache'

export async function updatePerson(id: string, data: PersonFormData) {
  // Update database
  await prisma.person.update({ where: { id }, data })

  // Invalidate cache
  revalidateTag(`person-${id}`) // This specific person
  revalidateTag(`org-${data.orgId}`) // All org data (if needed)

  // Also revalidate Next.js route cache
  revalidatePath(`/people/${id}`)
}
```

### Invalidation Strategies

**Granular Invalidation** (Recommended):

```typescript
// Only invalidate what changed
revalidateTag(`person-${id}`)
```

**Broad Invalidation**:

```typescript
// Invalidate all people in org (use sparingly)
revalidateTag(`org-${organizationId}`)
```

**Cascading Invalidation**:

```typescript
// Invalidate related entities
revalidateTag(`person-${id}`)
revalidateTag(`people-org-${organizationId}`)
```

## Combining with React `cache()`

You can combine both for maximum optimization:

```typescript
import { cache } from 'react'
import { unstable_cache } from 'next/cache'

// Outer: Request-level deduplication
export const getPersonById = cache(async (id: string) => {
  const user = await getCurrentUser()

  // Inner: Persistent global cache
  return await unstable_cache(
    async () => {
      return prisma.person.findFirst({
        where: { id, organizationId: user.organizationId },
      })
    },
    [`person-${id}`, `org-${user.organizationId}`],
    {
      tags: [`person-${id}`, `org-${user.organizationId}`],
      revalidate: 3600,
    }
  )()
})
```

**Benefits**:

- React `cache()` prevents duplicate calls within a request
- `unstable_cache` prevents duplicate queries across requests
- Maximum efficiency: request deduplication + persistent caching

## Revalidation Options

### Time-Based Revalidation

```typescript
{
  revalidate: 3600 // Revalidate every hour (in seconds)
}
```

### On-Demand Revalidation Only

```typescript
{
  // No revalidate - only invalidate via revalidateTag()
  tags: ['person-123']
}
```

## Security Considerations

### User Authorization

Always verify authorization **inside** the cached function:

```typescript
export async function getPersonById(id: string) {
  return await unstable_cache(
    async () => {
      const user = await getCurrentUser() // Get user inside cache

      // Authorization check inside cache
      if (!user.organizationId) {
        return null
      }

      return prisma.person.findFirst({
        where: {
          id,
          organizationId: user.organizationId, // Enforce org boundary
        },
      })
    },
    [`person-${id}`],
    { tags: [`person-${id}`] }
  )()
}
```

### Organization Isolation

Include organization ID in cache keys and tags to prevent cross-org access:

```typescript
{
  tags: [`person-${id}`, `org-${organizationId}`]
}
```

## Performance Tips

### 1. Cache Expensive Queries

Cache queries with complex joins, aggregations, or large result sets:

```typescript
export async function getPeopleHierarchy() {
  const user = await getCurrentUser()

  return await unstable_cache(
    async () => {
      // Expensive query with complex logic
      return await buildHierarchy(/* ... */)
    },
    [`hierarchy-org-${user.organizationId}`],
    {
      tags: [
        `hierarchy-org-${user.organizationId}`,
        `people-org-${user.organizationId}`,
      ],
      revalidate: 600, // 10 minutes
    }
  )()
}
```

### 2. Use Appropriate Revalidation Times

```typescript
// Frequently changing data - short revalidation
{
  revalidate: 60
} // 1 minute

// Relatively stable data - longer revalidation
{
  revalidate: 3600
} // 1 hour

// Very stable data - very long revalidation
{
  revalidate: 86400
} // 24 hours
```

### 3. Cache at the Right Level

- **Item-level**: Cache individual entities (`person-${id}`)
- **List-level**: Cache collections (`people-org-${orgId}`)
- **Aggregate-level**: Cache counts, statistics, reports

## Example: Full Implementation

```typescript
import { unstable_cache } from 'next/cache'
import { revalidateTag, revalidatePath } from 'next/cache'
import { cache } from 'react'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-utils'

// Read: Cached query
export const getPersonById = cache(async (id: string) => {
  const user = await getCurrentUser()

  if (!user.organizationId) {
    return null
  }

  return await unstable_cache(
    async () => {
      return prisma.person.findFirst({
        where: { id, organizationId: user.organizationId },
        include: { /* relations */ },
      })
    },
    [`person-${id}`, `org-${user.organizationId}`],
    {
      tags: [`person-${id}`, `people-org-${user.organizationId}`],
      revalidate: 3600, // 1 hour
    }
  )()
})

// Write: Invalidate cache
export async function updatePerson(id: string, data: PersonFormData) {
  const user = await getCurrentUser()

  // Update database
  const updated = await prisma.person.update({
    where: { id, organizationId: user.organizationId },
    data,
  })

  // Invalidate cache
  revalidateTag(`person-${id}`)
  revalidateTag(`people-org-${user.organizationId}`)

  // Revalidate routes
  revalidatePath(`/people/${id}`)
  revalidatePath('/people')

  return updated
})
```

## Monitoring Cache Effectiveness

### Check Cache Hits

Monitor your database query logs to see if cache is reducing queries:

```typescript
// Before caching: Query runs every request
// After caching: Query runs once per revalidation period
```

### Debug Cache Behavior

```typescript
export async function getPersonById(id: string) {
  console.log('🔍 getPersonById called:', id)

  return await unstable_cache(
    async () => {
      console.log('💾 Cache MISS - executing query')
      return prisma.person.findFirst({ where: { id } })
    },
    [`person-${id}`],
    { tags: [`person-${id}`] }
  )()
}
```

## Best Practices

1. **Always include organization context** in cache keys and tags
2. **Use granular tags** for precise invalidation
3. **Combine with React cache()** for request-level deduplication
4. **Invalidate on mutations** using `revalidateTag()`
5. **Set appropriate revalidation times** based on data volatility
6. **Verify authorization inside** cached functions
7. **Monitor cache effectiveness** through query logs

## Comparison: React cache() vs unstable_cache

| Feature          | React `cache()`               | `unstable_cache`                 |
| ---------------- | ----------------------------- | -------------------------------- |
| **Scope**        | Per-request                   | Persistent global                |
| **Duration**     | Single request                | Until invalidated or revalidated |
| **Shared**       | No (per request)              | Yes (across requests)            |
| **Use Case**     | Request deduplication         | Persistent caching               |
| **Invalidation** | N/A (auto-cleared)            | Manual via tags                  |
| **Best For**     | Multiple calls in same render | Expensive queries, shared data   |

## Migration Strategy

1. **Start with React cache()** for request-level deduplication
2. **Add unstable_cache** for expensive, frequently accessed queries
3. **Add cache tags** for selective invalidation
4. **Update mutations** to invalidate tags
5. **Monitor and adjust** revalidation times
