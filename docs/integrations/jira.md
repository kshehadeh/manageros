# Jira Integration

ManagerOS includes Jira integration that can be configured at either the organization level or user level. Organization-level integrations allow admins to set up a shared Jira connection for the entire organization, while user-level integrations allow individual users to connect their personal Jira accounts.

## Organization-Level Setup

### Prerequisites

- Jira instance URL
- Jira account with API access
- Organization admin access in ManagerOS

### Step 1: Generate Jira API Token

1. Log into your Jira instance
2. Go to **Account Settings** → **Security** → **API tokens**
3. Click **Create API token**
4. Give it a label (e.g., "ManagerOS Integration")
5. Copy the token immediately (it won't be shown again)

### Step 2: Configure in ManagerOS

1. Navigate to **Organization Settings** → **Integrations**
2. Click **Add Integration**
3. Select **Jira**
4. Enter:
   - **Name**: A descriptive name (e.g., "Company Jira")
   - **Jira Username or Email**: Your Jira account email
   - **Jira Base URL**: Your Jira instance URL (e.g., `https://yourcompany.atlassian.net`)
   - **API Token**: The token you generated
5. Click **Create**
6. The system will test the connection automatically

## User-Level Setup

User-level Jira integration follows the same setup process but is configured in **Settings** → **Integrations** instead of Organization Settings.

## Usage

### Linking Persons to Jira Accounts

1. Navigate to a person's detail page
2. In the sidebar, find the "External Integrations" section
3. Click **Link**
4. Select your Jira integration (organization or user-level)
5. Search for the Jira user by email
6. Select the user and click **Link**

### Viewing Links

Linked Jira accounts appear in the "External Integrations" section of person detail pages. You can:

- View the Jira account ID and email
- Remove the link if needed

## Features

- **Work Activity Tracking**: View assigned tickets for linked persons
- **Account Linking**: Link ManagerOS persons to Jira accounts
- **Organization or Personal**: Choose organization-wide or personal integration

## Troubleshooting

### Connection Test Fails

- Verify the Jira base URL is correct
- Ensure the API token is valid and hasn't expired
- Check that the username/email matches your Jira account
- Verify your Jira account has API access enabled

### Can't Find Users

- Ensure the Jira account exists and is active
- Verify the email address matches exactly
- Check that the integration has permission to search users

## Security Notes

- API tokens are encrypted before storage
- Organization integrations require admin role
- User integrations are isolated to individual users
- All API calls are made server-side only
