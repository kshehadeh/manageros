# GitHub Bug Reporting Integration

This document explains how to set up and use the GitHub bug reporting feature in ManagerOS.

## Overview

The bug reporting feature allows users to submit bug reports directly from the ManagerOS UI to the GitHub repository `kshehadeh/manageros`. When a user submits a bug report, it creates a new GitHub issue with the label `user-submitted`.

## Setup

### 1. GitHub Personal Access Token

To enable the GitHub integration, you need to create a GitHub Personal Access Token:

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a descriptive name like "ManagerOS Bug Reports"
4. Select the `repo` scope (full control of private repositories)
5. Click "Generate token"
6. Copy the token (you won't be able to see it again)

### 2. Environment Variables

Add the GitHub token to your environment variables:

```bash
# In your .env.local file
GITHUB_TOKEN=your_github_token_here
```

### 3. Cloudflare R2 Setup

For image uploads, you'll also need to set up Cloudflare R2:

```bash
# In your .env.local file
CLOUDFLARE_R2_ACCOUNT_ID=your_account_id_here
CLOUDFLARE_R2_ACCESS_KEY_ID=your_api_token_here
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_api_token_here
CLOUDFLARE_R2_BUCKET_NAME=your_bucket_name_here
CLOUDFLARE_R2_PUBLIC_URL=https://your-bucket.your-domain.com
```

See [Cloudflare R2 Setup Guide](./cloudflare-r2-setup.md) for detailed instructions.

### 4. Repository Access

Make sure the GitHub token has access to the `kshehadeh/manageros` repository. The token needs to be able to create issues in this repository.

## Usage

### For Users

1. Click the "Report Bug" button in the top-right corner of the application
2. Fill in the bug report form:
   - **Title**: Brief description of the issue
   - **Description**: Detailed description including steps to reproduce, expected behavior, and actual behavior
   - **Images**: Optional images to help illustrate the issue (drag & drop or browse files)
   - **Include Email**: Checkbox to optionally include your email address in the issue description (unchecked by default)
3. Click "Submit Bug Report"
4. A success toast will appear with a link to the created GitHub issue

### For Developers

The bug reports will appear in the GitHub repository with:

- The `user-submitted` label
- The user's email in the issue body (if they chose to include it) or "Anonymous user"
- The detailed description provided by the user
- Images attached to the issue (if provided) with inline display

## Technical Details

### Components

- `BugReportButton`: The button component in the top bar
- `BugSubmissionModal`: The modal form for submitting bug reports with image upload and email inclusion options
- `submitGitHubIssue`: Server action that handles the GitHub API call with optional image uploads and email inclusion
- `uploadImageToR2`: Server action that uploads images to Cloudflare R2 and returns URLs for inclusion in issues

### API Integration

The feature uses the GitHub Issues API:

- **Endpoint**: `https://api.github.com/repos/kshehadeh/manageros/issues`
- **Method**: POST
- **Authentication**: GitHub Personal Access Token
- **Labels**: Automatically adds `user-submitted` label

### Image Upload

Images are uploaded using Cloudflare R2's S3-compatible API:

- **SDK**: AWS SDK (`@aws-sdk/client-s3`) for reliable S3-compatible operations
- **Supported Formats**: JPEG, PNG, GIF, WebP
- **Maximum Size**: 10MB per image
- **Upload Process**: Images are uploaded to Cloudflare R2 first, then URLs are included in the issue description
- **Storage**: Images are stored on Cloudflare R2 with global CDN
- **Display**: Images appear inline in GitHub issues using Markdown syntax
- **Cost**: Free tier includes 10GB storage and 1M requests per month
- **API**: Uses S3-compatible API for better reliability and error handling

### Error Handling

The system handles various error scenarios:

- Missing or invalid GitHub token
- Empty title or description
- GitHub API errors (rate limits, permissions, etc.)
- Network connectivity issues

## Testing

Run the GitHub integration tests:

```bash
bun test tests/actions/github.test.ts
```

The tests cover:

- Successful issue submission
- Validation of required fields
- Error handling for missing configuration
- GitHub API error handling

## Security Considerations

- The GitHub token should be kept secure and not committed to version control
- The token only needs `repo` scope for creating issues
- User emails are included in issue bodies for contact purposes
- No sensitive application data is sent to GitHub
- Server-only enforcement: All GitHub API calls and token usage occur on the server via the `submitGitHubIssue` server action and the server-only `src/lib/github-api.ts` module. No GitHub credentials or tokens are ever used on the client.

## Troubleshooting

### Common Issues

1. **"GitHub integration is not configured"**
   - Check that `GITHUB_TOKEN` environment variable is set
   - Verify the token is valid and not expired

2. **"GitHub API error: 401 Unauthorized"**
   - Token may be invalid or expired
   - Check token permissions (needs `repo` scope)

3. **"GitHub API error: 403 Forbidden"**
   - Token doesn't have access to the repository
   - Repository may be private and token lacks access

4. **"GitHub API error: 422 Unprocessable Entity"**
   - Issue title or body may be too long
   - Invalid characters in the issue data

### Debug Mode

To debug issues, check the browser console and server logs for detailed error messages.
