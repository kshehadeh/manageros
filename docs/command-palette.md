## Command Palette

The Command Palette provides fast access to actions and data via keyboard search. Open it with Ctrl/⌘ + K or the Command button in the top bar.

### Keyboard Shortcuts

- **Ctrl/⌘ + K**: Open command palette
- **Ctrl/⌘ + J**: Open AI chat sidebar
- **Q**: Open task creation dialog directly (when not focused on input fields)
- **E**: Open edit form for current detail page (when not focused on input fields)

### Files

- `src/components/ui/command.tsx` – shadcn/cmdk UI primitives
- `src/components/command-palette/provider.tsx` – global open state and keyboard shortcut
- `src/components/command-palette/command-palette.tsx` – palette dialog and results rendering
- `src/components/command-palette/sources/` – extensible sources that supply commands
  - `core.tsx` – quick actions (e.g., Create Task) and navigation
  - `search.ts` – server-backed search across tasks, initiatives, people, meetings, feedback, one-on-ones
- `src/app/api/search/route.ts` – unified search endpoint
- `src/components/command-palette/create-task-modal.tsx` – modal used by Create Task action

### Usage

The palette is wired globally in `server-conditional-layout.tsx` and can be opened via:

- Keyboard: Ctrl/⌘ + K
- UI: Top bar Command button

The task creation dialog can be opened directly via:

- Keyboard: Q (when not focused on input fields)

### Adding Commands

Commands are provided by sources implementing `CommandSource`:

```ts
export interface CommandItemDescriptor {
  id: string
  title: string
  subtitle?: string
  icon?: ReactNode
  keywords?: string[]
  group?: string
  perform: (ctx: { closePalette: () => void }) => void | Promise<void>
}

export interface CommandSource {
  id: string
  label: string
  getItems: (
    query: string,
    userRole?: string
  ) => Promise<CommandItemDescriptor[]>
}
```

To add new commands:

1. Create a new source file in `src/components/command-palette/sources/your-source.tsx`.
2. Export a `CommandSource` whose `getItems` returns matching `CommandItemDescriptor[]` based on the query.
3. Register the source in `src/components/command-palette/command-palette.tsx` by adding it to the `sources` array.

### Quick Actions

Quick actions available in the command palette include:

- **Create Task** - Opens quick task creation modal
- **Create 1:1 Meeting** - Schedule a new one-on-one meeting
- **Create Meeting** - Schedule a new team meeting (navigates to `/meetings/new`)
- **Create Initiative** - Start a new initiative or OKR
- **Create Feedback** - Give feedback to a team member

### Navigation Commands

Navigation commands to quickly jump to different sections:

- **View Tasks** - Go to tasks list
- **View My Tasks** - Go to assigned tasks
- **View People** - Go to people directory
- **View Teams** - Go to teams directory
- **View Initiatives** - Go to initiatives
- **View Feedback** - Go to feedback page
- **View Meetings** - Go to meetings page
- **View My 1:1s** - Go to your one-on-one meetings
- **View Reports** - Go to reports page

### Role-Based Commands

Commands can be conditionally shown based on user roles. The `userRole` parameter is passed to `getItems()` and contains the current user's role ('ADMIN' or 'USER'). Use this to show admin-only commands.

Admin-only commands currently include:

- **Create Person** - Add a new person to the organization (navigates to `/people/new`)
- **Organization Settings** - Manage organization settings

Example:

```ts
export const adminSource: CommandSource = {
  id: 'admin',
  label: 'Admin',
  getItems: async (query, userRole) => {
    if (userRole !== 'ADMIN') return []

    return [
      {
        id: 'admin.settings',
        title: 'Organization Settings',
        subtitle: 'Manage organization settings',
        group: 'Administration',
        perform: ({ closePalette, router }) => {
          router.push('/organization/settings')
          closePalette()
        },
      },
    ]
  },
}
```

Example static command:

```ts
export const exampleSource: CommandSource = {
  id: 'example',
  label: 'Example',
  getItems: async (q, userRole) =>
    q.includes('help')
      ? [
          {
            id: 'help.openDocs',
            title: 'Open Documentation',
            group: 'Help',
            perform: ({ closePalette }) => {
              window.location.href = '/docs'
              closePalette()
            },
          },
        ]
      : [],
}
```

### Adding Server Search Results

Update `src/app/api/search/route.ts` to include new entity types. Return a merged array of `{ id, title, subtitle?, type }` where `type` is used by the client to construct navigation.

On the client, extend `search.ts` to map the new `type` to a `CommandItemDescriptor` and its navigation or action.

### Opening Modals or Executing Actions

Use DOM events for decoupled actions. Example used by Create Task:

```ts
// In a source perform()
window.dispatchEvent(new CustomEvent('command:openCreateTaskModal'))

// In a component
useEffect(() => {
  const onOpen = () => setOpen(true)
  window.addEventListener(
    'command:openCreateTaskModal',
    onOpen as EventListener
  )
  return () =>
    window.removeEventListener(
      'command:openCreateTaskModal',
      onOpen as EventListener
    )
}, [])
```

### UX Notes

- Group results via `group` to keep quick actions on top.
- `keywords` improve matching beyond `title`/`subtitle`.
- The list queries all sources in parallel whenever the input changes.
