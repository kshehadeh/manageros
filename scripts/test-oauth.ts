#!/usr/bin/env bun

/**
 * OAuth Test Script for ManagerOS
 *
 * This script tests the OAuth 2.0 flow by:
 * 1. Starting a local server to receive the authorization callback
 * 2. Opening a browser for user authorization
 * 3. Exchanging the authorization code for an access token
 * 4. Testing API endpoints with the access token
 *
 * Usage:
 *   bun scripts/test-oauth.ts
 *
 * Environment Variables Required:
 *   CLERK_FRONTEND_API_URL - Clerk Frontend API URL
 *   CLERK_OAUTH_CLIENT_ID - OAuth Client ID (default: vLgNVKNwluqSJpWz)
 *   CLERK_OAUTH_CLIENT_SECRET - OAuth Client Secret
 *   BASE_URL - ManagerOS base URL (default: http://localhost:3000)
 */

import { createServer } from 'http'
import { parse } from 'url'
import { config } from 'dotenv'
import { resolve } from 'path'
import {
  InitiativesResponse,
  PeopleResponse,
  TasksResponse,
} from '../src/types/api'

// Load environment variables from .env file
config({ path: resolve(process.cwd(), '.env') })

/**
 * Open URL in browser (cross-platform)
 */
async function openBrowser(url: string): Promise<void> {
  const { spawn } = await import('child_process')
  const platform = process.platform

  let command: string
  if (platform === 'win32') {
    command = 'start'
  } else if (platform === 'darwin') {
    command = 'open'
  } else {
    command = 'xdg-open'
  }

  return new Promise((resolve, reject) => {
    const child = spawn(command, [url], { stdio: 'ignore' })
    child.on('error', reject)
    child.on('close', code => {
      if (code !== 0) {
        reject(new Error(`Process exited with code ${code}`))
      } else {
        resolve()
      }
    })
  })
}

// Configuration
const CLERK_FRONTEND_API_URL =
  process.env.CLERK_FRONTEND_API_URL ||
  (() => {
    throw new Error('CLERK_FRONTEND_API_URL environment variable is required')
  })()

const CLERK_OAUTH_CLIENT_ID =
  process.env.CLERK_OAUTH_CLIENT_ID || 'vLgNVKNwluqSJpWz'

const CLERK_OAUTH_CLIENT_SECRET =
  process.env.CLERK_OAUTH_CLIENT_SECRET ||
  (() => {
    throw new Error(
      'CLERK_OAUTH_CLIENT_SECRET environment variable is required'
    )
  })()

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
const REDIRECT_PORT = 3001
const REDIRECT_URI = `http://localhost:${REDIRECT_PORT}/callback`

// Scopes to request
const SCOPES = ['profile', 'email'].join(' ')

// State for CSRF protection
const STATE = Math.random().toString(36).substring(2, 15)

interface TokenResponse {
  access_token: string
  refresh_token?: string
  token_type: string
  expires_in?: number
  scope?: string
}

/**
 * Start a local server to receive the OAuth callback
 */
function startCallbackServer(): Promise<{
  code: string
  state: string
}> {
  return new Promise((resolve, reject) => {
    let timeoutId: NodeJS.Timeout | null = null
    let isResolved = false

    const cleanup = () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
    }

    const finish = (result: { code: string; state: string } | Error) => {
      if (isResolved) return
      isResolved = true
      cleanup()
      server.close(() => {
        if (result instanceof Error) {
          reject(result)
        } else {
          resolve(result)
        }
      })
    }

    const server = createServer((req, res) => {
      if (!req.url) {
        res.writeHead(400)
        res.end('Bad Request')
        return
      }

      const { pathname, query } = parse(req.url, true)

      if (pathname === '/callback') {
        const code = query.code as string
        const state = query.state as string
        const error = query.error as string

        if (error) {
          res.writeHead(400)
          res.end(
            `<html><body><h1>OAuth Error</h1><p>${error}</p></body></html>`
          )
          finish(new Error(`OAuth error: ${error}`))
          return
        }

        if (!code) {
          res.writeHead(400)
          res.end(
            '<html><body><h1>Error</h1><p>No authorization code received</p></body></html>'
          )
          finish(new Error('No authorization code received'))
          return
        }

        if (state !== STATE) {
          res.writeHead(400)
          res.end(
            '<html><body><h1>Error</h1><p>Invalid state parameter</p></body></html>'
          )
          finish(new Error('Invalid state parameter'))
          return
        }

        res.writeHead(200, { 'Content-Type': 'text/html' })
        res.end(
          '<html><body><h1>Success!</h1><p>Authorization code received. You can close this window.</p></body></html>'
        )
        finish({ code, state })
      } else {
        res.writeHead(404)
        res.end('Not Found')
      }
    })

    server.listen(REDIRECT_PORT, () => {
      console.log(`\n✅ Callback server started on ${REDIRECT_URI}`)
    })

    // Timeout after 5 minutes
    timeoutId = setTimeout(
      () => {
        finish(new Error('Timeout waiting for authorization callback'))
      },
      5 * 60 * 1000
    )
  })
}

/**
 * Build the authorization URL
 */
function buildAuthorizationUrl(): string {
  // OAuth 2.0 spec requires snake_case parameter names
  const params = new URLSearchParams({
    // eslint-disable-next-line camelcase
    client_id: CLERK_OAUTH_CLIENT_ID,
    // eslint-disable-next-line camelcase
    response_type: 'code',
    // eslint-disable-next-line camelcase
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    state: STATE,
  })

  return `${CLERK_FRONTEND_API_URL}/oauth/authorize?${params.toString()}`
}

/**
 * Exchange authorization code for access token
 */
async function exchangeCodeForToken(code: string): Promise<TokenResponse> {
  const auth = Buffer.from(
    `${CLERK_OAUTH_CLIENT_ID}:${CLERK_OAUTH_CLIENT_SECRET}`
  ).toString('base64')

  const response = await fetch(`${CLERK_FRONTEND_API_URL}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${auth}`,
    },
    body: new URLSearchParams({
      // eslint-disable-next-line camelcase
      grant_type: 'authorization_code',
      code,
      // eslint-disable-next-line camelcase
      redirect_uri: REDIRECT_URI,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(
      `Failed to exchange code for token: ${response.status} ${errorText}`
    )
  }

  return (await response.json()) as TokenResponse
}

/**
 * Test API endpoint with bearer token
 */
async function testApiEndpoint(
  endpoint: string,
  token: string
): Promise<unknown> {
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`

  console.log(`\n🔍 Testing: ${endpoint}`)

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(
      `API request failed: ${response.status} ${response.statusText}\n${errorText}`
    )
  }

  const data = await response.json()
  console.log(`✅ Success! Response:`, JSON.stringify(data, null, 2))
  return data
}

/**
 * Validate token using Clerk's token introspection
 */
async function validateToken(token: string): Promise<void> {
  const auth = Buffer.from(
    `${CLERK_OAUTH_CLIENT_ID}:${CLERK_OAUTH_CLIENT_SECRET}`
  ).toString('base64')

  console.log('\n🔍 Validating token...')

  const response = await fetch(`${CLERK_FRONTEND_API_URL}/oauth/token_info`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${auth}`,
    },
    body: new URLSearchParams({
      token,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Token validation failed: ${response.status} ${errorText}`)
  }

  const tokenInfo = await response.json()
  console.log('✅ Token is valid!')
  console.log('Token Info:', JSON.stringify(tokenInfo, null, 2))
}

/**
 * Get user info from Clerk
 */
async function getUserInfo(token: string): Promise<void> {
  console.log('\n🔍 Getting user info...')

  const response = await fetch(`${CLERK_FRONTEND_API_URL}/oauth/userinfo`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to get user info: ${response.status} ${errorText}`)
  }

  const userInfo = await response.json()
  console.log('✅ User Info:', JSON.stringify(userInfo, null, 2))
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 ManagerOS OAuth Test Script\n')
  console.log('Configuration:')
  console.log(`  Clerk Frontend API: ${CLERK_FRONTEND_API_URL}`)
  console.log(`  Client ID: ${CLERK_OAUTH_CLIENT_ID}`)
  console.log(`  Redirect URI: ${REDIRECT_URI}`)
  console.log(`  Scopes: ${SCOPES}`)
  console.log(`  ManagerOS Base URL: ${BASE_URL}\n`)

  try {
    // Step 1: Start callback server
    const callbackPromise = startCallbackServer()

    // Step 2: Build authorization URL and open browser
    const authUrl = buildAuthorizationUrl()
    console.log(`\n🌐 Opening browser for authorization...`)
    console.log(`   URL: ${authUrl}\n`)

    try {
      await openBrowser(authUrl)
    } catch {
      console.log('   Could not open browser automatically.')
      console.log('   Please open this URL in your browser manually:')
      console.log(`   ${authUrl}\n`)
    }

    // Step 3: Wait for authorization callback
    console.log('⏳ Waiting for authorization...')
    console.log('   (Please authorize the application in your browser)')
    const { code } = await callbackPromise
    console.log('✅ Authorization code received!')

    // Step 4: Exchange code for token
    console.log('\n🔄 Exchanging authorization code for access token...')
    const tokenResponse = await exchangeCodeForToken(code)
    console.log('✅ Access token received!')
    console.log(`   Token Type: ${tokenResponse.token_type}`)
    console.log(`   Expires In: ${tokenResponse.expires_in || 'N/A'} seconds`)
    console.log(`   Scopes: ${tokenResponse.scope || 'N/A'}`)

    const accessToken = tokenResponse.access_token

    // Step 5: Validate token
    await validateToken(accessToken)

    // Step 6: Get user info
    await getUserInfo(accessToken)

    // Step 7: Test ManagerOS API endpoints
    console.log('\n📡 Testing ManagerOS API endpoints...\n')

    // Test /api/user/current
    let result = await testApiEndpoint('/api/user/current', accessToken)
    console.log('User Info:', JSON.stringify(result, null, 2))

    // Test /api/people (if scope allows)
    result = await testApiEndpoint('/api/people?limit=5', accessToken)
    console.log(
      'People Count:',
      (result as PeopleResponse).pagination.totalCount
    )

    // Test /api/tasks (if scope allows)
    result = await testApiEndpoint('/api/tasks?limit=5', accessToken)
    console.log('Tasks Count:', (result as TasksResponse).pagination.totalCount)

    // Test /api/initiatives (if scope allows)
    result = await testApiEndpoint('/api/initiatives?limit=5', accessToken)
    console.log(
      'Initiatives Count:',
      (result as InitiativesResponse).pagination.totalCount
    )

    console.log('\n✅ All tests passed!')
    console.log('\n📝 Summary:')
    console.log(`   Access Token: ${accessToken.substring(0, 20)}...`)
    if (tokenResponse.refresh_token) {
      console.log(
        `   Refresh Token: ${tokenResponse.refresh_token.substring(0, 20)}...`
      )
    }
    console.log(`   Scopes: ${tokenResponse.scope || 'N/A'}`)

    // Explicitly exit to ensure the script terminates
    process.exit(0)
  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

// Run the script
await main()
