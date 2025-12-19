'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ActionDropdown } from '@/components/common/action-dropdown'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { DeleteOrganizationDialog } from '@/components/organization/delete-organization-dialog'
import { EditOrganizationProfileModal } from '@/components/organization/edit-organization-profile-modal'
import {
  leaveOrganization,
  deleteOrganization,
} from '@/lib/actions/organization'
import { toast } from 'sonner'
import {
  LogOut,
  Trash2,
  ChevronDown,
  Pickaxe,
  Edit,
  CreditCard,
  Package,
} from 'lucide-react'

interface OrganizationSettingsActionsDropdownProps {
  organizationName: string
}

export function OrganizationSettingsActionsDropdown({
  organizationName,
}: OrganizationSettingsActionsDropdownProps) {
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false)
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)
  const router = useRouter()

  const handleLeaveOrganization = async () => {
    setIsLeaving(true)
    try {
      await leaveOrganization()
      toast.success('You have successfully left the organization')
      // Redirect to dashboard or organization selection
      router.push('/dashboard')
      router.refresh()
    } catch (error) {
      console.error('Failed to leave organization:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to leave organization'
      )
    } finally {
      setIsLeaving(false)
      setIsLeaveDialogOpen(false)
    }
  }

  const handleDeleteOrganization = async () => {
    try {
      await deleteOrganization()
      toast.success('Organization deleted successfully')
      // Redirect to dashboard
      router.push('/dashboard')
      router.refresh()
    } catch (error) {
      console.error('Failed to delete organization:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete organization'
      )
      throw error // Re-throw to let the dialog handle it
    }
  }

  return (
    <>
      <ActionDropdown
        trigger={({ toggle }) => (
          <Button
            variant='outline'
            size='sm'
            className='flex items-center gap-2'
            onClick={toggle}
          >
            <Pickaxe className='w-4 h-4' />
            <span className='hidden sm:inline'>Actions</span>
            <ChevronDown className='w-4 h-4' />
          </Button>
        )}
      >
        {({ close }) => (
          <div className='py-1'>
            <button
              type='button'
              onClick={() => {
                setIsEditProfileModalOpen(true)
                close()
              }}
              className='flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors w-full text-left'
            >
              <Edit className='w-4 h-4' />
              Edit Organization
            </button>
            <button
              type='button'
              onClick={() => {
                router.push('/organization/plans')
                close()
              }}
              className='flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors w-full text-left'
            >
              <Package className='w-4 h-4' />
              Manage Plan
            </button>
            <button
              type='button'
              onClick={() => {
                router.push('/organization/billing')
                close()
              }}
              className='flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors w-full text-left'
            >
              <CreditCard className='w-4 h-4' />
              Organization Billing
            </button>
            <button
              type='button'
              onClick={() => {
                setIsLeaveDialogOpen(true)
                close()
              }}
              className='flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors w-full text-left'
            >
              <LogOut className='w-4 h-4' />
              Leave Organization
            </button>
            <button
              type='button'
              onClick={() => {
                setIsDeleteDialogOpen(true)
                close()
              }}
              className='flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors w-full text-left text-destructive'
            >
              <Trash2 className='w-4 h-4' />
              Delete Organization
            </button>
          </div>
        )}
      </ActionDropdown>

      <AlertDialog open={isLeaveDialogOpen} onOpenChange={setIsLeaveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave Organization</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to leave this organization? You will lose
              access to all organization data and will need to be invited again
              to rejoin. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLeaving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLeaveOrganization}
              disabled={isLeaving}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              {isLeaving ? 'Leaving...' : 'Leave Organization'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <EditOrganizationProfileModal
        open={isEditProfileModalOpen}
        onOpenChange={setIsEditProfileModalOpen}
        currentName={organizationName}
      />

      <DeleteOrganizationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteOrganization}
        organizationName={organizationName}
      />
    </>
  )
}
