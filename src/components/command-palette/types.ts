import type { ReactNode } from 'react'
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'

export type CommandId = string

export interface CommandActionContext {
  closePalette: () => void
  router: AppRouterInstance
}

export interface CommandItemDescriptor {
  id: CommandId
  title: string
  subtitle?: string
  icon?: ReactNode
  keywords?: string[]
  group?: string
  perform: (_ctx: CommandActionContext) => void | Promise<void>
}

export interface CommandPermissions {
  'task.create': boolean
  'initiative.create': boolean
  'feedback.create': boolean
  'oneonone.create': boolean
  'feedback-campaign.create': boolean
  'report.create': boolean
  isAdmin: boolean
}

export interface CommandSource {
  id: string
  label: string
  getItems: (
    _query: string,
    _userRole?: string,
    _pathname?: string,
    _currentUserPersonId?: string,
    _permissions?: CommandPermissions,
    _organizationId?: string | null
  ) => Promise<CommandItemDescriptor[]>
}
