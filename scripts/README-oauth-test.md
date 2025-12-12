# OAuth Test Script

This script tests the OAuth 2.0 authentication flow for ManagerOS.

## Prerequisites

1. **OAuth Application in Clerk Dashboard:**
   - Create an OAuth application in Clerk Dashboard
   - Note the Client ID and Client Secret
   - Add redirect URI: `http://localhost:3001/callback`

2. **Environment Variables:**
   Add these to your `.env` file:
   ```bash
   CLERK_FRONTEND_API_URL="https://your-app.clerk.accounts.dev"
   CLERK_OAUTH_CLIENT_ID="vLgNVKNwluqSJpWz"  # Your OAuth Client ID
   CLERK_OAUTH_CLIENT_SECRET="your_client_secret_here"
   BASE_URL="http://localhost:3000"  # Optional, defaults to localhost:3000
   ```

## Usage

```bash
# Run the OAuth test script
bun run test:oauth

# Or directly
bun scripts/test-oauth.ts
```

## What the Script Does

1. **Starts a local callback server** on port 3001
2. **Opens your browser** to the Clerk authorization page
3. **Waits for authorization** - you'll need to sign in and approve the application
4. **Exchanges the authorization code** for an access token
5. **Validates the token** using Clerk's token introspection endpoint
6. **Gets user information** from Clerk
7. **Tests ManagerOS API endpoints** with the bearer token:
   - `/api/user/current`
   - `/api/people` (if `read:people` scope is granted)
   - `/api/tasks` (if `read:tasks` scope is granted)
   - `/api/initiatives` (if `read:initiatives` scope is granted)

## Expected Output

The script will:

- Show configuration details
- Open a browser for authorization
- Display the access token and refresh token (if provided)
- Show token validation results
- Display user information
- Test each API endpoint and show the response

## Troubleshooting

### Port 3001 Already in Use

If port 3001 is already in use, you can modify the `REDIRECT_PORT` constant in the script.

### Browser Doesn't Open

The script will print the authorization URL if it can't open the browser automatically. Copy and paste it into your browser.

### Authorization Fails

- Make sure the redirect URI in Clerk Dashboard matches: `http://localhost:3001/callback`
- Verify your Client ID and Client Secret are correct
- Check that the OAuth application is enabled in Clerk Dashboard

### Token Validation Fails

- Ensure `CLERK_OAUTH_CLIENT_ID` and `CLERK_OAUTH_CLIENT_SECRET` are set correctly
- Verify these match the OAuth application in Clerk Dashboard

### API Calls Fail

- Make sure ManagerOS is running on the BASE_URL (default: http://localhost:3000)
- Verify the user has the necessary permissions in ManagerOS
- Check that the requested scopes are granted
