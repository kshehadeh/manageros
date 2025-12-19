'use client'

import { useState } from 'react'
import { Shield, ShieldCheck, UserMinus } from 'lucide-react'
import { ContextMenuItem } from '@/components/common/context-menu-items'
import { Separator } from '@/components/ui/separator'
import { updateUserRole } from '@/lib/actions/organization'
import { toast } from 'sonner'

interface OrganizationMember {
  id: string
  name: string
  email: string
  role: string
  createdAt: Date
  person?: {
    id: string
    name: string
    role: string | null
    status: string
    team?: {
      id: string
      name: string
    } | null
  } | null
}

interface MemberActionsMenuProps {
  member: OrganizationMember
  currentUserId: string
  currentUserRole: 'ADMIN' | 'OWNER' | 'USER'
  close: () => void
  refetch: () => void
  onRemoveClick?: (
    memberId: string,
    memberName: string,
    memberEmail: string,
    refetch: () => void
  ) => void
}

export function MemberActionsMenu({
  member,
  currentUserId,
  currentUserRole,
  close,
  refetch,
  onRemoveClick,
}: MemberActionsMenuProps) {
  const [isChangingRole, setIsChangingRole] = useState(false)

  // Only admins and owners can manage users
  const canManage = currentUserRole === 'ADMIN' || currentUserRole === 'OWNER'

  // Don't show actions if user can't manage or if it's themselves
  if (!canManage || member.id === currentUserId) {
    return null
  }

  // Determine available role changes
  const currentRole = member.role as 'ADMIN' | 'OWNER' | 'USER'
  const canChangeToAdmin = currentRole !== 'ADMIN' && currentRole !== 'OWNER'
  const canChangeToUser = currentRole === 'ADMIN'

  const handleRoleChange = async (newRole: 'ADMIN' | 'USER') => {
    if (isChangingRole) return

    try {
      setIsChangingRole(true)
      await updateUserRole(member.id, newRole)
      toast.success(
        `${member.name || member.email} role changed to ${newRole === 'ADMIN' ? 'Admin' : 'User'}`
      )
      refetch()
      close()
    } catch (error) {
      console.error('Failed to update user role:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to update user role'
      )
    } finally {
      setIsChangingRole(false)
    }
  }

  const handleRemoveClick = () => {
    console.log(
      'Remove clicked, opening modal for user:',
      member.id,
      member.email
    )
    if (onRemoveClick) {
      onRemoveClick(member.id, member.name || '', member.email, refetch)
      close() // Close context menu
    }
  }

  return (
    <>
      {/* Role Change Options */}
      {canChangeToAdmin && (
        <ContextMenuItem
          onClick={() => handleRoleChange('ADMIN')}
          icon={<ShieldCheck className='h-4 w-4' />}
          disabled={isChangingRole}
        >
          Make Admin
        </ContextMenuItem>
      )}

      {canChangeToUser && (
        <ContextMenuItem
          onClick={() => handleRoleChange('USER')}
          icon={<Shield className='h-4 w-4' />}
          disabled={isChangingRole}
        >
          Make User
        </ContextMenuItem>
      )}

      {/* Remove from Organization */}
      {(canChangeToAdmin || canChangeToUser) && <Separator className='my-sm' />}

      <ContextMenuItem
        onClick={handleRemoveClick}
        icon={<UserMinus className='h-4 w-4' />}
        variant='destructive'
      >
        Remove
      </ContextMenuItem>
    </>
  )
}
