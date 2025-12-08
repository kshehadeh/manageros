'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { UserLinkForm } from '@/components/user-link-form'
import { JiraAccountLinker } from '@/components/jira-account-linker'
import { GithubAccountLinker } from '@/components/github-account-linker'
import { FaJira, FaGithub } from 'react-icons/fa'
import { User as UserIcon } from 'lucide-react'
import type { PersonJiraAccount, PersonGithubAccount } from '@/generated/prisma'

interface LinkedUser {
  id: string
  name: string
  email: string
  role?: string | null
}

interface AccountLinkingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  personId: string
  personName: string
  personEmail: string | null
  linkedUser?: LinkedUser | null
  jiraAccount?: PersonJiraAccount | null
  githubAccount?: PersonGithubAccount | null
}

export function AccountLinkingModal({
  open,
  onOpenChange,
  personId,
  personName,
  personEmail,
  linkedUser,
  jiraAccount,
  githubAccount,
}: AccountLinkingModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size='sm'>
        <DialogHeader>
          <DialogTitle>Link Accounts</DialogTitle>
        </DialogHeader>
        <div className='space-y-6 py-2'>
          {/* User Account Linking */}
          <div className='space-y-3'>
            <div className='flex items-center gap-2 pb-2 border-b border-muted'>
              <UserIcon className='w-4 h-4 text-muted-foreground' />
              <h4 className='text-sm font-semibold'>User Account</h4>
            </div>
            <UserLinkForm personId={personId} linkedUser={linkedUser} />
          </div>

          {/* Jira Account Linking */}
          <div className='space-y-3'>
            <div className='flex items-center gap-2 pb-2 border-b border-muted'>
              <FaJira className='w-4 h-4 text-muted-foreground' />
              <h4 className='text-sm font-semibold'>Jira Account</h4>
            </div>
            <JiraAccountLinker
              personId={personId}
              personName={personName}
              personEmail={personEmail}
              jiraAccount={jiraAccount}
            />
          </div>

          {/* GitHub Account Linking */}
          <div className='space-y-3'>
            <div className='flex items-center gap-2 pb-2 border-b border-muted'>
              <FaGithub className='w-4 h-4 text-muted-foreground' />
              <h4 className='text-sm font-semibold'>GitHub Account</h4>
            </div>
            <GithubAccountLinker
              personId={personId}
              personName={personName}
              githubAccount={githubAccount}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
