# Integration System Overview

ManagerOS includes a unified integration system that supports both organization-level and user-level integrations. This system allows you to connect ManagerOS with external services and link entities across platforms.

## Architecture

The integration system is built on a flexible architecture that supports:

- **Organization-level integrations**: Configured by admins for the entire organization (e.g., Google Calendar, Microsoft Outlook)
- **User-level integrations**: Configured by individual users for personal tracking (e.g., Jira, GitHub)

## Integration Types

### Organization-Level Integrations

- **Google Calendar**: Link ManagerOS meetings with Google Calendar events
- **Microsoft Outlook**: Link ManagerOS meetings with Microsoft Outlook calendar events
- **Jira**: Organization-wide Jira integration for linking persons to Jira accounts
- **GitHub**: Organization-wide GitHub integration for linking persons to GitHub accounts

### User-Level Integrations

- **Jira**: Personal Jira integration for individual work activity tracking
- **GitHub**: Personal GitHub integration for individual pull request tracking

## Features

### Integration Management

- Create, update, and delete integrations
- Test connection credentials before saving
- Enable/disable integrations
- Encrypted credential storage

### Entity Linking

- Link ManagerOS entities (Meetings, Persons, etc.) to external system entities
- View and manage links from entity detail pages
- Search external systems to find entities to link

### Security

- All credentials encrypted at rest
- Organization-level isolation
- User-level integrations isolated to individual users
- Admin-only access for organization integrations

## Getting Started

1. **For Organization Integrations**: Navigate to Organization Settings → Integrations
2. **For User Integrations**: Navigate to Settings → Integrations
3. Click "Add Integration" and follow the setup guide for your chosen integration type

## Migration from Legacy System

If you have existing Jira or GitHub credentials configured, you can migrate them to the new unified system. A migration banner will appear in your settings if migration is needed.

## Future Integrations

The system is designed to be extensible. New integration types can be added by implementing the base integration interface. Planned future integrations include:

- Slack
- Asana
- Trello
- And more...
