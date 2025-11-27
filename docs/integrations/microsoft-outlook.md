# Microsoft Outlook Integration

The Microsoft Outlook integration allows you to link ManagerOS meetings with Microsoft Outlook calendar events. This is an organization-level integration that must be configured by an admin.

## Setup

### Prerequisites

- Microsoft Azure account
- Azure App Registration with Microsoft Graph API permissions
- Organization admin access in ManagerOS

### Step 1: Register Application in Azure

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to Azure Active Directory → App registrations
3. Click "New registration"
4. Enter a name (e.g., "ManagerOS Calendar Integration")
5. Select supported account types
6. Click "Register"
7. Note the **Application (client) ID** and **Directory (tenant) ID**

### Step 2: Create Client Secret

1. In your app registration, go to "Certificates & secrets"
2. Click "New client secret"
3. Enter a description and expiration
4. Click "Add"
5. **Important**: Copy the secret value immediately (it won't be shown again)

### Step 3: Configure API Permissions

1. Go to "API permissions"
2. Click "Add a permission"
3. Select "Microsoft Graph"
4. Choose "Application permissions"
5. Add the following permissions:
   - `Calendars.Read` - Read calendars
   - `Calendars.ReadWrite` - Read and write calendars (if you plan to sync)
6. Click "Add permissions"
7. Click "Grant admin consent" for your organization

### Step 4: Configure in ManagerOS

1. Navigate to Organization Settings → Integrations
2. Click "Add Integration"
3. Select "Microsoft Outlook"
4. Enter:
   - **Name**: A descriptive name (e.g., "Company Outlook Calendar")
   - **Tenant ID**: Your Azure Directory (tenant) ID
   - **Client ID**: Your Application (client) ID
   - **Client Secret**: The client secret value you copied
5. Click "Create"
6. The system will test the connection automatically

## Usage

### Linking Meetings to Calendar Events

1. Navigate to a meeting detail page
2. In the sidebar, find the "External Integrations" section
3. Click "Link"
4. Select your Microsoft Outlook integration
5. Search for the calendar event by title or date
6. Select the event and click "Link"

### Viewing Links

Linked calendar events appear in the "External Integrations" section of meeting detail pages. You can:

- View the external event ID
- Click the external link icon to open the event in Outlook
- Remove the link if needed

## Troubleshooting

### Connection Test Fails

- Verify the Tenant ID and Client ID are correct
- Ensure the client secret hasn't expired
- Check that API permissions are granted and admin consent is provided
- Verify the app registration is active

### Can't Find Events

- Ensure the app has the correct permissions
- Check that admin consent has been granted
- Verify you're searching in the correct calendar

## Security Notes

- Client secrets are encrypted before storage
- Only organization admins can configure integrations
- All API calls are made server-side only
- OAuth tokens are encrypted and stored securely
