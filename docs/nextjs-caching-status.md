# Next.js Caching Status

## Current Implementation

Currently using `unstable_cache` for persistent global caching in Next.js 16.0.1. The "use cache" directive mentioned in Next.js 16 documentation appears to be experimental or not yet available in version 16.0.1.

## Future Migration

When "use cache" becomes stable, the migration path will be:

### Current (unstable_cache)

```typescript
export const getPersonById = cache(async (id: string) => {
  const user = await getCurrentUser()

  return await unstable_cache(
    async () => {
      return prisma.person.findFirst({
        where: { id, organizationId: user.organizationId },
      })
    },
    [`person-${id}`, `org-${user.organizationId}`],
    {
      tags: [`person-${id}`, `people-org-${user.organizationId}`],
      revalidate: 3600,
    }
  )()
})
```

### Future ("use cache")

```typescript
export const getPersonById = cache(async (id: string) => {
  'use cache'

  const user = await getCurrentUser()
  cacheTag(`person-${id}`)
  cacheTag(`people-org-${user.organizationId}`)

  return prisma.person.findFirst({
    where: { id, organizationId: user.organizationId },
  })
})
```

## Monitoring

- Watch Next.js release notes for stable "use cache" support
- Check when `cacheLife` and `cacheTag` APIs become available
- Monitor TypeScript definitions in `node_modules/next`
