#!/bin/bash

# Setup script for AI-powered auto-commit
# This script helps configure the OpenAI API key for the auto-commit script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

echo "🤖 AI-Powered Auto-Commit Setup"
echo "================================"
echo ""

# Check if OPENAI_API_KEY is already set
if [ -n "$OPENAI_API_KEY" ]; then
    print_success "OpenAI API key is already configured!"
    echo "Current key: ${OPENAI_API_KEY:0:8}..."
    echo ""
    read -p "Do you want to update it? (y/N): " update_key
    if [[ ! "$update_key" =~ ^[Yy]$ ]]; then
        print_status "Keeping existing API key"
        exit 0
    fi
fi

echo "To use AI-powered commit messages, you need an OpenAI API key."
echo ""
echo "1. Go to https://platform.openai.com/api-keys"
echo "2. Create a new API key"
echo "3. Copy the key and paste it below"
echo ""

read -p "Enter your OpenAI API key: " api_key

if [ -z "$api_key" ]; then
    print_error "No API key provided"
    exit 1
fi

# Validate the API key format (should start with sk-)
if [[ ! "$api_key" =~ ^sk- ]]; then
    print_warning "API key doesn't start with 'sk-'. Are you sure it's correct?"
    read -p "Continue anyway? (y/N): " continue_anyway
    if [[ ! "$continue_anyway" =~ ^[Yy]$ ]]; then
        print_error "Setup cancelled"
        exit 1
    fi
fi

# Test the API key
print_status "Testing API key..."
test_response=$(curl -s -X POST "https://api.openai.com/v1/chat/completions" \
    -H "Authorization: Bearer $api_key" \
    -H "Content-Type: application/json" \
    -d '{
        "model": "gpt-3.5-turbo",
        "messages": [{"role": "user", "content": "Test"}],
        "max_tokens": 5
    }' 2>/dev/null)

if echo "$test_response" | grep -q "choices"; then
    print_success "API key is valid!"
else
    print_error "API key test failed. Please check your key and try again."
    echo "Response: $test_response"
    exit 1
fi

# Add to shell profile
shell_profile=""
if [ -n "$ZSH_VERSION" ]; then
    shell_profile="$HOME/.zshrc"
elif [ -n "$BASH_VERSION" ]; then
    shell_profile="$HOME/.bashrc"
else
    shell_profile="$HOME/.profile"
fi

# Check if the export is already in the profile
if grep -q "export OPENAI_API_KEY" "$shell_profile" 2>/dev/null; then
    print_status "Updating existing OPENAI_API_KEY in $shell_profile"
    # Remove existing line and add new one
    sed -i.bak "/export OPENAI_API_KEY/d" "$shell_profile"
else
    print_status "Adding OPENAI_API_KEY to $shell_profile"
fi

echo "export OPENAI_API_KEY=\"$api_key\"" >> "$shell_profile"

# Set for current session
export OPENAI_API_KEY="$api_key"

print_success "Setup complete!"
echo ""
echo "The API key has been added to your shell profile: $shell_profile"
echo "You may need to restart your terminal or run: source $shell_profile"
echo ""
echo "Now you can use the auto-commit script with AI-powered suggestions:"
echo "  ./auto-commit.sh"
echo ""
print_status "The script will automatically:"
echo "  • Generate intelligent branch names"
echo "  • Create descriptive commit messages"
echo "  • Fall back to rule-based analysis if AI is unavailable"
