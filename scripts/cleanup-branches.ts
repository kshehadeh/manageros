#!/usr/bin/env bun

import { execSync } from 'child_process'
import { createInterface } from 'readline'

// Colors for output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
}

// Utility functions for colored output
function printStatus(message: string): void {
  console.log(`${colors.blue}[INFO]${colors.reset} ${message}`)
}

function printSuccess(message: string): void {
  console.log(`${colors.green}[SUCCESS]${colors.reset} ${message}`)
}

function printWarning(message: string): void {
  console.log(`${colors.yellow}[WARNING]${colors.reset} ${message}`)
}

function printError(message: string): void {
  console.log(`${colors.red}[ERROR]${colors.reset} ${message}`)
}

// Long-lived branches that should never be deleted
const LONG_LIVED_BRANCHES = ['main', 'master', 'staging', 'develop', 'dev']

interface BranchInfo {
  name: string
  hasOpenPR: boolean
  existsRemotely: boolean
  remoteName: string | null
}

class BranchCleanup {
  private projectRoot: string

  constructor() {
    this.projectRoot = this.findProjectRoot()
  }

  private findProjectRoot(): string {
    try {
      const result = execSync('git rev-parse --show-toplevel', {
        encoding: 'utf8',
        stdio: 'pipe',
      })
      return result.trim()
    } catch {
      return process.cwd()
    }
  }

  private execGitCommand(command: string, silent = true): string {
    try {
      const result = execSync(command, {
        cwd: this.projectRoot,
        encoding: 'utf8',
        stdio: silent ? 'pipe' : 'inherit',
      })
      // When stdio is 'inherit', result may be null/undefined
      if (result === null || result === undefined) {
        return ''
      }
      return result.trim()
    } catch (error: unknown) {
      let errorMessage = 'Unknown error'
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (error && typeof error === 'object' && 'stderr' in error) {
        errorMessage = (
          error as { stderr: { toString(): string } }
        ).stderr.toString()
      }
      throw new Error(`Git command failed: ${command}\nError: ${errorMessage}`)
    }
  }

  private execGitCommandNoOutput(command: string): void {
    try {
      execSync(command, {
        cwd: this.projectRoot,
        encoding: 'utf8',
        stdio: 'inherit',
      })
    } catch (error: unknown) {
      let errorMessage = 'Unknown error'
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (error && typeof error === 'object' && 'stderr' in error) {
        errorMessage = (
          error as { stderr: { toString(): string } }
        ).stderr.toString()
      }
      throw new Error(`Git command failed: ${command}\nError: ${errorMessage}`)
    }
  }

  private checkGitHubCLI(): boolean {
    try {
      execSync('gh --version', { stdio: 'pipe' })
      return true
    } catch {
      return false
    }
  }

  private getLocalBranches(): string[] {
    const result = this.execGitCommand('git branch --format="%(refname:short)"')
    return result
      .split('\n')
      .map(branch => branch.trim())
      .filter(branch => branch.length > 0)
  }

  private getRemoteBranches(): string[] {
    try {
      // Fetch latest remote branch info
      this.execGitCommand('git fetch --prune', true)

      // Get all remote branches (excluding HEAD)
      const result = this.execGitCommand(
        'git branch -r --format="%(refname:short)"'
      )

      // Get list of remote names to filter them out
      const remoteNames = this.getRemoteNames()

      return result
        .split('\n')
        .map(branch => branch.trim())
        .filter(branch => {
          // Filter out HEAD, empty strings, and lines without a slash (which would be just remote names)
          return (
            branch.length > 0 &&
            branch.includes('/') &&
            !branch.includes('HEAD')
          )
        })
        .map(branch => {
          // Remove remote prefix (e.g., 'origin/') to get just the branch name
          return branch.replace(/^[^/]+\//, '')
        })
        .filter(branch => {
          // Filter out empty strings and remote names that might have slipped through
          return branch.length > 0 && !remoteNames.includes(branch)
        })
    } catch {
      return []
    }
  }

  private getRemoteNames(): string[] {
    try {
      const result = this.execGitCommand('git remote', true)
      return result.split('\n').filter(r => r.trim().length > 0)
    } catch {
      return []
    }
  }

  private getRemoteName(): string {
    try {
      // Get the default remote name (usually 'origin')
      const result = this.execGitCommand('git remote', true)
      const remotes = result.split('\n').filter(r => r.trim().length > 0)
      return remotes[0] || 'origin'
    } catch {
      return 'origin'
    }
  }

  private hasOpenPR(branchName: string): boolean {
    try {
      // Check if branch has an open PR
      // gh pr list --head <branch> returns PRs with that branch as head
      const result = this.execGitCommand(
        `gh pr list --head ${branchName} --state open --json number`,
        true
      )
      const prs = JSON.parse(result) as Array<{ number: number }>
      return prs.length > 0
    } catch {
      // If GitHub CLI fails or branch doesn't exist remotely, assume no PR
      // This could happen if:
      // - Branch was never pushed
      // - GitHub CLI is not authenticated
      // - Network error
      return false
    }
  }

  private getRemoteBranchName(localBranch: string): string | null {
    try {
      // Try to get the remote tracking branch
      const result = this.execGitCommand(
        `git rev-parse --abbrev-ref ${localBranch}@{upstream}`,
        true
      )
      // Extract branch name from remote/branch format
      const match = result.match(/[^/]+$/)
      return match ? match[0] : localBranch
    } catch {
      // No upstream branch, return local branch name
      return localBranch
    }
  }

  async analyzeBranches(includeRemote = false): Promise<BranchInfo[]> {
    printStatus('Fetching local branches...')
    const localBranches = this.getLocalBranches()
    printStatus(`Found ${localBranches.length} local branches`)

    let remoteBranches: string[] = []
    if (includeRemote) {
      printStatus('Fetching remote branches...')
      remoteBranches = this.getRemoteBranches()
      printStatus(`Found ${remoteBranches.length} remote branches`)
    }

    // Combine local and remote branches, removing duplicates
    const allBranches = new Set([...localBranches, ...remoteBranches])

    // Filter out long-lived branches
    const candidateBranches = Array.from(allBranches).filter(
      branch => !LONG_LIVED_BRANCHES.includes(branch)
    )

    printStatus(`Checking ${candidateBranches.length} branches for open PRs...`)

    const branchInfo: BranchInfo[] = []
    const remoteName = this.getRemoteName()

    for (const branch of candidateBranches) {
      const remoteBranch = this.getRemoteBranchName(branch)
      const branchNameToCheck = remoteBranch || branch
      const hasOpenPR = this.hasOpenPR(branchNameToCheck)
      const existsRemotely = remoteBranches.includes(branch)

      branchInfo.push({
        name: branch,
        hasOpenPR,
        existsRemotely,
        remoteName: existsRemotely ? remoteName : null,
      })
    }

    return branchInfo
  }

  deleteLocalBranch(branchName: string): boolean {
    try {
      this.execGitCommandNoOutput(`git branch -D ${branchName}`)
      return true
    } catch (error) {
      printError(`Failed to delete local branch ${branchName}: ${error}`)
      return false
    }
  }

  deleteRemoteBranch(branchName: string, remoteName: string): boolean {
    try {
      this.execGitCommandNoOutput(
        `git push ${remoteName} --delete ${branchName}`
      )
      return true
    } catch (error) {
      printError(
        `Failed to delete remote branch ${remoteName}/${branchName}: ${error}`
      )
      return false
    }
  }

  async cleanup(dryRun = false, includeRemote = false): Promise<void> {
    // Check if we're in a git repository
    try {
      this.execGitCommand('git rev-parse --git-dir', true)
    } catch {
      printError('Not in a git repository')
      process.exit(1)
    }

    // Check if GitHub CLI is available
    if (!this.checkGitHubCLI()) {
      printWarning(
        'GitHub CLI (gh) not found. Install it to check for open PRs: https://cli.github.com/'
      )
      printWarning(
        'The script will assume no branches have open PRs and may delete branches incorrectly.'
      )
      const response = await this.promptUser('Continue anyway? (y/N): ')
      if (response.toLowerCase() !== 'y') {
        process.exit(0)
      }
    }

    // Get current branch
    const currentBranch = this.execGitCommand('git branch --show-current', true)
    printStatus(`Current branch: ${currentBranch}`)

    // Get local branches list for reference
    const localBranches = this.getLocalBranches()

    // Analyze branches
    const branchInfo = await this.analyzeBranches(includeRemote)

    // Separate branches with and without open PRs
    const branchesWithPRs = branchInfo.filter(b => b.hasOpenPR)
    const branchesWithoutPRs = branchInfo.filter(b => !b.hasOpenPR)

    // Print summary
    console.log('\n' + '='.repeat(60))
    printStatus('Branch Analysis Summary')
    console.log('='.repeat(60))
    console.log(`Total branches analyzed: ${branchInfo.length}`)
    console.log(
      `Branches with open PRs (will be kept): ${branchesWithPRs.length}`
    )
    console.log(
      `Branches without open PRs (will be deleted): ${branchesWithoutPRs.length}`
    )

    if (branchesWithPRs.length > 0) {
      console.log('\nBranches with open PRs (kept):')
      branchesWithPRs.forEach(b => {
        printSuccess(`  ✓ ${b.name}`)
      })
    }

    if (branchesWithoutPRs.length > 0) {
      console.log('\nBranches without open PRs (to be deleted):')
      branchesWithoutPRs.forEach(b => {
        const locations: string[] = []
        if (localBranches.includes(b.name)) {
          locations.push('local')
        }
        if (b.existsRemotely) {
          locations.push(`remote (${b.remoteName})`)
        }
        printWarning(`  ✗ ${b.name} [${locations.join(', ')}]`)
      })
    }

    // Check if current branch would be deleted
    const currentBranchWillBeDeleted = branchesWithoutPRs.some(
      b => b.name === currentBranch
    )

    if (currentBranchWillBeDeleted) {
      printError(
        `\n⚠️  WARNING: Current branch "${currentBranch}" will be deleted!`
      )
      printError('Please switch to a different branch before running cleanup.')
      process.exit(1)
    }

    if (branchesWithoutPRs.length === 0) {
      printSuccess(
        '\nNo branches to delete. All branches have open PRs or are protected.'
      )
      return
    }

    if (dryRun) {
      printStatus('\n🔍 DRY RUN: No branches were actually deleted.')
      return
    }

    // Confirm deletion
    console.log('\n' + '='.repeat(60))
    const confirm = await this.promptUser(
      `\nDelete ${branchesWithoutPRs.length} branch(es)? (y/N): `
    )

    if (confirm.toLowerCase() !== 'y') {
      printStatus('Cleanup cancelled.')
      return
    }

    // Delete branches
    console.log('\nDeleting branches...')
    let deletedLocalCount = 0
    let deletedRemoteCount = 0
    let failedCount = 0

    for (const branch of branchesWithoutPRs) {
      let localDeleted = false
      let remoteDeleted = false

      // Delete local branch if it exists locally
      if (localBranches.includes(branch.name)) {
        if (this.deleteLocalBranch(branch.name)) {
          deletedLocalCount++
          localDeleted = true
          printSuccess(`Deleted local: ${branch.name}`)
        } else {
          failedCount++
        }
      }

      // Delete remote branch if it exists remotely
      if (branch.existsRemotely && branch.remoteName) {
        if (this.deleteRemoteBranch(branch.name, branch.remoteName)) {
          deletedRemoteCount++
          remoteDeleted = true
          printSuccess(`Deleted remote: ${branch.remoteName}/${branch.name}`)
        } else {
          failedCount++
        }
      }

      if (!localDeleted && !remoteDeleted) {
        printWarning(`Skipped: ${branch.name} (not found locally or remotely)`)
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60))
    printStatus('Cleanup Summary')
    console.log('='.repeat(60))
    if (deletedLocalCount > 0) {
      printSuccess(
        `Successfully deleted local: ${deletedLocalCount} branch(es)`
      )
    }
    if (deletedRemoteCount > 0) {
      printSuccess(
        `Successfully deleted remote: ${deletedRemoteCount} branch(es)`
      )
    }
    if (failedCount > 0) {
      printError(`Failed to delete: ${failedCount} branch(es)`)
    }
    if (
      deletedLocalCount === 0 &&
      deletedRemoteCount === 0 &&
      failedCount === 0
    ) {
      printStatus('No branches were deleted.')
    }
  }

  private async promptUser(question: string): Promise<string> {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    })

    return new Promise(resolve => {
      rl.question(question, answer => {
        rl.close()
        resolve(answer.trim())
      })
    })
  }
}

function main(): void {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run') || args.includes('-d')
  const includeRemote = args.includes('--remote') || args.includes('-r')

  if (dryRun) {
    printStatus('Running in DRY RUN mode - no branches will be deleted')
  }

  if (includeRemote) {
    printStatus('Remote branch cleanup enabled')
  }

  const cleanup = new BranchCleanup()
  cleanup.cleanup(dryRun, includeRemote).catch(error => {
    printError(`Error: ${error}`)
    process.exit(1)
  })
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - import.meta.main is a Bun-specific feature
if (import.meta.main) {
  main()
}
