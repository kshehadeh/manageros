'use client'

import { useState } from 'react'
import { useNetworkStatus } from '@/hooks/use-network-status'
import { networkAwareFetch } from '@/lib/network-aware-fetch'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Wifi, WifiOff, RefreshCw, CheckCircle, XCircle } from 'lucide-react'

export function OfflineHandlingTest() {
  const { isOnline, isReconnecting, lastOnlineTime, connectionType } =
    useNetworkStatus()
  const [testResult, setTestResult] = useState<{
    status: 'idle' | 'testing' | 'success' | 'error'
    message: string
    timestamp?: Date
  }>({ status: 'idle', message: '' })

  const testConnection = async () => {
    setTestResult({ status: 'testing', message: 'Testing connection...' })

    try {
      const response = await networkAwareFetch('/api/health', {
        retry: {
          maxRetries: 2,
          retryDelay: 1000,
        },
        timeout: 5000,
      })

      if (response.ok) {
        const data = await response.json()
        setTestResult({
          status: 'success',
          message: `Connection successful! Server uptime: ${Math.round(data.uptime)}s`,
          timestamp: new Date(),
        })
      } else {
        setTestResult({
          status: 'error',
          message: `Server returned ${response.status}: ${response.statusText}`,
          timestamp: new Date(),
        })
      }
    } catch (error) {
      setTestResult({
        status: 'error',
        message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      })
    }
  }

  const formatLastOnlineTime = (date: Date | null) => {
    if (!date) return 'Unknown'

    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`

    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`

    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  }

  return (
    <Card className='w-full max-w-2xl'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          {isOnline ? (
            <Wifi className='h-5 w-5 text-green-500' />
          ) : (
            <WifiOff className='h-5 w-5 text-red-500' />
          )}
          Offline Handling Test
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* Network Status */}
        <div className='flex items-center justify-between'>
          <span className='text-sm font-medium'>Network Status:</span>
          <Badge variant={isOnline ? 'default' : 'destructive'}>
            {isOnline ? 'Online' : 'Offline'}
          </Badge>
        </div>

        {/* Connection Type */}
        {connectionType && (
          <div className='flex items-center justify-between'>
            <span className='text-sm font-medium'>Connection Type:</span>
            <Badge variant='outline'>{connectionType}</Badge>
          </div>
        )}

        {/* Last Online Time */}
        <div className='flex items-center justify-between'>
          <span className='text-sm font-medium'>Last Online:</span>
          <span className='text-sm text-muted-foreground'>
            {formatLastOnlineTime(lastOnlineTime)}
          </span>
        </div>

        {/* Reconnecting Status */}
        {isReconnecting && (
          <div className='flex items-center gap-2 text-sm text-blue-600'>
            <RefreshCw className='h-4 w-4 animate-spin' />
            Reconnecting...
          </div>
        )}

        {/* Test Button */}
        <div className='pt-4'>
          <Button
            onClick={testConnection}
            disabled={testResult.status === 'testing'}
            className='w-full'
          >
            {testResult.status === 'testing' ? (
              <>
                <RefreshCw className='h-4 w-4 mr-2 animate-spin' />
                Testing Connection...
              </>
            ) : (
              'Test Connection'
            )}
          </Button>
        </div>

        {/* Test Result */}
        {testResult.status !== 'idle' && (
          <div
            className={`p-3 rounded-lg border ${
              testResult.status === 'success'
                ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-950 dark:border-green-800 dark:text-green-200'
                : testResult.status === 'error'
                  ? 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-200'
                  : 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-200'
            }`}
          >
            <div className='flex items-center gap-2'>
              {testResult.status === 'success' && (
                <CheckCircle className='h-4 w-4' />
              )}
              {testResult.status === 'error' && <XCircle className='h-4 w-4' />}
              {testResult.status === 'testing' && (
                <RefreshCw className='h-4 w-4 animate-spin' />
              )}
              <span className='text-sm font-medium'>{testResult.message}</span>
            </div>
            {testResult.timestamp && (
              <div className='text-xs mt-1 opacity-75'>
                {testResult.timestamp.toLocaleTimeString()}
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className='text-xs text-muted-foreground space-y-1'>
          <p>
            <strong>To test offline handling:</strong>
          </p>
          <p>1. Disconnect your internet connection</p>
          <p>2. Observe the offline indicator at the top</p>
          <p>3. Try the test connection button</p>
          <p>4. Reconnect and watch automatic recovery</p>
        </div>
      </CardContent>
    </Card>
  )
}
