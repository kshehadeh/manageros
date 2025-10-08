'use client'

import { usePeopleCache } from '@/hooks/use-organization-cache'

/**
 * Test component to verify cache behavior
 * This can be temporarily added to any page to test the cache system
 */
export function CacheTestComponent() {
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
    <div className='p-4 border rounded-lg bg-gray-50'>
      <h3 className='font-bold mb-2'>Cache Test Component</h3>

      <div className='space-y-2 text-sm'>
        <div>
          <strong>People Count:</strong> {people.length}
        </div>

        <div>
          <strong>Loading States:</strong>
          <ul className='ml-4'>
            <li>isLoading: {isLoading ? 'true' : 'false'}</li>
            <li>isInitialLoading: {isInitialLoading ? 'true' : 'false'}</li>
            <li>isRefreshing: {isRefreshing ? 'true' : 'false'}</li>
          </ul>
        </div>

        <div>
          <strong>Cache Status:</strong>
          <ul className='ml-4'>
            <li>isStale: {isStale ? 'true' : 'false'}</li>
            <li>
              lastFetched:{' '}
              {lastFetched ? lastFetched.toLocaleTimeString() : 'Never'}
            </li>
            <li>error: {error || 'None'}</li>
          </ul>
        </div>

        <div className='flex gap-2'>
          <button
            onClick={refresh}
            className='px-2 py-1 bg-blue-500 text-white rounded text-xs'
          >
            Refresh
          </button>
          <button
            onClick={invalidate}
            className='px-2 py-1 bg-red-500 text-white rounded text-xs'
          >
            Invalidate
          </button>
        </div>

        <div>
          <strong>Sample People:</strong>
          <ul className='ml-4 max-h-32 overflow-y-auto'>
            {people.slice(0, 5).map(person => (
              <li key={person.id}>{person.name}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
