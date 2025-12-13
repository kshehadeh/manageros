# ManagerOS MCP Server

ManagerOS implements a Model Context Protocol (MCP) server that exposes ManagerOS capabilities as MCP tools. This allows MCP-compatible clients (such as Claude Desktop, Cursor, or other AI applications) to interact with ManagerOS data and functionality.

## Overview

The MCP server is available at `/api/mcp` and supports JSON-RPC 2.0 messages over HTTP. It exposes 12 tools that provide access to ManagerOS features:

- **People Management**: Query people in the organization
- **Tasks**: Search and filter tasks
- **Initiatives**: Get information about strategic initiatives
- **Meetings**: Query meeting data
- **Teams**: Get team information
- **Feedback**: Search feedback and feedback campaigns
- **Current User**: Get current user information
- **GitHub Integration**: Search GitHub pull requests and issues
- **Jira Integration**: Search Jira tickets
- **Date/Time Utilities**: Get current date and helpful date ranges
- **Person Lookup**: Find people by name
- **Job Role Lookup**: Find job roles by title

## Authentication

The MCP server uses OAuth Bearer Token authentication. Clients must include a valid OAuth access token in the `Authorization` header:

```
Authorization: Bearer <oauth_access_token>
```

### OAuth Discovery

The MCP server supports OAuth discovery as per RFC 9728. Clients can discover OAuth configuration by:

1. **Well-Known Endpoint**: Access `/.well-known/oauth-protected-resource` to get protected resource metadata
2. **OpenID Connect Discovery**: Access `/.well-known/openid-configuration` for OpenID Connect configuration
3. **WWW-Authenticate Header**: When a 401 Unauthorized response is returned, the `WWW-Authenticate` header includes a `resource_metadata` parameter pointing to the discovery endpoint

The discovery endpoints provide:

- `authorization_servers`: URLs of authorization servers (Clerk)
- `scopes_supported`: List of available OAuth scopes (Clerk supports: `openid`, `profile`, `email`, `public_metadata`, `private_metadata`)
- `jwks_uri`: JSON Web Key Set URI for token validation

**Important**: Clerk supports standard OAuth scopes plus metadata scopes. ManagerOS does not use scope-based authorization. Instead, access control is based on:

- Organization membership (users can only access data from their organization)
- User role within the organization (ADMIN vs USER)
- Entity-specific access rules (e.g., one-on-ones are only visible to participants)

### Obtaining an OAuth Token

1. Create an OAuth application in the Clerk Dashboard
2. Configure the OAuth application with available scopes: `openid`, `profile`, `email`, `public_metadata`, `private_metadata`
3. Use the OAuth 2.0 flow to obtain an access token
4. Include the token in all MCP requests

**Note**: ManagerOS uses organization-based access control, not scope-based authorization. All authenticated users have access to their organization's data based on their role and entity-specific access rules. The OAuth scopes are used for authentication only, not for fine-grained authorization.

For detailed OAuth setup instructions, see [OAuth Authentication](../docs/oauth-authentication.md).

**Discovery Endpoints**:

- `/.well-known/openid-configuration` - OpenID Connect discovery
- `/.well-known/oauth-protected-resource` - OAuth Protected Resource Metadata

## API Endpoint

**URL**: `/api/mcp`  
**Method**: `POST`  
**Content-Type**: `application/json`

## JSON-RPC Protocol

The MCP server follows the JSON-RPC 2.0 specification. All requests must be valid JSON-RPC messages.

### Request Format

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "people",
    "arguments": {
      "query": "John"
    }
  }
}
```

### Response Format

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{...tool result data...}"
      }
    ]
  }
}
```

### Error Format

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32603,
    "message": "Internal error",
    "data": {
      "tool": "people",
      "error": "Error"
    }
  }
}
```

## Supported Methods

### initialize

Initialize the MCP connection. This should be called first.

**Request**:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {}
}
```

**Response**:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "protocolVersion": "2024-11-05",
    "capabilities": {
      "tools": {}
    },
    "serverInfo": {
      "name": "ManagerOS",
      "version": "1.37.0"
    }
  }
}
```

### tools/list

List all available tools.

**Request**:

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/list",
  "params": {}
}
```

**Response**:

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "tools": [
      {
        "name": "people",
        "description": "Get information about people in the organization",
        "inputSchema": {...}
      },
      ...
    ]
  }
}
```

### tools/call

Execute a tool.

**Request**:

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "people",
    "arguments": {
      "query": "John",
      "hasManager": true
    }
  }
}
```

**Response**:

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"people\":[...]}"
      }
    ]
  }
}
```

## Available Tools

### people

Get information about people in the organization.

**Parameters**:

- `query` (string, optional): Search query to filter people by name, role, or team
- `hasManager` (boolean, optional): Whether the person has a manager
- `hasReports` (boolean, optional): Whether to include direct reports
- `managerIs` (string, optional): The person ID of the manager
- `teamIs` (string, optional): The team ID
- `jobRoleIs` (string, optional): The job role ID
- `jobLevelIs` (string, optional): The job level ID
- `jobDomainIs` (string, optional): The job domain ID
- `employeeTypeIs` (string, optional): The employee type (FULL_TIME, PART_TIME, INTERN, CONSULTANT)

### tasks

Get information about tasks in the organization.

**Parameters**:

- `status` (string, optional): Filter by task status (todo, doing, blocked, done, dropped)
- `priority` (number, optional): Filter by task priority (1-4)
- `assigneeId` (string, optional): Filter by assigned person ID
- `initiativeId` (string, optional): Filter by initiative ID
- `query` (string, optional): Search query to filter tasks by title or description
- `updatedAfter` (string, optional): ISO date string - only show tasks updated after this date
- `updatedBefore` (string, optional): ISO date string - only show tasks updated before this date

### initiatives

Get information about initiatives in the organization.

**Parameters**:

- `status` (string, optional): Filter by initiative status (planned, in_progress, paused, done, canceled)
- `rag` (string, optional): Filter by RAG status (green, amber, red)
- `personId` (string, optional): Filter by people who are owners of the initiative
- `teamId` (string, optional): Filter by team ID
- `query` (string, optional): Search query to filter initiatives by title or summary

### meetings

Get information about meetings in the organization.

**Parameters**:

- `ownerId` (string, optional): Filter by meeting owner ID
- `participantId` (string, optional): Filter by participant ID
- `query` (string, optional): Search query to filter meetings by title, description, or notes
- `scheduledAfter` (string, optional): ISO date string - only show meetings scheduled after this date
- `scheduledBefore` (string, optional): ISO date string - only show meetings scheduled before this date
- `createdAfter` (string, optional): ISO date string - only show meetings created after this date
- `createdBefore` (string, optional): ISO date string - only show meetings created before this date

### teams

Get information about teams in the organization.

**Parameters**:

- `parentId` (string, optional): Filter by parent team ID
- `query` (string, optional): Search query to filter teams by name or description

### feedback

Search for feedback data including direct feedback and feedback campaign responses.

**Parameters**:

- `personId` (string, optional): Filter feedback about a specific person by their ID
- `personName` (string, optional): Filter feedback about a specific person by their name
- `fromPersonId` (string, optional): Filter feedback from a specific person by their ID
- `fromPersonName` (string, optional): Filter feedback from a specific person by their name
- `kind` (string, optional): Filter by feedback kind (positive, constructive, general)
- `isPrivate` (boolean, optional): Filter by privacy level
- `includeCampaigns` (boolean, optional): Include feedback campaign responses (default: true)
- `includeDirectFeedback` (boolean, optional): Include direct feedback (default: true)
- `limit` (number, optional): Maximum number of results to return (default: 50, max: 100)

### currentUser

Get information about the current user.

**Parameters**: None

### github

Search GitHub pull requests and issues.

**Parameters**:

- `query` (string, required): Search query for GitHub PRs/issues. Must include "is:pr" or "is:issue"
- `personId` (string, optional): Person ID to lookup their GitHub account (omit for current user)
- `repository` (string, optional): Specific repository to search in (format: owner/repo)
- `state` (string, optional): Filter by PR/issue state (open, closed, all)
- `limit` (number, optional): Maximum number of results to return (default: 20, max: 50)

### jira

Search Jira issues and tickets.

**Parameters**:

- `project` (string, optional): Filter by specific Jira project key
- `statusCategory` (array, optional): Filter by issue status category (Open, In Progress, Done)
- `personId` (string, optional): Person ID to lookup their linked Jira account (omit for current user)
- `assignee` (string, optional): Filter by assignee (email address or account ID)
- `limit` (number, optional): Maximum number of results to return (default: 50, max: 100)

### dateTime

Get the current date and time information with helpful date ranges.

**Parameters**: None

### personLookup

Look up a specific person by name.

**Parameters**:

- `name` (string, required): The name (first, last, or full name) of the person to look up

### jobRoleLookup

Look up a job role by title.

**Parameters**:

- `query` (array, required): Variants of the job role title to look up

## Error Codes

The MCP server uses standard JSON-RPC error codes:

- `-32700`: Parse error
- `-32600`: Invalid Request
- `-32601`: Method not found
- `-32602`: Invalid params
- `-32603`: Internal error
- `401`: Unauthorized (invalid or missing OAuth token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not found

## Security

All MCP requests are subject to ManagerOS security rules:

- Organization-level isolation is enforced
- Users can only access data from their organization
- Tool execution respects existing access control rules
- OAuth token validation is required for all requests

For detailed security requirements, see [Security Requirements](../../.cursor/rules/security-requirements.mdc).

## Example Client Configuration

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "manageros": {
      "command": "curl",
      "args": [
        "-X",
        "POST",
        "-H",
        "Content-Type: application/json",
        "-H",
        "Authorization: Bearer YOUR_OAUTH_TOKEN",
        "-d",
        "@-",
        "https://your-manageros-instance.com/api/mcp"
      ]
    }
  }
}
```

### Cursor

Configure in Cursor settings to use the MCP server endpoint with OAuth authentication.

## Limitations

- Currently supports POST requests only (GET/SSE streaming not yet implemented)
- Stateless mode only (no session management)
- Resources and Prompts features not yet implemented
- Sampling and Elicitation capabilities not yet implemented

## Future Enhancements

- Add Resources support (people lists, task lists as read-only resources)
- Add Prompts support (templated workflows)
- Add Sampling capability (server-initiated LLM calls)
- Add Elicitation capability (form/URL-based user input)
- Implement GET/SSE streaming for real-time updates
- Add session management for stateful connections
