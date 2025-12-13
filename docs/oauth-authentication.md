# OAuth 2.0 Authentication

## Overview

ManagerOS supports OAuth 2.0 authentication using Clerk's built-in OAuth provider. This enables third-party applications and API clients to access ManagerOS APIs using bearer tokens instead of session cookies.

## Architecture

ManagerOS uses a dual authentication system:

1. **Clerk Session Authentication** (default) - For web UI and server-side requests
2. **OAuth Bearer Token Authentication** - For third-party applications and API clients

The authentication system automatically detects the authentication method:

- If an `Authorization: Bearer <token>` header is present, it validates the OAuth token
- Otherwise, it falls back to Clerk session authentication

## Implementation Details

### Token Validation

OAuth tokens are validated using Clerk's token introspection endpoint (`/oauth/token_info`). The validation process:

1. Extracts the bearer token from the `Authorization` header
2. Calls Clerk's `/oauth/token_info` endpoint with Basic Auth (Client ID:Secret)
3. Verifies the token is active and not expired
4. Extracts user information from the token
5. Maps the Clerk user to ManagerOS user record
6. Enforces scope-based permissions

### Code Location

- **Token Validation**: `src/lib/oauth-utils.ts`
- **User Resolution**: `src/lib/auth-utils.ts` (see `getCurrentUserFromToken`)
- **API Route Support**: All `/api/*` routes automatically support bearer tokens

### Environment Variables

Required environment variables for OAuth support:

```bash
CLERK_FRONTEND_API_URL=https://your-app.clerk.accounts.dev
CLERK_OAUTH_CLIENT_ID=your_client_id
CLERK_OAUTH_CLIENT_SECRET=your_client_secret
```

**Note**: These are optional. If not set, OAuth token validation will be skipped and the system will fall back to session authentication.

## OAuth Flow

### 1. Authorization Request

The client redirects the user to Clerk's authorization endpoint:

```
GET {CLERK_FRONTEND_API_URL}/oauth/authorize?
  client_id={CLIENT_ID}&
  response_type=code&
  redirect_uri={REDIRECT_URI}&
  scope={SCOPES}&
  state={RANDOM_STATE}
```

### 2. Token Exchange

After user authorization, exchange the authorization code for an access token:

```bash
POST {CLERK_FRONTEND_API_URL}/oauth/token
Content-Type: application/x-www-form-urlencoded
Authorization: Basic BASE64(CLIENT_ID:CLIENT_SECRET)

grant_type=authorization_code&
code={AUTHORIZATION_CODE}&
redirect_uri={REDIRECT_URI}
```

### 3. API Access

Use the access token in API requests:

```typescript
const response = await fetch('/api/tasks', {
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
})
```

## OAuth Scopes

OAuth scopes define what permissions the application has. Available scopes:

| Scope               | Description                                  | ManagerOS Permissions                                       |
| ------------------- | -------------------------------------------- | ----------------------------------------------------------- |
| `read:people`       | Read people data                             | `person.view`                                               |
| `write:people`      | Create, update, and delete people            | `person.create`, `person.edit`, `person.delete`             |
| `read:tasks`        | Read tasks                                   | `task.view`                                                 |
| `write:tasks`       | Create, update, and delete tasks             | `task.create`, `task.edit`, `task.delete`                   |
| `read:initiatives`  | Read initiatives                             | `initiative.view`                                           |
| `write:initiatives` | Create, update, and delete initiatives       | `initiative.create`, `initiative.edit`, `initiative.delete` |
| `read:meetings`     | Read meetings                                | `meeting.view`                                              |
| `write:meetings`    | Create, update, and delete meetings          | `meeting.create`, `meeting.edit`, `meeting.delete`          |
| `admin`             | Full admin access (organization admins only) | All permissions                                             |

**Important**: The `admin` scope is only granted to users who are organization administrators. Requesting this scope for a non-admin user will result in the scope being omitted from the token.

## Token Refresh

Access tokens expire after a set period. Use the refresh token to obtain a new access token:

```bash
POST {CLERK_FRONTEND_API_URL}/oauth/token
Content-Type: application/x-www-form-urlencoded
Authorization: Basic BASE64(CLIENT_ID:CLIENT_SECRET)

grant_type=refresh_token&
refresh_token={REFRESH_TOKEN}
```

## Testing OAuth

A test script is available to test the OAuth flow:

```bash
bun scripts/test-oauth.ts
```

See `scripts/README-oauth-test.md` for detailed instructions.

## Security Considerations

1. **Token Storage**: Never store OAuth tokens in client-side code or expose them in URLs
2. **HTTPS Only**: Always use HTTPS in production for token transmission
3. **Token Expiration**: Implement token refresh logic to handle expired tokens
4. **Scope Limitation**: Request only the minimum scopes needed for your application
5. **State Parameter**: Always use the `state` parameter to prevent CSRF attacks

## Error Handling

OAuth authentication errors are handled gracefully:

- **Invalid Token**: Returns 401 Unauthorized
- **Expired Token**: Returns 401 Unauthorized (client should refresh)
- **Insufficient Scope**: Returns 403 Forbidden
- **Missing Token**: Falls back to session authentication

## Integration Examples

### TypeScript/JavaScript

```typescript
// 1. Redirect user to authorization
const authUrl = new URL(`${CLERK_FRONTEND_API_URL}/oauth/authorize`)
authUrl.searchParams.set('client_id', CLIENT_ID)
authUrl.searchParams.set('response_type', 'code')
authUrl.searchParams.set('redirect_uri', REDIRECT_URI)
authUrl.searchParams.set('scope', 'read:people read:tasks')
authUrl.searchParams.set('state', generateState())
window.location.href = authUrl.toString()

// 2. Exchange code for token (server-side)
const tokenResponse = await fetch(`${CLERK_FRONTEND_API_URL}/oauth/token`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    Authorization: `Basic ${btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)}`,
  },
  body: new URLSearchParams({
    grant_type: 'authorization_code',
    code: authorizationCode,
    redirect_uri: REDIRECT_URI,
  }),
})
const { access_token, refresh_token } = await tokenResponse.json()

// 3. Use token for API calls
const apiResponse = await fetch('/api/tasks', {
  headers: {
    Authorization: `Bearer ${access_token}`,
  },
})
const { tasks } = await apiResponse.json()
```

### Python

```python
import requests
import base64
from urllib.parse import urlencode

# 1. Authorization URL
auth_params = {
    'client_id': CLIENT_ID,
    'response_type': 'code',
    'redirect_uri': REDIRECT_URI,
    'scope': 'read:people read:tasks',
    'state': generate_state()
}
auth_url = f"{CLERK_FRONTEND_API_URL}/oauth/authorize?{urlencode(auth_params)}"
# Redirect user to auth_url

# 2. Exchange code for token
auth_string = base64.b64encode(f"{CLIENT_ID}:{CLIENT_SECRET}".encode()).decode()
response = requests.post(
    f"{CLERK_FRONTEND_API_URL}/oauth/token",
    headers={
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': f'Basic {auth_string}'
    },
    data={
        'grant_type': 'authorization_code',
        'code': authorization_code,
        'redirect_uri': REDIRECT_URI
    }
)
token_data = response.json()
access_token = token_data['access_token']

# 3. Use token for API calls
api_response = requests.get(
    f"{BASE_URL}/api/tasks",
    headers={'Authorization': f'Bearer {access_token}'}
)
tasks = api_response.json()
```

## Troubleshooting

### Token Validation Fails

- Verify `CLERK_OAUTH_CLIENT_ID` and `CLERK_OAUTH_CLIENT_SECRET` are set correctly
- Ensure these match the OAuth application in Clerk Dashboard
- Check that the token hasn't expired

### API Calls Return 401

- Verify the token is included in the `Authorization` header
- Check that the token format is correct: `Bearer <token>`
- Ensure the token hasn't expired (implement refresh logic)

### API Calls Return 403

- Verify the requested scopes are granted
- Check that the user has the necessary permissions in ManagerOS
- Ensure the user belongs to an organization

### User Not Found

- Verify the Clerk user exists and is linked to a ManagerOS user
- Check that the user belongs to an organization
- Ensure the user has an active account

## Related Documentation

- [API Documentation](./api/README.md) - Complete API reference
- [Security Requirements](../.cursor/rules/security-requirements.mdc) - Access control rules
- [OAuth Test Script](../scripts/README-oauth-test.md) - Testing instructions

## References

- [Clerk OAuth Documentation](https://clerk.com/docs/guides/configure/auth-strategies/oauth/single-sign-on)
- [OAuth 2.0 Specification](https://oauth.net/2/)

---

**Last Updated**: December 2024  
**Status**: Production Ready
