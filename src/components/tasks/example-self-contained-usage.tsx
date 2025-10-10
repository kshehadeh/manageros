'use client'

import React from 'react'
import { TaskTable } from './task-table'
import { TaskDataTable } from './data-table'

/**
 * Example component showing how to use the new self-contained task tables
 * These components handle their own data fetching, so you don't need to pass tasks as props
 */
export function ExampleSelfContainedUsage() {
  return (
    <div className='space-y-8'>
      <div>
        <h2 className='text-2xl font-bold mb-4'>Simple Task Table</h2>
        <p className='text-muted-foreground mb-4'>
          This table fetches its own data and provides basic task management.
        </p>
        <TaskTable
          hideFilters={true}
          onTaskUpdate={() => {
            console.log('Task updated!')
          }}
        />
      </div>

      <div>
        <h2 className='text-2xl font-bold mb-4'>Advanced Task Data Table</h2>
        <p className='text-muted-foreground mb-4'>
          This table includes filtering, search, context menus, and more
          advanced features.
        </p>
        <TaskDataTable
          hideFilters={false}
          onTaskUpdate={() => {
            console.log('Task updated!')
          }}
        />
      </div>

      <div>
        <h2 className='text-2xl font-bold mb-4'>Filtered Task Table</h2>
        <p className='text-muted-foreground mb-4'>
          This table shows only tasks with specific filters applied.
        </p>
        <TaskTable
          filters={{
            status: 'todo',
            priority: '3',
          }}
          onTaskUpdate={() => {
            console.log('Task updated!')
          }}
        />
      </div>

      <div>
        <h2 className='text-2xl font-bold mb-4'>Paginated Task Data Table</h2>
        <p className='text-muted-foreground mb-4'>
          This table includes pagination for large datasets.
        </p>
        <TaskDataTable
          enablePagination={true}
          page={1}
          limit={10}
          onTaskUpdate={() => {
            console.log('Task updated!')
          }}
        />
      </div>
    </div>
  )
}
