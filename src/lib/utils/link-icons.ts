// import { ExternalLink } from 'lucide-react'
import {
  FaGithub,
  FaGitlab,
  FaBitbucket,
  FaGoogle,
  FaGoogleDrive,
  FaYoutube,
  FaSlack,
  FaDiscord,
  FaMicrosoft,
  FaAws,
  FaFigma,
  FaTrello,
  FaDropbox,
  FaJira,
  FaConfluence,
  FaAtlassian,
  FaVimeo,
  FaHotjar,
  FaBox,
} from 'react-icons/fa'

import {
  SiGooglecalendar,
  SiGoogledocs,
  SiGooglesheets,
  SiGoogleslides,
  SiGooglemeet,
  SiNotion,
  SiZoom,
  SiGoogleanalytics,
  SiGooglecloud,
} from 'react-icons/si'

import {
  ExternalLink as ExternalLinkIcon,
  FileText,
  Video,
  Image,
  Calendar,
  Users,
  Zap,
  Database,
  Cloud,
  Shield,
  BarChart3,
  CheckCircle,
  Share2,
  Upload,
  Mail,
  Key,
} from 'lucide-react'

import type { LucideIcon } from 'lucide-react'

// Type for both Lucide and React Icons
type IconComponent = LucideIcon | React.ComponentType<{ className?: string }>

/**
 * Domain-to-icon mapping for common services using react-icons for brand icons
 */
const DOMAIN_ICON_MAP: Record<string, IconComponent> = {
  // Code repositories and development
  'github.com': FaGithub,
  'gitlab.com': FaGitlab,
  'bitbucket.org': FaBitbucket,
  'dev.azure.com': FaMicrosoft,

  // Atlassian products
  'atlassian.net': FaAtlassian,
  'jira.com': FaJira,
  'confluence.com': FaConfluence,
  'trello.com': FaTrello,

  // Google services
  'google.com': FaGoogle,
  'docs.google.com': SiGoogledocs,
  'drive.google.com': FaGoogleDrive,
  'sheets.google.com': SiGooglesheets,
  'slides.google.com': SiGoogleslides,
  'calendar.google.com': SiGooglecalendar,
  'meet.google.com': SiGooglemeet,

  // Microsoft services
  'microsoft.com': FaMicrosoft,
  'teams.microsoft.com': Users,
  'outlook.com': Mail,
  'onedrive.com': Cloud,
  'sharepoint.com': Share2,

  // Video platforms
  'youtube.com': FaYoutube,
  'vimeo.com': FaVimeo,
  'zoom.us': SiZoom,
  'webex.com': Video,

  // Social and communication
  'slack.com': FaSlack,
  'discord.com': FaDiscord,

  // Cloud services
  'aws.amazon.com': FaAws,
  'cloud.google.com': SiGooglecloud,
  'heroku.com': Cloud,
  'vercel.com': Cloud,
  'netlify.com': Cloud,

  // Documentation and wikis
  'notion.so': SiNotion,
  'obsidian.md': FileText,
  'roamresearch.com': FileText,
  'logseq.com': FileText,

  // Design tools
  'figma.com': FaFigma,
  'sketch.com': Image,
  'adobe.com': Image,
  'canva.com': Image,

  // Analytics and monitoring
  'analytics.google.com': SiGoogleanalytics,
  'mixpanel.com': BarChart3,
  'amplitude.com': BarChart3,
  'hotjar.com': FaHotjar,
  'datadoghq.com': Database,
  'newrelic.com': Database,

  // Project management
  'asana.com': CheckCircle,
  'monday.com': Calendar,
  'clickup.com': CheckCircle,
  'linear.app': Zap,
  'airtable.com': Database,

  // File sharing
  'dropbox.com': FaDropbox,
  'box.com': FaBox,
  'wetransfer.com': Upload,

  // Security
  'auth0.com': Shield,
  'okta.com': Shield,
  '1password.com': Key,
  'lastpass.com': Key,
}

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname.toLowerCase()
  } catch {
    return ''
  }
}

/**
 * Get icon for a given URL based on domain
 */
export function getIconForUrl(url: string): IconComponent {
  const domain = extractDomain(url)

  // Check for exact domain match first
  if (DOMAIN_ICON_MAP[domain]) {
    return DOMAIN_ICON_MAP[domain]
  }

  // Check for subdomain matches
  for (const [mappedDomain, icon] of Object.entries(DOMAIN_ICON_MAP)) {
    if (domain.endsWith('.' + mappedDomain)) {
      return icon
    }
  }

  // Default icon based on URL pattern
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return FaYoutube
  }

  if (url.includes('github.com') || url.includes('github.io')) {
    return FaGithub
  }

  if (url.includes('atlassian.net') || url.includes('jira.com')) {
    return FaJira
  }

  if (url.includes('confluence.com')) {
    return FaConfluence
  }

  if (url.includes('docs.google.com')) {
    return SiGoogledocs
  }

  if (url.includes('drive.google.com')) {
    return FaGoogleDrive
  }

  if (url.includes('sheets.google.com')) {
    return SiGooglesheets
  }

  if (url.includes('slides.google.com')) {
    return SiGoogleslides
  }

  if (url.includes('calendar.google.com')) {
    return SiGooglecalendar
  }

  if (url.includes('meet.google.com')) {
    return SiGooglemeet
  }

  if (url.includes('teams.microsoft.com')) {
    return Users
  }

  if (url.includes('slack.com')) {
    return FaSlack
  }

  if (url.includes('figma.com')) {
    return FaFigma
  }

  if (url.includes('notion.so')) {
    return SiNotion
  }

  if (url.includes('trello.com')) {
    return FaTrello
  }

  if (url.includes('asana.com')) {
    return CheckCircle
  }

  if (url.includes('linear.app')) {
    return Zap
  }

  if (url.includes('airtable.com')) {
    return Database
  }

  if (url.includes('dropbox.com')) {
    return FaDropbox
  }

  if (url.includes('aws.amazon.com')) {
    return FaAws
  }

  if (url.includes('azure.microsoft.com')) {
    return Cloud
  }

  if (url.includes('vercel.com')) {
    return Cloud
  }

  if (url.includes('netlify.com')) {
    return Cloud
  }

  // Default fallback
  return ExternalLinkIcon
}

/**
 * Get a human-readable title for a URL
 */
export function getUrlTitle(url: string): string {
  try {
    const urlObj = new URL(url)
    const domain = urlObj.hostname.toLowerCase()

    // Remove common prefixes
    const cleanDomain = domain
      .replace(/^www\./, '')
      .replace(/^m\./, '')
      .replace(/^app\./, '')
      .replace(/^my\./, '')

    return cleanDomain
  } catch {
    return 'External Link'
  }
}

/**
 * Check if URL is likely to be a specific type of content
 */
export function getUrlType(
  url: string
): 'video' | 'document' | 'image' | 'code' | 'social' | 'other' {
  const domain = extractDomain(url)

  if (
    domain.includes('youtube.com') ||
    domain.includes('youtu.be') ||
    domain.includes('vimeo.com')
  ) {
    return 'video'
  }

  if (
    domain.includes('github.com') ||
    domain.includes('gitlab.com') ||
    domain.includes('bitbucket.org')
  ) {
    return 'code'
  }

  if (
    domain.includes('docs.google.com') ||
    domain.includes('notion.so') ||
    domain.includes('confluence.com')
  ) {
    return 'document'
  }

  if (
    domain.includes('figma.com') ||
    domain.includes('sketch.com') ||
    domain.includes('canva.com')
  ) {
    return 'image'
  }

  if (
    domain.includes('slack.com') ||
    domain.includes('discord.com') ||
    domain.includes('teams.microsoft.com')
  ) {
    return 'social'
  }

  return 'other'
}
