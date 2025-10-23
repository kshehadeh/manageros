#!/bin/bash

# Vercel Build Condition Script
# This script determines whether to build/deploy based on:
# 1. Not the main branch (e.g. PR branches)
# 2. Main branch with commit message starting with "chore: release"

set -e

# Get the current branch and commit message
BRANCH=${VERCEL_GIT_COMMIT_REF:-$(git rev-parse --abbrev-ref HEAD)}
COMMIT_MESSAGE=${VERCEL_GIT_COMMIT_MESSAGE:-$(git log -1 --pretty=%B)}

echo "Branch: $BRANCH"
echo "Commit message: $COMMIT_MESSAGE"

# Check if this is the main branch
if [ "$BRANCH" = "main" ]; then
    # On main branch - only deploy if commit starts with "chore: release"
    if [[ "$COMMIT_MESSAGE" =~ ^chore:\ release ]]; then
        echo "✅ Main branch with release commit - proceeding with build"
        exit 1
    else
        echo "❌ Main branch without release commit - skipping build"
        exit 0
    fi
else
    # Not main branch - always build (for PRs, feature branches, etc.)
    echo "✅ Non-main branch ($BRANCH) - proceeding with build"
    exit 1
fi
