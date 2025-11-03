# React Cache for Database Queries

## Overview

React's `cache()` function provides **request-level deduplication** for database queries in Server Components. This means if the same function is called multiple times with the same arguments during a single request/render, React will only execute it once and reuse the result.

## How It Works

### Request Deduplication

When a Server Component renders, React tracks all function calls wrapped in `cache()`. If multiple components in the same render tree call the same cached function with identical arguments, React:

1. Executes the function only once
2. Reuses the result for all subsequent calls
3. Ensures all components get the exact same data instance (referential equality)

### Key Benefits

- **Reduces database queries**: Eliminates duplicate queries within a single request
- **Improves performance**: Fewer round-trips to the database
- **Maintains data consistency**: All components see the same data during a render
- **Automatic**: Works transparently - no manual caching logic needed

## When to Use `cache()`

### ✅ Use `cache()` for:

- **Read operations** called from Server Components
- Functions that are **pure** (same inputs = same outputs)
- Functions that may be called **multiple times** in a render tree
- Database queries that are **safe to deduplicate**

### ❌ Don't use `cache()` for:

- **Write operations** (create, update, delete) - these are server actions
- Functions with **side effects** that should run every time
- Functions that need **fresh data** on every call (e.g., real-time data)
- Functions called from **Client Components** (use client-side caching instead)

## Implementation Pattern

### Basic Pattern

```typescript
import { cache } from 'react'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-utils'

export const getPersonById = cache(async (id: string) => {
  const user = await getCurrentUser()

  if (!user.organizationId) {
    return null
  }

  return await prisma.person.findFirst({
    where: {
      id,
      organizationId: user.organizationId,
    },
  })
})
```

### Pattern with User Context

When functions need to access the current user, you have two options:

**Option 1: Get user inside the cached function** (Recommended)

```typescript
export const getPersonById = cache(async (id: string) => {
  const user = await getCurrentUser()

  // ... query logic
})
```

**Option 2: Pass user context as parameter**

```typescript
export const getPersonById = cache(
  async (id: string, organizationId: string) => {
    // ... query logic using organizationId
  }
)
```

## Examples from ManagerOS

### Current Usage

See `src/lib/data/people.ts` for an existing example:

```typescript
import { cache } from 'react'
import { prisma } from '@/lib/db'

export const getActivePeopleForOrganization = cache(
  async (organizationId: string) => {
    return prisma.person.findMany({
      where: {
        status: 'active',
        organizationId,
      },
      // ... includes
    })
  }
)
```

### Server Component Usage

```typescript
// src/app/people/[id]/page.tsx
export default async function PersonDetailPage({ params }) {
  const { id } = await params

  // If this function is called multiple times with the same id
  // in this render tree, React will deduplicate the calls
  const person = await getPersonById(id)

  // ... rest of component
}
```

## Important Notes

### 1. Cache Scope

- The cache is **per-request only** - it doesn't persist across requests
- Each request gets a fresh cache
- The cache is cleared after the request completes

### 2. Cache Key Generation

React uses the **function reference** and **arguments** to create cache keys:

```typescript
// These are cached separately (different arguments)
getPersonById('person-1') // Cache key: [function, 'person-1']
getPersonById('person-2') // Cache key: [function, 'person-2']

// These share the cache (same arguments)
getPersonById('person-1') // Cache key: [function, 'person-1']
getPersonById('person-1') // Reuses cached result
```

### 3. Argument Equality

React uses **Object.is()** to compare arguments. For objects:

```typescript
// ❌ These are treated as different (different object references)
getPeople({ filters: { status: 'active' } })
getPeople({ filters: { status: 'active' } })

// ✅ These share the cache (same reference)
const filters = { status: 'active' }
getPeople(filters)
getPeople(filters)
```

### 4. Async Functions

`cache()` works perfectly with async functions. The promise is what gets cached:

```typescript
export const getPersonById = cache(async (id: string) => {
  // This entire async function is cached
  return await prisma.person.findFirst({ where: { id } })
})
```

## Best Practices

### 1. Use Descriptive Function Names

Since these are cached, use clear names that indicate they're data fetchers:

```typescript
// ✅ Good
export const getPersonById = cache(async (id: string) => { ... })
export const getPeopleForOrganization = cache(async () => { ... })

// ❌ Less clear
export const person = cache(async (id: string) => { ... })
```

### 2. Keep Functions Pure

The cached function should be deterministic - same inputs should produce same outputs:

```typescript
// ✅ Good - deterministic
export const getPersonById = cache(async (id: string) => {
  return await prisma.person.findFirst({ where: { id } })
})

// ❌ Bad - non-deterministic
export const getRandomPerson = cache(async () => {
  return await prisma.person.findFirst({
    orderBy: { createdAt: 'desc' },
  })
})
```

### 3. Handle Errors Gracefully

```typescript
export const getPersonById = cache(async (id: string) => {
  try {
    const user = await getCurrentUser()
    if (!user.organizationId) {
      return null
    }

    return await prisma.person.findFirst({
      where: { id, organizationId: user.organizationId },
    })
  } catch (error) {
    console.error('Error fetching person:', error)
    return null
  }
})
```

### 4. Use with Server Components Only

`cache()` is designed for Server Components. For Client Components, use the client-side caching system (Zustand):

```typescript
// Server Component - use cache()
export const getPersonById = cache(async (id: string) => { ... })

// Client Component - use Zustand cache
export function usePersonCache(id: string) {
  return useOrganizationCacheStore()
}
```

## Comparison: React cache() vs Client-Side Caching

| Feature           | React `cache()`       | Client-Side (Zustand)              |
| ----------------- | --------------------- | ---------------------------------- |
| **Scope**         | Per-request only      | Per-session                        |
| **Duration**      | Single request/render | Until invalidated                  |
| **Use Case**      | Server Components     | Client Components                  |
| **Deduplication** | Automatic per request | Manual with stale-while-revalidate |
| **Persistence**   | No                    | Yes (in memory)                    |

## Migration Guide

### Before (No Cache)

```typescript
// src/lib/actions/person.ts
export async function getPerson(id: string) {
  const user = await getCurrentUser()
  return await prisma.person.findFirst({
    where: { id, organizationId: user.organizationId },
  })
}
```

### After (With Cache)

```typescript
// src/lib/actions/person.ts
import { cache } from 'react'

export const getPerson = cache(async (id: string) => {
  const user = await getCurrentUser()
  return await prisma.person.findFirst({
    where: { id, organizationId: user.organizationId },
  })
})
```

### Benefits of Migration

- If `getPerson(id)` is called multiple times in a Server Component tree with the same `id`, only one database query executes
- Better performance for complex page layouts
- Reduced database load

## Debugging

To verify cache is working, add logging:

```typescript
export const getPersonById = cache(async (id: string) => {
  console.log('🔍 getPersonById called with:', id)
  const user = await getCurrentUser()
  // ... query
})
```

In a render tree where `getPersonById('person-1')` is called 3 times, you should see only 1 log entry if the cache is working correctly.
