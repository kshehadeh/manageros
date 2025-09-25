import type { ReactNode } from 'react'

export type CommandId = string

export interface CommandActionContext {
  closePalette: () => void
}

export interface CommandItemDescriptor {
  id: CommandId
  title: string
  subtitle?: string
  icon?: ReactNode
  keywords?: string[]
  group?: string
  perform: (ctx: CommandActionContext) => void | Promise<void>
}

export interface CommandSource {
  id: string
  label: string
  getItems: (query: string) => Promise<CommandItemDescriptor[]>
}

