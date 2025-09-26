'use client'

import { HelpIcon, HelpWrapper } from '@/components/help-icon'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

/**
 * Example component demonstrating the help system usage
 * This shows various ways to integrate help icons throughout the UI
 */
export function HelpSystemExample() {
  return (
    <div className='space-y-6 p-6'>
      <div className='space-y-2'>
        <h1 className='text-2xl font-bold'>Help System Examples</h1>
        <p className='text-muted-foreground'>
          This page demonstrates various ways to use the help system throughout
          ManagerOS.
        </p>
      </div>

      {/* Example 1: Form labels with help icons */}
      <Card>
        <CardHeader>
          <div className='flex items-center gap-2'>
            <CardTitle>Task Creation Form</CardTitle>
            <HelpIcon helpId='initiatives' size='sm' />
          </div>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='space-y-2'>
            <Label className='flex items-center gap-2'>
              Priority Level
              <HelpIcon helpId='task-priorities' size='sm' />
            </Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder='Select priority' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='high'>🔴 High Priority</SelectItem>
                <SelectItem value='medium'>🟡 Medium Priority</SelectItem>
                <SelectItem value='low'>🟢 Low Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-2'>
            <Label className='flex items-center gap-2'>
              Assignee
              <HelpIcon helpId='direct-reports' size='sm' />
            </Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder='Select team member' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='john'>John Doe</SelectItem>
                <SelectItem value='jane'>Jane Smith</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Example 2: Help wrapper around content */}
      <HelpWrapper helpId='people-hierarchy' position='top-right'>
        <Card>
          <CardHeader>
            <CardTitle>Team Structure</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <span>John Doe</span>
                <Badge variant='secondary'>Manager</Badge>
              </div>
              <div className='ml-4 space-y-1'>
                <div className='flex items-center justify-between'>
                  <span>Jane Smith</span>
                  <Badge variant='outline'>Developer</Badge>
                </div>
                <div className='flex items-center justify-between'>
                  <span>Bob Johnson</span>
                  <Badge variant='outline'>Designer</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </HelpWrapper>

      {/* Example 3: Different icon sizes and positions */}
      <Card>
        <CardHeader>
          <CardTitle>Help Icon Variations</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            {/* Small icon */}
            <div className='space-y-2'>
              <Label>Small Icon (inline)</Label>
              <div className='flex items-center gap-2'>
                <span>Task Priority</span>
                <HelpIcon helpId='task-priorities' size='sm' />
              </div>
            </div>

            {/* Medium icon */}
            <div className='space-y-2'>
              <Label>Medium Icon (top-right)</Label>
              <div className='relative p-4 border rounded'>
                <span>Content with help</span>
                <HelpIcon helpId='initiatives' size='md' position='top-right' />
              </div>
            </div>

            {/* Large icon */}
            <div className='space-y-2'>
              <Label>Large Icon (bottom-left)</Label>
              <div className='relative p-4 border rounded'>
                <span>Content with help</span>
                <HelpIcon
                  helpId='feedback-campaigns'
                  size='lg'
                  position='bottom-left'
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Example 4: Section headers with help */}
      <div className='space-y-4'>
        <div className='flex items-center gap-2'>
          <h2 className='text-xl font-semibold'>One-on-One Meetings</h2>
          <HelpIcon helpId='one-on-ones' size='sm' />
        </div>

        <Card>
          <CardContent className='pt-6'>
            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <span>Weekly 1:1 with Jane Smith</span>
                <Badge variant='outline'>Scheduled</Badge>
              </div>
              <div className='flex items-center justify-between'>
                <span>Monthly 1:1 with Bob Johnson</span>
                <Badge variant='outline'>Pending</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Example 5: Custom styled help icons */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Styled Help Icons</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='space-y-2'>
            <Label className='flex items-center gap-2'>
              Jira Integration
              <HelpIcon
                helpId='jira-integration'
                size='sm'
                className='text-blue-500 hover:text-blue-700'
                tooltip='Learn about Jira integration setup'
              />
            </Label>
            <p className='text-sm text-muted-foreground'>
              Connect your Jira account to sync work activity and track
              progress.
            </p>
          </div>

          <div className='space-y-2'>
            <Label className='flex items-center gap-2'>
              Feedback Campaigns
              <HelpIcon
                helpId='feedback-campaigns'
                size='sm'
                className='text-green-500 hover:text-green-700'
              />
            </Label>
            <p className='text-sm text-muted-foreground'>
              Create and manage feedback campaigns to collect team input.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Example 6: Table headers with help */}
      <Card>
        <CardHeader>
          <CardTitle>Task Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead>
                <tr className='border-b'>
                  <th className='text-left p-2 font-medium'>Task</th>
                  <th className='text-left p-2 font-medium'>
                    <div className='flex items-center gap-1'>
                      Status
                      <HelpIcon helpId='task-priorities' size='sm' />
                    </div>
                  </th>
                  <th className='text-left p-2 font-medium'>
                    <div className='flex items-center gap-1'>
                      Priority
                      <HelpIcon helpId='task-priorities' size='sm' />
                    </div>
                  </th>
                  <th className='text-left p-2 font-medium'>Assignee</th>
                </tr>
              </thead>
              <tbody>
                <tr className='border-b'>
                  <td className='p-2'>Update documentation</td>
                  <td className='p-2'>
                    <Badge variant='outline'>In Progress</Badge>
                  </td>
                  <td className='p-2'>
                    <Badge variant='secondary'>Medium</Badge>
                  </td>
                  <td className='p-2'>Jane Smith</td>
                </tr>
                <tr>
                  <td className='p-2'>Code review</td>
                  <td className='p-2'>
                    <Badge variant='outline'>Pending</Badge>
                  </td>
                  <td className='p-2'>
                    <Badge variant='destructive'>High</Badge>
                  </td>
                  <td className='p-2'>Bob Johnson</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
