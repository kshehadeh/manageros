#!/usr/bin/env bun

/**
 * Wait for Vercel deployment to be ready and output the preview URL
 *
 * This script waits for a Vercel deployment associated with a GitHub PR
 * to complete, then outputs the deployment URL for use in CI/CD pipelines.
 *
 * Usage:
 *   bun scripts/wait-for-vercel-deployment.ts <pr-number>
 *
 * Environment Variables:
 *   - VERCEL_TOKEN: Vercel API token (required)
 *   - GITHUB_TOKEN: GitHub token for checking status (optional, uses GitHub API if provided)
 *
 * Output:
 *   Prints the deployment URL to stdout and exits with code 0 on success.
 *   Exits with code 1 on failure or timeout.
 */

const PR_NUMBER = process.argv[2]
const VERCEL_TOKEN = process.env.VERCEL_TOKEN
const GITHUB_TOKEN = process.env.GITHUB_TOKEN
const MAX_ATTEMPTS = 60 // 10 minutes with 10 second intervals
const INTERVAL_MS = 10000 // 10 seconds

if (!PR_NUMBER) {
  console.error('❌ PR number is required')
  console.error('Usage: bun scripts/wait-for-vercel-deployment.ts <pr-number>')
  process.exit(1)
}

if (!VERCEL_TOKEN) {
  console.error('❌ VERCEL_TOKEN environment variable is required')
  process.exit(1)
}

interface VercelDeployment {
  url: string
  readyState: 'BUILDING' | 'READY' | 'ERROR' | 'CANCELED' | 'QUEUED'
  meta?: {
    githubPullRequestNumber?: string
  }
}

interface VercelDeploymentsResponse {
  deployments: VercelDeployment[]
}

/**
 * Get the latest deployment for a PR from Vercel API
 */
async function getDeployment(
  prNumber: string
): Promise<VercelDeployment | null> {
  try {
    const response = await fetch(
      `https://api.vercel.com/v6/deployments?meta-githubPullRequestNumber=${prNumber}&limit=1`,
      {
        headers: {
          Authorization: `Bearer ${VERCEL_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      console.error(
        `❌ Vercel API error: ${response.status} ${response.statusText}`
      )
      return null
    }

    const data = (await response.json()) as VercelDeploymentsResponse
    return data.deployments[0] || null
  } catch (error) {
    console.error('❌ Error fetching deployment:', error)
    return null
  }
}

/**
 * Check if a GitHub status check is complete
 */
async function checkGitHubStatus(
  owner: string,
  repo: string,
  ref: string,
  checkName: string = 'Vercel'
): Promise<{ completed: boolean; conclusion: string | null }> {
  if (!GITHUB_TOKEN) {
    return { completed: false, conclusion: null }
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/commits/${ref}/check-runs?check_name=${checkName}`,
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    )

    if (!response.ok) {
      return { completed: false, conclusion: null }
    }

    const data = (await response.json()) as {
      check_runs: Array<{ status: string; conclusion: string | null }>
    }

    const checkRun = data.check_runs.find(run => run.status === 'completed')

    if (checkRun) {
      return { completed: true, conclusion: checkRun.conclusion }
    }

    return { completed: false, conclusion: null }
  } catch {
    // If GitHub API check fails, fall back to Vercel API polling
    return { completed: false, conclusion: null }
  }
}

/**
 * Wait for deployment to be ready
 */
async function waitForDeployment(prNumber: string): Promise<string> {
  console.error(`🔍 Waiting for Vercel deployment for PR #${prNumber}...`)

  // Try to get GitHub repo info from environment (set by GitHub Actions)
  const githubRepo = process.env.GITHUB_REPOSITORY
  const githubRef = process.env.GITHUB_SHA || process.env.GITHUB_HEAD_REF
  const owner = githubRepo?.split('/')[0]
  const repo = githubRepo?.split('/')[1]

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    // First, try checking GitHub status if we have the info
    if (GITHUB_TOKEN && owner && repo && githubRef) {
      const status = await checkGitHubStatus(owner, repo, githubRef)
      if (status.completed && status.conclusion === 'success') {
        console.error('✅ Vercel status check completed successfully')
        // Status check passed, now get the deployment URL
        const deployment = await getDeployment(prNumber)
        if (deployment && deployment.readyState === 'READY') {
          return deployment.url
        }
      } else if (status.completed && status.conclusion !== 'success') {
        console.error(
          `❌ Vercel status check failed with conclusion: ${status.conclusion}`
        )
        process.exit(1)
      }
    }

    // Fall back to checking Vercel API directly
    const deployment = await getDeployment(prNumber)

    if (deployment) {
      const { url, readyState } = deployment
      console.error(`📦 Deployment found: ${url} (State: ${readyState})`)

      if (readyState === 'READY') {
        return url
      } else if (readyState === 'ERROR' || readyState === 'CANCELED') {
        console.error(`❌ Deployment failed with state: ${readyState}`)
        process.exit(1)
      } else {
        console.error(
          `⏳ Deployment not ready yet (State: ${readyState}). Waiting ${INTERVAL_MS / 1000} seconds... (Attempt ${attempt}/${MAX_ATTEMPTS})`
        )
      }
    } else {
      console.error(
        `⏳ No deployment found yet. Waiting ${INTERVAL_MS / 1000} seconds... (Attempt ${attempt}/${MAX_ATTEMPTS})`
      )
    }

    // Wait before next attempt
    await new Promise(resolve => setTimeout(resolve, INTERVAL_MS))
  }

  console.error('❌ Timeout waiting for Vercel deployment')
  process.exit(1)
}

/**
 * Main execution
 */
async function main() {
  try {
    const url = await waitForDeployment(PR_NUMBER)

    // Ensure URL has https:// prefix
    const finalUrl =
      url.startsWith('http://') || url.startsWith('https://')
        ? url
        : `https://${url}`

    console.error(`✅ Deployment is ready!`)
    console.error(`URL: ${finalUrl}`)

    // Output URL for GitHub Actions to capture (legacy format)
    console.error(`::set-output name=url::${finalUrl}`)

    // Output in the format GitHub Actions expects
    if (process.env.GITHUB_OUTPUT) {
      const fs = await import('fs')
      await fs.promises.appendFile(
        process.env.GITHUB_OUTPUT,
        `url=${finalUrl}\n`
      )
    }

    // Print ONLY the URL to stdout for easy capture (no logs)
    process.stdout.write(finalUrl)
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

main()
