# Client-Side Caching System

## Overview

ManagerOS implements a sophisticated client-side caching system using Zustand to optimize data fetching and improve user experience. The system provides automatic caching with stale-while-revalidate patterns, network awareness, and centralized cache invalidation.

## Architecture

### Core Components

1. **Zustand Store** (`src/lib/stores/organization-cache-store.ts`)
   - Centralized cache for organization data (people, teams)
   - Metadata tracking (lastFetched, isStale, isFetching)
   - Automatic staleness detection (2-minute threshold)
   - Extensible structure for multiple entity types

2. **Custom Hooks** (`src/hooks/use-organization-cache.ts`)
   - `usePeopleCache()` - Full-featured hook with stale-while-revalidate
   - `usePeople()` - Simple hook for basic usage
   - `usePeopleForSelect()` - Optimized for select components
   - `useTeamsCache()` - Full-featured hook for teams with stale-while-revalidate
   - `useTeams()` - Simple hook for basic teams usage
   - `useTeamsForSelect()` - Optimized for team select components

3. **Cache Provider** (`src/components/cache-provider.tsx`)
   - Registers cache invalidation functions with server actions
   - Enables server-side cache invalidation

## Key Features

### Auto-Fetch

- Automatically fetches data on first use
- No manual initialization required
- Handles empty cache gracefully

### Stale-While-Revalidate

- Shows cached data immediately if available
- Triggers background refresh if data is stale (>5 minutes)
- Provides seamless user experience with instant data display

### Network Awareness

- Respects offline state using `useNetworkStatus()`
- Doesn't attempt fetches when offline
- Preserves existing data during network outages

### Cache Invalidation

The cache uses a navigation-based invalidation approach since server actions cannot directly call client-side functions:

- **Navigation-based**: Cache invalidates when navigating to people-related pages
- **Route monitoring**: Listens for route changes and invalidates cache appropriately
- **Aggressive staleness**: 2-minute threshold ensures fresh data
- **Manual refresh**: Components can trigger manual cache refresh

## Usage Examples

### Basic Usage

```tsx
import { usePeopleCache } from '@/hooks/use-organization-cache'

function MyComponent() {
  const { people, isLoading, error } = usePeopleCache()

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div>
      {people.map(person => (
        <div key={person.id}>{person.name}</div>
      ))}
    </div>
  )
}
```

### Select Component Usage

```tsx
import { PersonSelect } from '@/components/ui/person-select'

function MyForm() {
  return (
    <PersonSelect
      value={selectedPersonId}
      onValueChange={setSelectedPersonId}
      placeholder='Select a person...'
      showAvatar={true}
      showRole={true}
    />
  )
}
```

**Note**: PersonSelect now always uses cached people data and no longer accepts a `people` prop. Email addresses are never displayed to keep the interface clean and consistent with a maximum of two lines per person entry.

### Teams Usage

```tsx
import { useTeamsCache } from '@/hooks/use-organization-cache'

function MyComponent() {
  const { teams, isLoading, error } = useTeamsCache()

  if (isLoading) return <div>Loading teams...</div>
  if (error) return <div>Error loading teams: {error}</div>

  return (
    <div>
      <h1>Teams in Organization</h1>
      <ul>
        {teams.map(team => (
          <li key={team.id}>{team.name}</li>
        ))}
      </ul>
    </div>
  )
}
```

### Team Select Component Usage

```tsx
import { TeamSelect } from '@/components/ui/team-select'

function MyForm() {
  const [selectedTeamId, setSelectedTeamId] = useState<string | undefined>(
    undefined
  )
  return (
    <TeamSelect
      value={selectedTeamId}
      onValueChange={setSelectedTeamId}
      placeholder='Select a team...'
      includeNone={true}
    />
  )
}
```

**Note**: TeamSelect now always uses cached teams data and no longer accepts a `teams` prop. This ensures consistent caching behavior across all components.

### Advanced Usage with Controls

```tsx
import { usePeopleCache } from '@/hooks/use-organization-cache'

function AdvancedComponent() {
  const {
    people,
    isLoading,
    isInitialLoading,
    isRefreshing,
    error,
    lastFetched,
    isStale,
    refresh,
    invalidate,
  } = usePeopleCache()

  return (
    <div>
      <div>People: {people.length}</div>
      <div>Last fetched: {lastFetched?.toLocaleTimeString()}</div>
      <div>Is stale: {isStale ? 'Yes' : 'No'}</div>

      <button onClick={refresh} disabled={isLoading}>
        Refresh
      </button>
      <button onClick={invalidate}>Invalidate Cache</button>
    </div>
  )
}
```

## Cache States

### Loading States

- `isLoading`: True when any fetch is in progress
- `isInitialLoading`: True when fetching for the first time (no cached data)
- `isRefreshing`: True when refreshing stale data (has cached data)

### Cache Status

- `isStale`: True if data is older than 5 minutes
- `lastFetched`: Timestamp of last successful fetch
- `error`: Error message if last fetch failed

## Server-Side Integration

### Cache Invalidation

The cache uses a navigation-based invalidation approach since server actions cannot directly call client-side functions:

```typescript
// Cache automatically invalidates when navigating to people-related pages
// No manual server action integration needed
```

### Cache Provider Setup

The cache provider monitors navigation and invalidates cache when appropriate:

```tsx
// In your layout component
import { CacheProvider } from '@/components/cache-provider'

export default function Layout({ children }) {
  return (
    <div>
      <CacheProvider>{children}</CacheProvider>
    </div>
  )
}
```

## Performance Benefits

### Reduced API Calls

- Eliminates redundant fetches across components
- Shared cache reduces server load
- Automatic deduplication of concurrent requests

### Improved UX

- Instant data display from cache
- Background refresh keeps data fresh
- Graceful handling of network issues

### Memory Efficiency

- Single source of truth for organization data
- Automatic cleanup of stale data
- Optimized data structures for common use cases

## Extending the Cache

### Adding New Entity Types

To add caching for other entities (teams, initiatives, etc.):

1. **Extend the store interface:**

```typescript
interface OrganizationCacheState {
  // Existing people cache
  people: CachedPerson[]
  peopleMetadata: CacheMetadata

  // Add new entity cache
  teams: CachedTeam[]
  teamsMetadata: CacheMetadata

  // Add new actions
  fetchTeams: () => Promise<void>
  invalidateTeams: () => void
  getTeams: () => CachedTeam[]
  isTeamsStale: () => boolean
}
```

2. **Implement the cache logic:**

```typescript
// In the store implementation
fetchTeams: async () => {
  // Similar to fetchPeople implementation
  const teamsData = await fetchTeamsFromServer()
  set({ teams: teamsData, teamsMetadata: { ... } })
},
```

3. **Create custom hooks:**

```typescript
// In use-organization-cache.ts
export function useTeamsCache() {
  const { teams, teamsMetadata, fetchTeams /* ... */ } =
    useOrganizationCacheStore()
  // Similar to usePeopleCache implementation
}
```

## Best Practices

### When to Use the Cache

- ✅ Frequently accessed organization data
- ✅ Data that doesn't change often
- ✅ Data needed across multiple components
- ✅ Data used in select dropdowns

### When NOT to Use the Cache

- ❌ User-specific data that changes frequently
- ❌ Real-time data (notifications, live updates)
- ❌ Large datasets that shouldn't be cached
- ❌ Sensitive data that requires fresh fetches

### Cache Configuration

- Staleness threshold: 2 minutes (more aggressive for better UX)
- Network awareness: Respects offline state
- Error handling: Preserves existing data on errors
- Memory management: Automatic cleanup
- Navigation-based invalidation: Monitors route changes

## Debugging

### Cache Test Component

To debug cache behavior, you can use browser DevTools to inspect the cache state or add temporary logging in your components using the cache hooks directly.

### Browser DevTools

The Zustand store includes Redux DevTools integration for debugging:

1. Install Redux DevTools browser extension
2. Open DevTools and navigate to Redux tab
3. Monitor cache state changes and actions

### Console Logging

Enable detailed logging by setting debug mode:

```typescript
// In development
if (process.env.NODE_ENV === 'development') {
  console.log('Cache state:', useOrganizationCacheStore.getState())
}
```

## Migration Guide

### From Direct API Calls

**Before:**

```tsx
const [people, setPeople] = useState([])
const [loading, setLoading] = useState(false)

useEffect(() => {
  const fetchPeople = async () => {
    setLoading(true)
    const data = await getPeople()
    setPeople(data)
    setLoading(false)
  }
  fetchPeople()
}, [])
```

**After:**

```tsx
const { people, isLoading } = usePeopleCache()
```

### From Local State Management

**Before:**

```tsx
const [people, setPeople] = useState([])
// Multiple components each managing their own people state
```

**After:**

```tsx
const { people } = usePeopleCache()
// Single shared cache across all components
```

## Troubleshooting

### Common Issues

1. **Cache not updating after mutations**
   - Ensure `CacheProvider` is included in layout
   - Cache invalidates automatically on navigation to people-related pages

2. **Stale data showing**
   - Verify staleness threshold (2 minutes)
   - Check network status and connectivity
   - Use manual refresh if needed

3. **Memory leaks**
   - Ensure proper cleanup in useEffect
   - Don't store large objects in cache unnecessarily

4. **TypeScript errors**
   - Ensure proper type definitions for cached data
   - Check import paths for hooks and store

### Performance Monitoring

Monitor cache performance with:

```typescript
// Track cache hit rates
const cacheStats = {
  hits: 0,
  misses: 0,
  refreshes: 0,
}

// Log cache performance
console.log('Cache performance:', cacheStats)
```

## Future Enhancements

### Planned Features

- [ ] Persistent cache (localStorage/sessionStorage)
- [ ] Cache size limits and LRU eviction
- [ ] Background sync for offline support
- [ ] Cache warming strategies
- [ ] Advanced invalidation patterns
- [ ] Cache analytics and monitoring

### Integration Opportunities

- [ ] React Query integration
- [ ] SWR compatibility layer
- [ ] GraphQL cache integration
- [ ] Real-time updates with WebSockets
