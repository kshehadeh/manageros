#!/bin/bash

# Auto-commit script for ManagerOS
# Creates a branch, stages changes, and commits with appropriate message

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

# Determine branch name and commit message based on changes
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
