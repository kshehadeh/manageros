# Google Calendar Integration

The Google Calendar integration allows you to link ManagerOS meetings with Google Calendar events. This is an organization-level integration that must be configured by an admin.

## Setup

### Prerequisites

- Google Cloud Project with Calendar API enabled
- Service account with Calendar API access
- Organization admin access in ManagerOS

### Step 1: Create Google Cloud Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Calendar API
4. Create a service account:
   - Go to IAM & Admin → Service Accounts
   - Click "Create Service Account"
   - Give it a name (e.g., "ManagerOS Calendar Integration")
   - Grant it the "Calendar API User" role
5. Create a key for the service account:
   - Click on the service account
   - Go to "Keys" tab
   - Click "Add Key" → "Create new key"
   - Choose JSON format
   - Download the key file

### Step 2: Share Calendar with Service Account

1. Open Google Calendar
2. Go to Settings → Settings for my calendars
3. Select the calendar you want to integrate
4. Go to "Share with specific people"
5. Add the service account email (from the JSON key file)
6. Grant "See all event details" permission

### Step 3: Configure in ManagerOS

1. Navigate to Organization Settings → Integrations
2. Click "Add Integration"
3. Select "Google Calendar"
4. Enter:
   - **Name**: A descriptive name (e.g., "Company Calendar")
   - **Service Account Email**: The email from your service account JSON
   - **Private Key**: The `private_key` field from your JSON key file
   - **Calendar ID** (optional): Leave as "primary" for your main calendar, or enter a specific calendar ID
5. Click "Create"
6. The system will test the connection automatically

## Usage

### Linking Meetings to Calendar Events

1. Navigate to a meeting detail page
2. In the sidebar, find the "External Integrations" section
3. Click "Link"
4. Select your Google Calendar integration
5. Search for the calendar event by title or date
6. Select the event and click "Link"

### Viewing Links

Linked calendar events appear in the "External Integrations" section of meeting detail pages. You can:

- View the external event ID
- Click the external link icon to open the event in Google Calendar
- Remove the link if needed

## Troubleshooting

### Connection Test Fails

- Verify the service account email is correct
- Ensure the private key is copied correctly (including newlines)
- Check that the Calendar API is enabled in your Google Cloud project
- Verify the service account has access to the calendar

### Can't Find Events

- Ensure the calendar is shared with the service account
- Check that the Calendar ID is correct (use "primary" for your main calendar)
- Verify the service account has "See all event details" permission

## Security Notes

- Service account credentials are encrypted before storage
- Only organization admins can configure integrations
- All API calls are made server-side only
