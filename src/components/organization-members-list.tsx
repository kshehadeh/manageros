'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { Badge } from '@/components/ui/badge'
import { MoreHorizontal, Shield, User, Trash2 } from 'lucide-react'
import {
  updateUserRole,
  removeUserFromOrganization,
} from '@/lib/actions/organization'
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

interface OrganizationMembersListProps {
  members: OrganizationMember[]
  currentUserId: string
}

export default function OrganizationMembersList({
  members,
  currentUserId,
}: OrganizationMembersListProps) {
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const [userToRemove, setUserToRemove] = useState<OrganizationMember | null>(
    null
  )

  const handleRoleChange = async (
    userId: string,
    newRole: 'ADMIN' | 'USER'
  ) => {
    setIsUpdating(userId)
    try {
      await updateUserRole(userId, newRole)
      toast.success(`User role updated to ${newRole}`)
      // Refresh the page to show updated data
      window.location.reload()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to update role'
      )
    } finally {
      setIsUpdating(null)
    }
  }

  const handleRemoveUser = async () => {
    if (!userToRemove) return

    setIsUpdating(userToRemove.id)
    try {
      await removeUserFromOrganization(userToRemove.id)
      toast.success('User removed from organization')
      // Refresh the page to show updated data
      window.location.reload()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to remove user'
      )
    } finally {
      setIsUpdating(null)
      setUserToRemove(null)
    }
  }

  const getRoleBadge = (role: string) => {
    if (role === 'ADMIN') {
      return (
        <Badge
          variant='default'
          className='bg-blue-100 text-blue-800 border-blue-200'
        >
          <Shield className='h-3 w-3 mr-1' />
          Admin
        </Badge>
      )
    }
    return (
      <Badge variant='secondary'>
        <User className='h-3 w-3 mr-1' />
        User
      </Badge>
    )
  }

  const getPersonStatusBadge = (status: string) => {
    const statusColors = {
      active: 'bg-green-100 text-green-800 border-green-200',
      inactive: 'bg-gray-100 text-gray-800 border-gray-200',
      onLeave: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    }

    return (
      <Badge
        variant='outline'
        className={
          statusColors[status as keyof typeof statusColors] ||
          statusColors.inactive
        }
      >
        {status
          .replace('_', ' ')
          .replace(/([A-Z])/g, ' $1')
          .trim()}
      </Badge>
    )
  }

  const hasActions = (member: OrganizationMember) => {
    // If it's the current user, they can't change their own role or remove themselves
    if (member.id === currentUserId) {
      return false
    }

    // For other users, there's always at least one action available
    return true
  }

  if (members.length === 0) {
    return (
      <div className='text-center text-muted-foreground py-8'>
        <p>No members found in your organization.</p>
      </div>
    )
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Person Status</TableHead>
            <TableHead>Team</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead className='w-[50px]'>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map(member => (
            <TableRow key={member.id}>
              <TableCell className='font-medium'>{member.name}</TableCell>
              <TableCell className='text-muted-foreground'>
                {member.email}
              </TableCell>
              <TableCell>{getRoleBadge(member.role)}</TableCell>
              <TableCell>
                {member.person ? (
                  getPersonStatusBadge(member.person.status)
                ) : (
                  <Badge
                    variant='outline'
                    className='bg-gray-100 text-gray-600 border-gray-200'
                  >
                    Not Linked
                  </Badge>
                )}
              </TableCell>
              <TableCell className='text-muted-foreground'>
                {member.person?.team?.name || '-'}
              </TableCell>
              <TableCell className='text-muted-foreground'>
                {new Date(member.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell>
                {hasActions(member) ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant='ghost'
                        size='sm'
                        disabled={isUpdating === member.id}
                      >
                        <MoreHorizontal className='h-4 w-4' />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end'>
                      {member.role === 'USER' ? (
                        <DropdownMenuItem
                          onClick={() => handleRoleChange(member.id, 'ADMIN')}
                          disabled={isUpdating === member.id}
                        >
                          <Shield className='h-4 w-4 mr-2' />
                          Make Admin
                        </DropdownMenuItem>
                      ) : (
                        // Only show "Make User" option if it's not the current user
                        member.id !== currentUserId && (
                          <DropdownMenuItem
                            onClick={() => handleRoleChange(member.id, 'USER')}
                            disabled={isUpdating === member.id}
                          >
                            <User className='h-4 w-4 mr-2' />
                            Make User
                          </DropdownMenuItem>
                        )
                      )}
                      {/* Only show remove option if it's not the current user */}
                      {member.id !== currentUserId && (
                        <DropdownMenuItem
                          onClick={() => setUserToRemove(member)}
                          className='text-red-600 focus:text-red-600'
                          disabled={isUpdating === member.id}
                        >
                          <Trash2 className='h-4 w-4 mr-2' />
                          Remove from Organization
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <div className='w-[50px]'></div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog
        open={!!userToRemove}
        onOpenChange={() => setUserToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove User from Organization</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{' '}
              <strong>{userToRemove?.name}</strong> from your organization? This
              action will unlink them from any associated person record and they
              will lose access to the organization. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveUser}
              className='bg-red-600 hover:bg-red-700'
              disabled={isUpdating === userToRemove?.id}
            >
              {isUpdating === userToRemove?.id ? 'Removing...' : 'Remove User'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
