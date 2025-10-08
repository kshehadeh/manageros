'use client'

import { useTeamsCache } from '@/hooks/use-organization-cache'

/**
 * Debug component to test the teams cache behavior.
 * Displays cache status, teams count, and provides refresh/invalidate buttons.
 */
export function TeamsCacheTestComponent() {
  const {
    teams,
    isLoading,
    isInitialLoading,
    isRefreshing,
    error,
    lastFetched,
    isStale,
    refresh,
    invalidate,
  } = useTeamsCache()

  return (
    <div className='p-4 border rounded-lg bg-gray-50'>
      <h3 className='font-bold mb-2'>Teams Cache Test Component</h3>

      <div className='space-y-2 text-sm'>
        <div>
          <strong>Teams Count:</strong> {teams.length}
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
          <strong>Sample Teams:</strong>
          <ul className='ml-4 max-h-32 overflow-y-auto'>
            {teams.slice(0, 5).map(team => (
              <li key={team.id}>{team.name}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
