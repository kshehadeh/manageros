# Integrations API

## Overview

The Integrations API provides endpoints for managing integrations and linking entities to external systems.

## Server Actions

### Organization-Level Actions

#### `createOrganizationIntegration`

Create a new organization-level integration.

**Parameters:**

- `integrationType`: `"google_calendar" | "microsoft_outlook" | "jira" | "github"`
- `name`: string
- `credentials`: Record<string, string>
- `metadata?`: Record<string, unknown>

**Returns:** `{ success: true, integrationId: string }`

**Throws:**

- `Error: "User must belong to an organization to create integrations"`
- `Error: "Integration type {type} is not supported at organization level"`
- `Error: "Connection test failed. Please check your credentials."`

#### `updateOrganizationIntegration`

Update an existing organization integration.

**Parameters:**

- `integrationId`: string
- `formData`: {
  - `name?`: string
  - `credentials?`: Record<string, string>
  - `metadata?`: Record<string, unknown>
  - `isEnabled?`: boolean
    }

**Returns:** `{ success: true }`

#### `deleteOrganizationIntegration`

Delete an organization integration.

**Parameters:**

- `integrationId`: string

**Returns:** `{ success: true }`

#### `getOrganizationIntegrations`

Get all integrations for the current organization.

**Returns:** Array of integration objects (without credentials)

#### `testOrganizationIntegration`

Test the connection for an organization integration.

**Parameters:**

- `integrationId`: string

**Returns:** `{ success: boolean, error?: string }`

### User-Level Actions

#### `createUserIntegration`

Create a new user-level integration.

**Parameters:**

- `integrationType`: `"jira" | "github"`
- `name`: string
- `credentials`: Record<string, string>
- `metadata?`: Record<string, unknown>

**Returns:** `{ success: true, integrationId: string }`

#### `updateUserIntegration`

Update an existing user integration.

**Parameters:**

- `integrationId`: string
- `formData`: Same as organization update

**Returns:** `{ success: true }`

#### `deleteUserIntegration`

Delete a user integration.

**Parameters:**

- `integrationId`: string

**Returns:** `{ success: true }`

#### `getUserIntegrations`

Get all integrations for the current user.

**Returns:** Array of integration objects (without credentials)

#### `testUserIntegration`

Test the connection for a user integration.

**Parameters:**

- `integrationId`: string

**Returns:** `{ success: boolean, error?: string }`

### Entity Linking Actions

#### `linkEntityToIntegration`

Link a ManagerOS entity to an external system entity.

**Parameters:**

- `entityType`: string (e.g., "Meeting", "Person")
- `entityId`: string
- `integrationId`: string
- `externalEntityId`: string
- `externalEntityUrl?`: string
- `metadata?`: Record<string, unknown>

**Returns:** `{ success: true }`

#### `unlinkEntityFromIntegration`

Remove a link between a ManagerOS entity and external entity.

**Parameters:**

- `linkId`: string

**Returns:** `{ success: true }`

#### `getEntityIntegrationLinks`

Get all integration links for an entity.

**Parameters:**

- `entityType`: string
- `entityId`: string

**Returns:** Array of link objects

#### `searchExternalEntities`

Search for entities in an external system.

**Parameters:**

- `integrationId`: string
- `query?`: string
- `startDate?`: string
- `endDate?`: string
- `limit?`: number

**Returns:** `{ success: boolean, results: ExternalEntity[], error?: string }`

### Migration Actions

#### `checkMigrationStatus`

Check if user has old credentials that need migration.

**Returns:** `{
  needsMigration: boolean
  hasJira: boolean
  hasGithub: boolean
  migratedJira: boolean
  migratedGithub: boolean
}`

#### `migrateJiraIntegration`

Migrate existing Jira credentials to new system.

**Returns:** `{ success: true, integrationId: string }`

#### `migrateGithubIntegration`

Migrate existing GitHub credentials to new system.

**Returns:** `{ success: true, integrationId: string }`

## API Routes

### POST `/api/integrations/[integrationId]/test`

Test an integration connection.

**Authentication:** Required

**Response:**

```json
{
  "success": true
}
```

### POST `/api/integrations/[integrationId]/search`

Search for entities in an external system.

**Authentication:** Required

**Request Body:**

```json
{
  "query": "search term",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "limit": 50
}
```

**Response:**

```json
{
  "success": true,
  "results": [
    {
      "id": "external-id",
      "title": "Event Title",
      "description": "Event description",
      "url": "https://...",
      "metadata": {}
    }
  ]
}
```

### GET `/api/integrations/[integrationId]/entities/[externalId]`

Get details of a specific external entity.

**Authentication:** Required

**Response:**

```json
{
  "success": true,
  "entity": {
    "id": "external-id",
    "title": "Entity Title",
    "description": "Entity description",
    "url": "https://...",
    "metadata": {}
  }
}
```

## Security

- All organization-level actions require admin role
- User-level actions require user to own the integration
- All credentials are encrypted at rest
- API calls are made server-side only
- Organization-level isolation is enforced
