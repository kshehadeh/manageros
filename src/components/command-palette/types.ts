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

export interface CommandSource {
  id: string
  label: string
  getItems: (
    _query: string,
    _userRole?: string
  ) => Promise<CommandItemDescriptor[]>
}
