# Jira Integration

ManagerOS includes a comprehensive Jira integration that allows you to track work activity for your team members by linking their ManagerOS person records to their Jira accounts.

## Features

### 1. Jira Credentials Management

- **Secure Storage**: API keys are encrypted using AES encryption before being stored in the database
- **Connection Testing**: Credentials are validated against the Jira API before being saved
- **User-specific**: Each user manages their own Jira credentials independently
- **Server-only Enforcement**: Jira credentials are never exposed to the client. All Jira requests and decryption happen on the server. The module `src/lib/jira-api.ts` is marked with server-only enforcement.

### 2. Person-Jira Account Linking

- **Email-based Linking**: Link ManagerOS persons to Jira accounts using their email addresses
- **Automatic Validation**: The system verifies that the Jira account exists and is active
- **Display Name Sync**: Automatically syncs the Jira display name for better identification

### 3. Work Activity Tracking

- **Time Logging**: Track time spent on Jira issues with detailed work descriptions
- **Issue Details**: Display issue titles, types, status, priority, and project information
- **Date Range Filtering**: View work activity for customizable time periods (7, 30, or 90 days)
- **Real-time Sync**: Refresh data directly from Jira API to get the latest information

## Setup Instructions

### 1. Configure Jira Credentials

1. Navigate to **Settings** in the ManagerOS sidebar
2. In the Jira Integration section, enter:
   - **Jira Base URL**: Your Jira instance URL (e.g., `https://yourcompany.atlassian.net`)
   - **Username or Email**: Your Jira username or email address
   - **API Token**: Generate an API token from your Jira account settings
3. Click **Save Credentials** to test and store your configuration

### 2. Generate Jira API Token

1. Log into your Jira instance
2. Go to **Account Settings** → **Security** → **API tokens**
3. Click **Create API token**
4. Give it a descriptive name (e.g., "ManagerOS Integration")
5. Copy the generated token and paste it into ManagerOS

### 3. Link Team Members to Jira Accounts

1. Navigate to a person's detail page
2. In the **Jira Integration** section (admin only), enter the person's Jira email address
3. Click **Link Account** to establish the connection
4. The system will verify the account exists and sync the display name

### 4. View Work Activity

1. Once a person is linked to a Jira account, the **Jira Work Activity** section will appear
2. Use the time period selector to choose how far back to look (7, 30, or 90 days)
3. Click **Refresh** to fetch the latest data from Jira
4. View detailed work logs with time spent, issue details, and work descriptions

## Security Considerations

### API Key Encryption

- All Jira API keys are encrypted using AES encryption before storage
- The encryption key should be set via the `ENCRYPTION_KEY` environment variable
- Never use the default encryption key in production environments

### Access Control

- Only organization admins can link persons to Jira accounts
- Users can only view work activity for persons in their organization
- Jira credentials are user-specific and not shared between users

### Data Privacy

- Work activity data is stored locally in ManagerOS for performance
- Sensitive information like API keys are never logged or exposed
- All API communications use HTTPS for secure transmission

## Technical Details

### Database Schema

The integration adds three new tables:

- **UserJiraCredentials**: Stores encrypted credentials per user
- **PersonJiraAccount**: Links ManagerOS persons to Jira accounts
- **JiraWorkActivity**: Caches work activity data for performance

### API Integration

- Uses Jira REST API v3 for all operations
- Implements proper error handling and rate limiting
- Supports both Jira Cloud and Jira Server instances

### Performance Optimization

- Work activity data is cached locally to reduce API calls
- Batch processing for multiple users to minimize API load
- Configurable date ranges to limit data volume

## Troubleshooting

### Common Issues

1. **Connection Failed**: Verify your Jira URL and credentials are correct
2. **No User Found**: Ensure the email address matches exactly in Jira
3. **Permission Denied**: Check that your Jira account has appropriate permissions
4. **Rate Limited**: Wait a few minutes before retrying API calls

### Error Messages

- **"Failed to connect to Jira"**: Check credentials and URL format
- **"No active Jira user found"**: Verify email address and account status
- **"Jira credentials not configured"**: Set up credentials in Settings first

## Future Enhancements

## UI Consistency

- All actions use the shared shadcn `Button` with `variant='outline'`.
- Icon-only actions use shadcn `Button` with `size='icon'` and Lucide icons.
- Destructive confirmations use `variant='destructive'` only in the confirm state.

Planned improvements include:

- **Bulk Linking**: Link multiple persons to Jira accounts at once
- **Advanced Filtering**: Filter work activity by project, issue type, or status
- **Reporting**: Generate reports on team productivity and time allocation
- **Notifications**: Alert managers when team members haven't logged time recently
- **Integration with Initiatives**: Link Jira issues to ManagerOS initiatives automatically
