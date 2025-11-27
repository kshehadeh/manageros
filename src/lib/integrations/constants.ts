/* eslint-disable camelcase */
/**
 * Shared constants for integrations
 */

import type { IntegrationType } from './base-integration'

export const integrationTypeLabels: Record<IntegrationType, string> = {
  google_calendar: 'Google Calendar',
  microsoft_outlook: 'Microsoft Outlook',
  jira: 'Jira',
  github: 'GitHub',
}
