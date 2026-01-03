'use client'

interface RetryOptions {
  maxRetries?: number
  retryDelay?: number
  retryDelayMultiplier?: number
  maxRetryDelay?: number
  retryCondition?: (_error: Error) => boolean
}

interface NetworkAwareFetchOptions extends RequestInit {
  retry?: RetryOptions
  timeout?: number
}

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  retryDelay: 1000,
  retryDelayMultiplier: 2,
  maxRetryDelay: 10000,
  retryCondition: (error: Error) => {
    // Retry on network errors, but not on client errors (4xx)
    return (
      !error.message.includes('400') &&
      !error.message.includes('401') &&
      !error.message.includes('403') &&
      !error.message.includes('404')
    )
  },
}

class NetworkError extends Error {
  constructor(
    message: string,
    public originalError?: Error,
    public isRetryable: boolean = true
  ) {
    super(message)
    this.name = 'NetworkError'
    this.originalError = originalError
    this.isRetryable = isRetryable
  }
}

export async function networkAwareFetch(
  url: string,
  options: NetworkAwareFetchOptions = {}
): Promise<Response> {
  const { retry = {}, timeout = 30000, ...fetchOptions } = options
  const retryConfig = { ...DEFAULT_RETRY_OPTIONS, ...retry }

  let lastError: Error | null = null

  for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
    try {
      // Create abort controller for timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      // If response is not ok, throw an error
      if (!response.ok) {
        const error = new NetworkError(
          `HTTP ${response.status}: ${response.statusText}`,
          undefined,
          response.status >= 500 || response.status === 429
        )
        throw error
      }

      return response
    } catch (error) {
      lastError = error as Error

      // Check if this is a network-related error
      const isNetworkError =
        (error instanceof TypeError && error.message.includes('fetch')) ||
        (error instanceof DOMException && error.name === 'AbortError') ||
        error instanceof NetworkError

      // Don't retry if it's not a network error or if retry condition fails
      if (!isNetworkError || !retryConfig.retryCondition(error as Error)) {
        throw new NetworkError(
          `Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          error as Error,
          false
        )
      }

      // Don't retry on the last attempt
      if (attempt === retryConfig.maxRetries) {
        break
      }

      // Calculate delay for next retry
      const delay = Math.min(
        retryConfig.retryDelay *
          Math.pow(retryConfig.retryDelayMultiplier, attempt),
        retryConfig.maxRetryDelay
      )

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  // If we get here, all retries failed
  throw new NetworkError(
    `Request failed after ${retryConfig.maxRetries + 1} attempts: ${lastError?.message || 'Unknown error'}`,
    lastError || undefined,
    false
  )
}
