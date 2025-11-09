import { getUserPermissions } from '@/lib/actions/permissions'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { PageSection } from '@/components/ui/page-section'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Shield, Check, X } from 'lucide-react'

function formatActionName(action: string): string {
  // Convert action IDs to readable names
  return action
    .split('.')
    .map(part => {
      // Handle special cases
      if (part === 'oneonone') return 'One-on-One'
      if (part === 'feedback-campaign') return 'Feedback Campaign'
      // Capitalize first letter
      return part.charAt(0).toUpperCase() + part.slice(1)
    })
    .join(' ')
}

function getCategory(action: string): string {
  if (action.startsWith('task.')) return 'Tasks'
  if (action.startsWith('meeting.')) return 'Meetings'
  if (action.startsWith('initiative.')) return 'Initiatives'
  if (action.startsWith('report.')) return 'Reports'
  if (action.startsWith('feedback.')) return 'Feedback'
  if (action.startsWith('oneonone.')) return 'One-on-Ones'
  if (action.startsWith('feedback-campaign.')) return 'Feedback Campaigns'
  if (action.startsWith('user.')) return 'User Management'
  return 'Other'
}

export default async function PermissionsPage() {
  const permissions = await getUserPermissions()

  // Group permissions by category
  const groupedPermissions = permissions.reduce(
    (acc, perm) => {
      const category = getCategory(perm.action)
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(perm)
      return acc
    },
    {} as Record<string, typeof permissions>
  )

  // Sort categories
  const categoryOrder = [
    'Tasks',
    'Meetings',
    'Initiatives',
    'Reports',
    'Feedback',
    'One-on-Ones',
    'Feedback Campaigns',
    'User Management',
    'Other',
  ]

  const sortedCategories = Object.keys(groupedPermissions).sort((a, b) => {
    const aIndex = categoryOrder.indexOf(a)
    const bIndex = categoryOrder.indexOf(b)
    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b)
    if (aIndex === -1) return 1
    if (bIndex === -1) return -1
    return aIndex - bIndex
  })

  return (
    <PageContainer>
      <PageHeader
        title='Permissions'
        subtitle='View your access permissions for all actions in the system.'
        titleIcon={Shield}
      />

      <PageContent>
        <PageSection>
          <div className='space-y-6'>
            {sortedCategories.map(category => (
              <div key={category} className='space-y-2'>
                <h3 className='text-lg font-semibold'>{category}</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className='w-[60%]'>Action</TableHead>
                      <TableHead className='w-[40%] text-center'>
                        Access
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupedPermissions[category].map(permission => (
                      <TableRow key={permission.action}>
                        <TableCell className='font-medium'>
                          <div className='flex items-center gap-2'>
                            <span>{formatActionName(permission.action)}</span>
                            {permission.requiresId && (
                              <span className='text-muted-foreground text-xs'>
                                ~
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className='text-center'>
                          {permission.requiresId ? (
                            <Badge variant='secondary' className='gap-1'>
                              <span>~</span>
                              <span>Conditional</span>
                            </Badge>
                          ) : (
                            <Badge
                              variant={
                                permission.hasAccess ? 'default' : 'secondary'
                              }
                              className='gap-1'
                            >
                              {permission.hasAccess ? (
                                <>
                                  <Check className='h-3 w-3' />
                                  <span>Yes</span>
                                </>
                              ) : (
                                <>
                                  <X className='h-3 w-3' />
                                  <span>No</span>
                                </>
                              )}
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ))}
          </div>

          <div className='mt-6 p-4 bg-muted rounded-lg'>
            <p className='text-sm text-muted-foreground'>
              <strong>Note:</strong> Actions marked with ~ require an ID
              parameter to check specific access. The access shown indicates
              general capability, but actual access depends on ownership or
              participation in the specific entity.
            </p>
          </div>
        </PageSection>
      </PageContent>
    </PageContainer>
  )
}
