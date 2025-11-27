# GitHub Integration

ManagerOS includes GitHub integration that can be configured at either the organization level or user level. Organization-level integrations allow admins to set up a shared GitHub connection for the entire organization, while user-level integrations allow individual users to connect their personal GitHub accounts.

## Organization-Level Setup

### Prerequisites

- GitHub account with Personal Access Token (PAT)
- Organization admin access in ManagerOS

### Step 1: Generate GitHub Personal Access Token

1. Go to [GitHub Settings](https://github.com/settings/tokens)
2. Navigate to **Developer settings** → **Personal access tokens** → **Tokens (classic)**
3. Click **Generate new token (classic)**
4. Give it a name (e.g., "ManagerOS Integration")
5. Select scopes:
   - `repo` - Full control of private repositories (if you need private repo access)
   - `read:user` - Read user profile data
   - `read:org` - Read org and team membership (if you need organization data)
6. Click **Generate token**
7. **Important**: Copy the token immediately (it won't be shown again)

### Step 2: Configure in ManagerOS

1. Navigate to **Organization Settings** → **Integrations**
2. Click **Add Integration**
3. Select **GitHub**
4. Enter:
   - **Name**: A descriptive name (e.g., "Company GitHub")
   - **GitHub Username**: Your GitHub username
   - **Personal Access Token**: The PAT you generated
5. Click **Create**
6. The system will test the connection automatically

## User-Level Setup

User-level GitHub integration follows the same setup process but is configured in **Settings** → **Integrations** instead of Organization Settings.

## Usage

### Linking Persons to GitHub Accounts

1. Navigate to a person's detail page
2. In the sidebar, find the "External Integrations" section
3. Click **Link**
4. Select your GitHub integration (organization or user-level)
5. Search for the GitHub user by username
6. Select the user and click **Link**

### Viewing Links

Linked GitHub accounts appear in the "External Integrations" section of person detail pages. You can:

- View the GitHub username
- Click the external link icon to open the GitHub profile
- Remove the link if needed

## Features

- **Pull Request Tracking**: View recent pull requests for linked persons
- **Account Linking**: Link ManagerOS persons to GitHub accounts
- **Organization or Personal**: Choose organization-wide or personal integration
- **Organization Filtering**: Filter PRs by allowed GitHub organizations (for user-level integrations)

## Troubleshooting

### Connection Test Fails

- Verify the Personal Access Token is valid and hasn't expired
- Ensure the token has the required scopes
- Check that the username is correct
- Verify the token hasn't been revoked

### Can't Find Users

- Ensure the GitHub username is correct
- Verify the user account exists and is not suspended
- Check that the integration has permission to read user data

## Security Notes

- Personal Access Tokens are encrypted before storage
- Organization integrations require admin role
- User integrations are isolated to individual users
- All API calls are made server-side only
- Tokens should be rotated periodically for security
