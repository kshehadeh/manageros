# Auto-Commit Script

This script automates the git workflow for creating branches and committing changes when working on the main branch. It features **AI-powered commit message and branch name generation** using OpenAI's GPT models.

## Setup

### 1. Basic Usage (Rule-based)

The script works out of the box with intelligent rule-based analysis.

### 2. AI-Powered Usage (Recommended)

For even better commit messages and branch names, set up AI integration:

```bash
# Run the setup script
./scripts/setup-ai-commit.sh
```

This will:

- Guide you through getting an OpenAI API key
- Test the API key
- Add it to your shell profile
- Verify everything works

## Usage

```bash
# From the project root - AI-powered suggestions
./auto-commit.sh

# With a custom branch name (bypasses AI)
./auto-commit.sh "my-custom-branch-name"
```

## What it does

1. **Checks prerequisites**: Ensures you're on the main branch and have uncommitted changes
2. **AI Analysis**: Uses OpenAI GPT to analyze your diff and generate intelligent suggestions
3. **Fallback Analysis**: If AI is unavailable, uses rule-based analysis
4. **Creates branch**: Creates a new branch with a descriptive name (includes timestamp for uniqueness)
5. **Stages changes**: Adds all modified files to staging
6. **Commits**: Creates a commit with a descriptive message based on the changes

## AI-Powered Features

When you have an OpenAI API key configured, the script will:

- **Analyze your code changes** using GPT-3.5-turbo
- **Generate contextual branch names** that describe what you actually changed
- **Create conventional commit messages** following best practices
- **Understand React/TypeScript patterns** and suggest appropriate naming

### Example AI Outputs

For your recent changes (ReadonlyNotesField integration):

- **Branch**: `enhance-text-display-components`
- **Commit**: `feat: integrate ReadonlyNotesField for better text rendering`

For a bug fix:

- **Branch**: `fix-calendar-date-selection`
- **Commit**: `fix: resolve date picker validation issue`

For new functionality:

- **Branch**: `add-user-preferences-api`
- **Commit**: `feat: implement user preferences management`

## Fallback Logic

If AI is unavailable, the script falls back to rule-based analysis:

- `improve-text-rendering-20251022-1519` - When adding ReadonlyNotesField components
- `add-functionality-20251022-1519` - When adding new functions
- `fix-issue-20251022-1519` - When fixing bugs
- `update-components-20251022-1519` - When updating React components
- `update-styles-20251022-1519` - When updating CSS/styles

## Requirements

- Must be on the `main` branch
- Must have uncommitted changes
- Must be run from a git repository
- For AI features: OpenAI API key (optional, script works without it)

## Safety features

- Only works on main branch to prevent accidental commits to feature branches
- Shows detailed information about what will be committed
- Uses colored output for better visibility
- Includes timestamp in branch names to prevent conflicts
- Graceful fallback if AI service is unavailable
- API key validation during setup

## Troubleshooting

### AI not working?

1. Check if `OPENAI_API_KEY` is set: `echo $OPENAI_API_KEY`
2. Run the setup script again: `./scripts/setup-ai-commit.sh`
3. Verify your API key has credits and proper permissions
4. The script will automatically fall back to rule-based analysis

### API Key Issues?

- Make sure your OpenAI account has credits
- Check that the API key has the right permissions
- Verify the key starts with `sk-`
- Try regenerating the key from OpenAI dashboard
