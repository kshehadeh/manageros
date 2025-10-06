'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { testR2Config } from '@/lib/actions/test-r2'
import { toast } from 'sonner'

interface TestResult {
  success: boolean
  message: string
  config?: {
    accountId: string
    accessKeyId: string
    secretAccessKey: string
    bucketName: string
    publicUrl: string
  }
  error?: string
}

export function R2ConfigTest() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<TestResult | null>(null)

  const handleTest = async () => {
    setIsLoading(true)
    try {
      const testResult = await testR2Config()
      setResult(testResult)
      if (testResult.success) {
        toast.success('R2 configuration is valid!')
      } else {
        toast.error(`R2 configuration error: ${testResult.message}`)
      }
    } catch (error) {
      toast.error('Failed to test R2 configuration')
      console.error('R2 test error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className='w-full max-w-md'>
      <CardHeader>
        <CardTitle>R2 Configuration Test</CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <Button onClick={handleTest} disabled={isLoading} className='w-full'>
          {isLoading ? 'Testing...' : 'Test R2 Config'}
        </Button>

        {result && (
          <div className='space-y-2'>
            <div
              className={`p-3 rounded ${result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}
            >
              <p className='font-medium'>{result.message}</p>
            </div>

            {result.config && (
              <div className='space-y-1 text-sm'>
                <p>
                  <strong>Account ID:</strong> {result.config.accountId}
                </p>
                <p>
                  <strong>Access Key:</strong> {result.config.accessKeyId}
                </p>
                <p>
                  <strong>Secret Key:</strong> {result.config.secretAccessKey}
                </p>
                <p>
                  <strong>Bucket Name:</strong> {result.config.bucketName}
                </p>
                <p>
                  <strong>Public URL:</strong> {result.config.publicUrl}
                </p>
              </div>
            )}

            {result.error && (
              <div className='p-3 bg-red-50 text-red-800 rounded text-sm'>
                <p>
                  <strong>Error:</strong> {result.error}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
