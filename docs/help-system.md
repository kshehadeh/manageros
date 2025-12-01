# Help System Documentation

The ManagerOS help system provides a centralized way to display contextual help information throughout the application. It consists of a help icon component that opens a modal with markdown-rendered content.

## Overview

The help system is designed to:

- **Centralize help content** in a single location
- **Provide consistent UI** for help across the application
- **Support rich markdown formatting** for documentation-style content
- **Enable easy maintenance** and updates to help content
- **Scale efficiently** with separate TypeScript files for each help topic

## Architecture

The help system is built with the following components:

- **`HelpIcon`** - The UI component that displays the help icon and modal
- **`HelpWrapper`** - A wrapper component for adding help to existing elements
- **`help-content-loader.ts`** - Loads and provides help content
- **`help/` directory** - Contains generated TypeScript files and index
  - **`index.ts`** - Auto-generated index file that imports all help content
  - **`{help-id}.ts`** - Individual TypeScript files for each help topic
- **`generate-help-content.ts`** - Build-time script that converts markdown to TypeScript
- **`help/` directory (markdown)** - Contains markdown files with help content

## Components

### HelpIcon

The main component for displaying help information. It renders a small help icon (?) that opens a modal when clicked.

```tsx
import { HelpIcon } from '@/components/help-icon'

// Basic usage
<HelpIcon helpId="task-priorities" />

// With custom styling
<HelpIcon
  helpId="initiatives"
  size="lg"
  className="text-blue-500"
  tooltip="Learn about initiatives"
/>
```

### HelpWrapper

A wrapper component that adds a help icon to any existing content.

```tsx
import { HelpWrapper } from '@/components/help-icon'
;<HelpWrapper helpId='people-hierarchy' position='top-right'>
  <div className='p-4 border rounded'>
    <h3>Team Structure</h3>
    <p>View your team's organizational hierarchy</p>
  </div>
</HelpWrapper>
```

## Props

### HelpIcon Props

| Prop        | Type                                                                       | Default    | Description                                         |
| ----------- | -------------------------------------------------------------------------- | ---------- | --------------------------------------------------- |
| `helpId`    | `string`                                                                   | -          | **Required.** The ID of the help content to display |
| `className` | `string`                                                                   | -          | Optional custom CSS classes                         |
| `size`      | `'sm' \| 'md' \| 'lg'`                                                     | `'md'`     | Size of the help icon                               |
| `position`  | `'inline' \| 'top-right' \| 'top-left' \| 'bottom-right' \| 'bottom-left'` | `'inline'` | Position relative to content                        |
| `tooltip`   | `string`                                                                   | -          | Custom tooltip text (overrides help content title)  |

### HelpWrapper Props

| Prop        | Type                        | Default       | Description                                         |
| ----------- | --------------------------- | ------------- | --------------------------------------------------- |
| `children`  | `React.ReactNode`           | -             | **Required.** Content to wrap with help icon        |
| `helpId`    | `string`                    | -             | **Required.** The ID of the help content to display |
| `position`  | `HelpIconProps['position']` | `'top-right'` | Position of the help icon                           |
| `size`      | `HelpIconProps['size']`     | `'sm'`        | Size of the help icon                               |
| `tooltip`   | `string`                    | -             | Custom tooltip text                                 |
| `className` | `string`                    | -             | Optional custom CSS classes for wrapper             |

## Help Content

Help content is now stored as individual markdown files in the `/help` directory, making it much easier to maintain and edit.

At the **content level**, each topic should be:

- **Benefit-focused** – explain why a manager should care, not just what the UI does
- **How-to oriented** – show step‑by‑step flows for common tasks
- **Grounded in examples** – at least one concrete scenario per topic

### Standard Topic Structure

Every help topic should follow this structure (adapt to the feature as needed):

1. **Overview**
   - What this feature is and who it is for.
2. **Why it matters / Benefits**
   - 3–5 concrete outcomes or problems it solves.
3. **Key Concepts**
   - Short explanations of core terms used in the UI.
4. **How to Use (Step‑by‑Step)**
   - Sequential steps for the main workflows.
5. **Examples & Best Practices**
   - 2–4 short scenarios or tips.
6. **Related Topics**
   - Pointers to other help IDs that are commonly used together.

### Area‑Level Templates

To keep content focused, each area has a slightly different lens:

- **Tasks & Projects**
  - Emphasize: prioritization, status, daily workflow for engineers and managers.
  - Answer questions like:
    - “How do I use tasks to run my week?”
    - “How should I combine initiatives, objectives, and tasks?”
    - “How do status and priority interact in planning?”

- **People & Teams**
  - Emphasize: coaching, reporting lines, people ops flows.
  - Answer questions like:
    - “How do I understand someone’s reporting chain?”
    - “How do I see all the work and feedback around a person or team?”
    - “How does this help with performance and growth conversations?”

- **Meetings & Communication**
  - Emphasize: preparation, follow‑ups, and cadence.
  - Answer questions like:
    - “How do I prepare quickly for a 1:1 or review?”
    - “How do meetings connect back to initiatives and tasks?”
    - “What should a good recurring meeting workflow look like in mpath?”

- **Feedback & Development**
  - Emphasize: growth loops, campaigns, and closing the loop.
  - Answer questions like:
    - “When should I use a feedback campaign vs ad‑hoc feedback?”
    - “How do I interpret and act on feedback over time?”
    - “How does feedback show up in people and meeting flows?”

- **Reports & Analytics**
  - Emphasize: when to run which report and how to interpret it.
  - Answer questions like:
    - “Which report should I use for which question?”
    - “How do I read this report and what actions does it suggest?”
    - “How often should I revisit this report?”

- **Getting Started / Keyboard Shortcuts / Accounts**
  - Emphasize: quick wins, navigation, and setup.
  - Answer questions like:
    - “What are the fastest ways to get value in the first week?”
    - “How do I move around without hunting through menus?”
    - “How do accounts, organizations, and subscriptions relate?”

- **Integrations (GitHub, Jira, etc.)**
  - Emphasize: setup, expected outcomes, and troubleshooting basics.
  - Answer questions like:
    - “What data does this integration bring into mpath?”
    - “How does this change what I see in initiatives, tasks, or people?”
    - “What should I check if data doesn’t look right?”

### File Structure

```
help/
├── people-hierarchy.md
├── direct-reports.md
├── task-priorities.md
├── task-status.md
├── initiatives.md
├── feedback-campaigns.md
├── one-on-ones.md
├── jira-integration.md
└── README.md (auto-generated index)
```

### Adding New Help Content

1. **Create a new markdown file** in the `/help` directory:

```bash
# Create new help file
touch help/new-feature.md
```

2. **Add content to the markdown file with front matter**:

```markdown
---
id: new-feature
title: New Feature
category: Features
---

# New Feature

This is a description of the new feature.

## Key Benefits

- Benefit 1
- Benefit 2

## How to Use

1. Step one
2. Step two
3. Step three

## Best Practices

- Practice 1
- Practice 2
```

3. **Generate the help content**:

```bash
bun run help:generate
```

4. **Use the help ID in your components**:

```tsx
<HelpIcon helpId='new-feature' />
```

### Front Matter Format

Each help markdown file must start with YAML front matter containing:

- **`id`** - Unique identifier for the help content
- **`title`** - Display title for the help content
- **`category`** - Category for organizing help content

```yaml
---
id: unique-help-id
title: Help Content Title
category: Category Name
---
```

### Help Content Management

Use the built-in scripts to manage help content:

```bash
# Generate help content from markdown files
bun run help:generate

# List all help topics
bun run help:list

# Validate help content
bun run help:validate

# Generate help index
bun run help:index
```

### File Structure

The help system generates the following structure:

```
src/lib/help/
├── index.ts              # Main index file importing all help content
├── task-status.ts        # Individual help topic files
├── task-priorities.ts
├── people-hierarchy.ts
└── ...                   # One file per help topic
```

Each individual help file contains:

- TypeScript interface definition
- Help content object with id, title, category, and content
- Auto-generated comments with source file information

The index file:

- Imports all individual help files
- Combines them into a single object
- Provides utility functions for accessing help content

### Turbopack Compatibility

This help system is fully compatible with both webpack and Turbopack. The markdown files are converted to TypeScript at build time, eliminating the need for webpack-specific rules or Turbopack configuration.

### Markdown Support

The help system supports full markdown formatting including:

- **Headers** (H1, H2, H3)
- **Bold** and _italic_ text
- **Lists** (ordered and unordered)
- **Code blocks** and `inline code`
- **Blockquotes**
- **Links** and other markdown elements

## Usage Examples

### Inline Help Icon

```tsx
<div className='flex items-center gap-2'>
  <label>Task Priority</label>
  <HelpIcon helpId='task-priorities' />
</div>
```

### Help Icon with Wrapper

```tsx
<HelpWrapper helpId='initiatives' position='top-right'>
  <Card>
    <CardHeader>
      <CardTitle>Active Initiatives</CardTitle>
    </CardHeader>
    <CardContent>{/* Initiative content */}</CardContent>
  </Card>
</HelpWrapper>
```

### Custom Styled Help Icon

```tsx
<HelpIcon
  helpId='feedback-campaigns'
  size='lg'
  className='text-blue-500 hover:text-blue-700'
  tooltip='Learn about feedback campaigns'
/>
```

### Section Header with Help

```tsx
<div className='flex items-center gap-2 mb-4'>
  <h2 className='text-xl font-semibold'>Team Hierarchy</h2>
  <HelpIcon helpId='people-hierarchy' size='sm' />
</div>
```

## Best Practices

### Content Guidelines

1. **Keep content concise** but comprehensive
2. **Use clear headings** to organize information
3. **Include practical examples** when possible
4. **Provide actionable guidance** and best practices
5. **Update content regularly** as features evolve

### UI Guidelines

1. **Use appropriate icon sizes** for the context
2. **Position icons** where they won't interfere with content
3. **Provide meaningful tooltips** for accessibility
4. **Test on different screen sizes** to ensure visibility

### Maintenance

1. **Review help content** during feature updates
2. **Remove outdated information** promptly
3. **Add new help content** for new features
4. **Organize content** by categories for easier management

## Accessibility

The help system includes several accessibility features:

- **ARIA labels** for screen readers
- **Keyboard navigation** support
- **Focus management** in modals
- **Semantic HTML** structure
- **High contrast** support

## Styling

The help system uses Tailwind CSS classes and can be customized:

```tsx
// Custom colors
<HelpIcon
  helpId="example"
  className="text-blue-500 hover:text-blue-700"
/>

// Custom positioning
<HelpIcon
  helpId="example"
  className="absolute top-2 right-2"
/>
```

## Integration with Existing Components

The help system can be easily integrated with existing components:

```tsx
// Add to form labels
<Label className="flex items-center gap-2">
  Priority Level
  <HelpIcon helpId="task-priorities" size="sm" />
</Label>

// Add to card headers
<CardHeader>
  <div className="flex items-center justify-between">
    <CardTitle>Team Performance</CardTitle>
    <HelpIcon helpId="performance-metrics" />
  </div>
</CardHeader>

// Add to table headers
<th className="flex items-center gap-2">
  Status
  <HelpIcon helpId="task-status" size="sm" />
</th>
```

## Troubleshooting

### Common Issues

1. **Help content not found**: Check that the `helpId` exists in `help-content.ts`
2. **Icon not visible**: Ensure the component is imported correctly
3. **Modal not opening**: Check for JavaScript errors in the console
4. **Styling issues**: Verify Tailwind classes are available

### Debug Mode

To debug help content issues, check the browser console for warnings about missing help IDs.
