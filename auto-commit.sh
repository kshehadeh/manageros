#!/bin/bash

# Auto-commit script for ManagerOS
# Usage: ./auto-commit.sh [optional-custom-branch-name]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Find the git repository root dynamically
if git rev-parse --show-toplevel > /dev/null 2>&1; then
    PROJECT_ROOT="$(git rev-parse --show-toplevel)"
else
    # Fallback: assume script is in the project root
    PROJECT_ROOT="$SCRIPT_DIR"
fi

# Change to project root
cd "$PROJECT_ROOT"

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    print_error "Not in a git repository"
    exit 1
fi

# Check if we're on main branch
current_branch=$(git branch --show-current)
if [ "$current_branch" != "main" ]; then
    print_error "Not on main branch. Current branch: $current_branch"
    print_warning "This script only works when on the main branch"
    exit 1
fi

# Check if there are any changes
if git diff --quiet && git diff --cached --quiet; then
    print_warning "No changes to commit"
    exit 0
fi

# Get the list of changed files
changed_files=$(git diff --name-only)
if [ -z "$changed_files" ]; then
    print_warning "No unstaged changes found"
    exit 0
fi

print_status "Analyzing changes..."

# Function to generate AI-powered commit message and branch name
generate_ai_suggestions() {
    local diff_content="$1"
    local changed_files="$2"
    
    # Create a prompt for the AI
    local prompt="Based on the following git diff, generate a concise branch name (kebab-case, max 30 chars) and commit message (max 50 chars) for a React/TypeScript project.

Files changed: $changed_files

Diff:
$diff_content

Respond in JSON format:
{
  \"branch_name\": \"descriptive-branch-name\",
  \"commit_message\": \"Concise commit message\"
}

Focus on:
- What functionality was added/changed
- Which components were affected
- The purpose of the changes
- Use conventional commit format when appropriate"
    
    # Try to use OpenAI API if available
    if command -v curl >/dev/null 2>&1 && [ -n "$OPENAI_API_KEY" ]; then
        local response=$(curl -s -X POST "https://api.openai.com/v1/chat/completions" \
            -H "Authorization: Bearer $OPENAI_API_KEY" \
            -H "Content-Type: application/json" \
            -d "{
                \"model\": \"gpt-3.5-turbo\",
                \"messages\": [{\"role\": \"user\", \"content\": \"$prompt\"}],
                \"max_tokens\": 200,
                \"temperature\": 0.3
            }" 2>/dev/null)
        
        if [ $? -eq 0 ] && echo "$response" | grep -q "choices"; then
            local ai_branch=$(echo "$response" | grep -o '"branch_name":"[^"]*"' | sed 's/"branch_name":"\([^"]*\)"/\1/')
            local ai_commit=$(echo "$response" | grep -o '"commit_message":"[^"]*"' | sed 's/"commit_message":"\([^"]*\)"/\1/')
            
            if [ -n "$ai_branch" ] && [ -n "$ai_commit" ]; then
                echo "$ai_branch|$ai_commit"
                return 0
            fi
        fi
    fi
    
    # Fallback to local analysis if AI is not available
    return 1
}

# Analyze the changes to determine branch name and commit message
branch_name=""
commit_message=""

# Count changes by type
added_lines=$(git diff --numstat | awk '{sum += $1} END {print sum+0}')
deleted_lines=$(git diff --numstat | awk '{sum += $2} END {print sum+0}')
changed_files_count=$(echo "$changed_files" | wc -l | tr -d ' ')

# Get file extensions to understand the type of changes
file_extensions=$(echo "$changed_files" | sed 's/.*\.//' | sort | uniq | tr '\n' ' ')

# Analyze the diff content for specific patterns
diff_content=$(git diff)

# Check if custom branch name was provided
if [ -n "$1" ]; then
    branch_name="$1"
    commit_message="Update: $1"
else
    # Try AI generation first
    print_status "Generating AI-powered suggestions..."
    ai_result=$(generate_ai_suggestions "$diff_content" "$changed_files")

    if [ $? -eq 0 ] && [ -n "$ai_result" ]; then
        branch_name=$(echo "$ai_result" | cut -d'|' -f1)
        commit_message=$(echo "$ai_result" | cut -d'|' -f2)
        print_success "AI generated: '$branch_name' - '$commit_message'"
    else
        print_warning "AI generation failed, using fallback analysis..."
        
        # Fallback to rule-based analysis
        if echo "$diff_content" | grep -q "ReadonlyNotesField"; then
            if echo "$changed_files" | grep -q "inline-editable-text\|data-table-config"; then
                branch_name="improve-text-rendering"
                commit_message="Improve text rendering with ReadonlyNotesField component"
            else
                branch_name="add-readonly-notes-field"
                commit_message="Add ReadonlyNotesField component usage"
            fi
        elif echo "$diff_content" | grep -q "import.*from"; then
            branch_name="add-imports"
            commit_message="Add new imports"
        elif echo "$diff_content" | grep -q "function\|const.*="; then
            branch_name="add-functionality"
            commit_message="Add new functionality"
        elif echo "$diff_content" | grep -q "fix\|bug\|error"; then
            branch_name="fix-issue"
            commit_message="Fix issue"
        elif echo "$file_extensions" | grep -q "tsx\|ts"; then
            branch_name="update-components"
            commit_message="Update React components"
        elif echo "$file_extensions" | grep -q "css\|scss"; then
            branch_name="update-styles"
            commit_message="Update styles"
        else
            # Generic fallback based on file count and changes
            if [ "$changed_files_count" -eq 1 ]; then
                file_name=$(basename $(echo "$changed_files" | head -1) | sed 's/\.[^.]*$//')
                branch_name="update-$(echo "$file_name" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g')"
                commit_message="Update $file_name"
            else
                branch_name="update-files"
                commit_message="Update multiple files"
            fi
        fi
    fi
fi

# Add timestamp to make branch name unique
timestamp=$(date +"%Y%m%d-%H%M")
branch_name="${branch_name}-${timestamp}"

print_status "Creating branch: $branch_name"
git checkout -b "$branch_name"

print_status "Staging changes..."
git add .

print_status "Committing changes..."
git commit -m "$commit_message"

print_success "Branch '$branch_name' created and changes committed!"
print_status "Commit message: $commit_message"
print_status "Files changed: $changed_files_count"
print_status "Lines added: $added_lines, deleted: $deleted_lines"

echo ""
print_status "Next steps:"
echo "  1. Push the branch: git push -u origin $branch_name"
echo "  2. Create a pull request"
echo "  3. Or continue working on this branch"
