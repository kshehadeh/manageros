#!/usr/bin/env bun
/* eslint-disable camelcase */

import { execSync } from 'child_process'

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

// Git operations
class GitOperations {
  private projectRoot: string

  constructor() {
    this.projectRoot = this.findProjectRoot()
  }

  private findProjectRoot(): string {
    try {
      const result = execSync('git rev-parse --show-toplevel', {
        encoding: 'utf8',
      })
      return result.trim()
    } catch {
      // Fallback: assume current directory is project root
      return process.cwd()
    }
  }

  private execGitCommand(
    command: string,
    options: { silent?: boolean } = {}
  ): string {
    try {
      const result = execSync(command, {
        cwd: this.projectRoot,
        encoding: 'utf8',
        stdio: options.silent ? 'pipe' : 'pipe',
      })
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

  isGitRepository(): boolean {
    try {
      this.execGitCommand('git rev-parse --git-dir', { silent: true })
      return true
    } catch {
      return false
    }
  }

  getCurrentBranch(): string {
    return this.execGitCommand('git branch --show-current', { silent: true })
  }

  hasChanges(): boolean {
    try {
      this.execGitCommand('git diff --quiet', { silent: true })
      this.execGitCommand('git diff --cached --quiet', { silent: true })
      return false
    } catch {
      return true
    }
  }

  getChangedFiles(): string[] {
    try {
      const result = this.execGitCommand('git diff --name-only', {
        silent: true,
      })
      return result ? result.split('\n').filter(file => file.trim()) : []
    } catch {
      return []
    }
  }

  getDiffContent(): string {
    try {
      return this.execGitCommand('git diff', { silent: true })
    } catch {
      return ''
    }
  }

  getChangeStats(): { added: number; deleted: number } {
    try {
      const result = this.execGitCommand('git diff --numstat', { silent: true })
      let added = 0
      let deleted = 0

      if (result) {
        const lines = result.split('\n')
        for (const line of lines) {
          const parts = line.split('\t')
          if (parts.length >= 2) {
            added += parseInt(parts[0]) || 0
            deleted += parseInt(parts[1]) || 0
          }
        }
      }

      return { added, deleted }
    } catch {
      return { added: 0, deleted: 0 }
    }
  }

  createBranch(branchName: string): void {
    try {
      // Use silent mode to avoid duplicate output
      this.execGitCommand(`git checkout -b "${branchName}"`, { silent: true })
      printStatus(`Created and switched to branch: ${branchName}`)
    } catch (error) {
      // If branch creation fails, it might already exist or we might already be on it
      // Check if we're already on the target branch
      const currentBranch = this.getCurrentBranch()
      if (currentBranch === branchName) {
        printStatus(`Already on branch: ${branchName}`)
        return
      }
      throw error
    }
  }

  stageChanges(): void {
    try {
      this.execGitCommand('git add .', { silent: true })
      printStatus('Changes staged successfully')
    } catch (error) {
      printError('Failed to stage changes')
      throw error
    }
  }

  commit(message: string): void {
    try {
      this.execGitCommand(`git commit -m "${message}"`, { silent: true })
      printStatus('Changes committed successfully')
    } catch (error) {
      printError('Failed to commit changes')
      throw error
    }
  }
}

// AI-powered commit message generation
class AICommitGenerator {
  private apiKey: string | undefined

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY
  }

  async generateSuggestions(
    diffContent: string,
    changedFiles: string[]
  ): Promise<{ branchName: string; commitMessage: string } | null> {
    if (!this.apiKey) {
      return null
    }

    const prompt = `Based on the following git diff, generate a concise branch name (kebab-case, max 30 chars) and commit message (max 50 chars) for a React/TypeScript project.

Files changed: ${changedFiles.join(', ')}

Diff:
${diffContent}

IMPORTANT: You must respond with ONLY valid JSON in this exact format:
{
  "branch_name": "descriptive-branch-name",
  "commit_message": "Concise commit message"
}

Do not include any other text, explanations, or formatting. Only return the JSON object.

Focus on:
- What functionality was added/changed
- Which components were affected
- The purpose of the changes
- Use conventional commit format when appropriate`

    try {
      const response = await fetch(
        'https://api.openai.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 200,
            temperature: 0.3,
          }),
        }
      )

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`)
      }

      const data = await response.json()
      const content = data.choices?.[0]?.message?.content

      if (!content) {
        throw new Error('No content in OpenAI response')
      }

      // Clean the content to extract JSON
      let jsonContent = content.trim()

      // Try to extract JSON from the response if it's wrapped in other text
      const jsonMatch = jsonContent.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        jsonContent = jsonMatch[0]
      }

      const parsed = JSON.parse(jsonContent)

      // Validate the parsed JSON has the required fields
      if (!parsed.branch_name || !parsed.commit_message) {
        throw new Error('Invalid JSON response: missing required fields')
      }

      return {
        branchName: parsed.branch_name,
        commitMessage: parsed.commit_message,
      }
    } catch (error) {
      console.error('AI generation failed:', error)
      return null
    }
  }
}

// Main auto-commit functionality
class AutoCommit {
  private git: GitOperations
  private aiGenerator: AICommitGenerator

  constructor() {
    this.git = new GitOperations()
    this.aiGenerator = new AICommitGenerator()
  }

  async run(customBranchName?: string): Promise<void> {
    // Check if we're in a git repository
    if (!this.git.isGitRepository()) {
      printError('Not in a git repository')
      process.exit(1)
    }

    // Check if we're on main branch
    const currentBranch = this.git.getCurrentBranch()
    if (currentBranch !== 'main') {
      printError(`Not on main branch. Current branch: ${currentBranch}`)
      printWarning('This script only works when on the main branch')
      process.exit(1)
    }

    // Check if there are any changes
    if (!this.git.hasChanges()) {
      printWarning('No changes to commit')
      process.exit(0)
    }

    // Get the list of changed files
    const changedFiles = this.git.getChangedFiles()
    if (changedFiles.length === 0) {
      printWarning('No unstaged changes found')
      process.exit(0)
    }

    printStatus('Analyzing changes...')

    let branchName: string
    let commitMessage: string

    // Check if custom branch name was provided
    if (customBranchName) {
      branchName = customBranchName
      commitMessage = `Update: ${customBranchName}`
    } else {
      // Try AI generation first
      printStatus('Generating AI-powered suggestions...')
      const diffContent = this.git.getDiffContent()
      const aiResult = await this.aiGenerator.generateSuggestions(
        diffContent,
        changedFiles
      )

      if (aiResult) {
        branchName = aiResult.branchName
        commitMessage = aiResult.commitMessage
        printSuccess(`AI generated: '${branchName}' - '${commitMessage}'`)
      } else {
        printError('AI generation failed...')
        process.exit(1)
      }
    }

    this.git.createBranch(branchName)

    printStatus('Staging changes...')
    this.git.stageChanges()

    printStatus('Committing changes...')
    this.git.commit(commitMessage)

    const stats = this.git.getChangeStats()
    printSuccess(`Branch '${branchName}' created and changes committed!`)
    printStatus(`Commit message: ${commitMessage}`)
    printStatus(`Files changed: ${changedFiles.length}`)
    printStatus(`Lines added: ${stats.added}, deleted: ${stats.deleted}`)

    console.log('')
    printStatus('Next steps:')
    console.log(`  1. Push the branch: git push -u origin ${branchName}`)
    console.log('  2. Create a pull request')
    console.log('  3. Or continue working on this branch')
  }
}

// Main function
async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const customBranchName = args[0]

  const autoCommit = new AutoCommit()
  await autoCommit.run(customBranchName)
}

// Run the script if called directly
if (import.meta.main) {
  main().catch(error => {
    printError(`Script failed: ${error.message}`)
    process.exit(1)
  })
}
