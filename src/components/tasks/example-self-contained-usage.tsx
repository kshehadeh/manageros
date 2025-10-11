'use client'

import React from 'react'
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
        <TaskDataTable
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
          settingsId='example-advanced'
          onTaskUpdate={() => {
            console.log('Task updated!')
          }}
        />
      </div>

      <div>
        <h2 className='text-2xl font-bold mb-4'>
          Task Table with Internal Filters
        </h2>
        <p className='text-muted-foreground mb-4'>
          This table manages its own filter state internally.
        </p>
        <TaskDataTable
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
          settingsId='example-paginated'
          onTaskUpdate={() => {
            console.log('Task updated!')
          }}
        />
      </div>

      <div>
        <h2 className='text-2xl font-bold mb-4'>
          Task Data Table with Immutable Filters
        </h2>
        <p className='text-muted-foreground mb-4'>
          This table uses immutable filters to show only high priority tasks.
        </p>
        <TaskDataTable
          immutableFilters={{
            priority: '2', // High priority (2 = HIGH)
            status: 'todo',
          }}
          settingsId='example-immutable-filters'
          onTaskUpdate={() => {
            console.log('Task updated!')
          }}
        />
      </div>
    </div>
  )
}
