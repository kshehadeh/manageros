'use client'

import { useState } from 'react'
import { removeUserFromOrganization } from '@/lib/actions/organization'
import { toast } from 'sonner'
import { DeleteModal } from '@/components/common/delete-modal'

interface MemberRemoveModalProps {
  isOpen: boolean
  memberId: string | null
  memberName: string | null
  memberEmail: string | null
  onClose: () => void
  onSuccess?: () => void
}

export function MemberRemoveModal({
  isOpen,
  memberId,
  memberName,
  memberEmail,
  onClose,
  onSuccess,
}: MemberRemoveModalProps) {
  const [isRemoving, setIsRemoving] = useState(false)

  if (!memberId) {
    return null
  }

  const handleRemove = async () => {
    if (isRemoving || !memberId) return

    try {
      setIsRemoving(true)
      await removeUserFromOrganization(memberId)
      toast.success(`${memberName || memberEmail} removed from organization`)
      onSuccess?.()
      onClose()
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to remove user from organization'
      )
    } finally {
      setIsRemoving(false)
    }
  }

  return (
    <DeleteModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleRemove}
      title='Remove User from Organization'
      description={`Are you sure you want to remove ${memberName || memberEmail} from the organization? This action cannot be undone.`}
      entityName='user'
      isLoading={isRemoving}
    />
  )
}
