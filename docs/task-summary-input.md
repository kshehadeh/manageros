# Task Summary Input Component

The `TaskSummaryInput` component is an intelligent text input field that automatically detects dates and priorities from natural language input. It uses Slate.js as its rich text editor foundation and provides real-time detection and highlighting of dates and priorities.

## Overview

The `TaskSummaryInput` component provides a seamless task creation experience by:

- Automatically detecting dates and times from natural language
- Detecting priority indicators from text
- Visually highlighting detected elements in the input
- Allowing users to dismiss detected elements
- Providing cleaned text without detected elements for submission

## Architecture

The component consists of two main parts:

### 1. TaskSummaryInputProvider

The provider manages the state and detection logic for the component. It provides:

- **Context**: Shared state across all components using the provider
- **Detection tracking**: Keeps track of detected dates and priorities
- **Text cleaning**: Provides methods to extract cleaned text with detected elements removed
- **State management**: Manages original text, detected data, and cleaning operations

### 2. TaskSummaryInput Component

The main input component that:

- Renders a Slate.js-based text editor
- Performs real-time detection of dates and priorities
- Displays detected elements with visual highlighting
- Shows dismissible badges for detected elements
- Handles user interactions (focus, keyboard shortcuts)

## Usage

### Basic Usage

```tsx
import { TaskSummaryInput } from '@/components/tasks/task-summary-input'
import { TaskSummaryInputProvider } from '@/components/tasks/task-summary-input-provider'

function MyComponent() {
  return (
    <TaskSummaryInputProvider>
      <TaskSummaryInput
        value={value}
        onChange={handleChange}
        placeholder='Enter task details...'
      />
    </TaskSummaryInputProvider>
  )
}
```

### With Callbacks

```tsx
<TaskSummaryInput
  value={value}
  onChange={handleChange}
  onDateDetected={detectedDate => {
    // Handle detected date
    if (detectedDate) {
      console.log('Detected date:', detectedDate.date)
    }
  }}
  onPriorityDetected={detectedPriority => {
    // Handle detected priority
    if (detectedPriority) {
      console.log('Detected priority:', detectedPriority.priority)
    }
  }}
  onSubmit={handleSubmit}
  placeholder='Enter task details...'
/>
```

### Using the Provider Hook

```tsx
import { useTaskSummaryInput } from '@/components/tasks/task-summary-input-provider'

function MyForm() {
  const {
    getCleanedText,
    detectedDate,
    detectedPriority,
    originalText,
    cleanedText,
  } = useTaskSummaryInput()

  const handleSubmit = async () => {
    // Get cleaned text without detected dates/priorities
    const cleanedTitle = getCleanedText()

    // Use detected date and priority
    const dueDate = detectedDate?.date
    const priority = detectedPriority?.priority

    // Submit task...
  }
}
```

## Props

### TaskSummaryInputProps

| Prop                 | Type                                              | Default                   | Description                            |
| -------------------- | ------------------------------------------------- | ------------------------- | -------------------------------------- |
| `value`              | `string`                                          | -                         | The current value of the input         |
| `onChange`           | `(value: string) => void`                         | -                         | Callback when the value changes        |
| `onDateDetected`     | `(date: DetectedDate \| null) => void`            | -                         | Callback when a date is detected       |
| `onPriorityDetected` | `(priority: DetectedPriority \| null) => void`    | -                         | Callback when a priority is detected   |
| `onSubmit`           | `() => void`                                      | -                         | Callback when Shift+Enter is pressed   |
| `placeholder`        | `string`                                          | `"Enter task details..."` | Placeholder text                       |
| `className`          | `string`                                          | `""`                      | Additional CSS classes for the wrapper |
| `inputClassName`     | `string`                                          | `""`                      | Additional CSS classes for the input   |
| `textSize`           | `'xs' \| 'sm' \| 'base' \| 'lg' \| 'xl' \| '2xl'` | `'sm'`                    | Text size of the input                 |
| `disabled`           | `boolean`                                         | `false`                   | Whether the input is disabled          |

### TaskSummaryInputRef

The component exposes a ref with the following methods:

- `focus()`: Programmatically focus the input

## Date Detection

The component uses [chrono-node](https://github.com/wanasit/chrono) for robust natural language date parsing.

### Supported Date Formats

#### Relative Dates

- `"tomorrow"` → Tomorrow at 9:00 AM (default morning time)
- `"today"` → Today at 9:00 AM
- `"next week"` → Next week from today
- `"next month"` → Next month from today
- `"next Monday"` → Next Monday
- `"this Friday"` → This Friday
- `"in 3 days"` → 3 days from now
- `"a week from today"` → 7 days from today

#### Specific Dates

- `"Jan 15"` → January 15th of current year
- `"January 15"` → January 15th of current year
- `"1/15"` → January 15th of current year
- `"15/1"` → January 15th (European format)
- `"Jan 15 2024"` → January 15th, 2024
- `"January 15, 2024"` → January 15th, 2024
- `"2024-01-15"` → January 15th, 2024
- `"01/15/2024"` → January 15th, 2024

#### Times

- `"tomorrow at 3pm"` → Tomorrow at 3:00 PM
- `"today at 9:30am"` → Today at 9:30 AM
- `"next Monday at 10am"` → Next Monday at 10:00 AM

### Date Detection Features

1. **Default Morning Time**: Relative dates like "tomorrow" default to 9:00 AM instead of the current time
2. **Multiple Detections**: Can detect multiple dates in a single text input
3. **Latest Date Priority**: The last detected date is used for task due date
4. **Visual Highlighting**: Detected dates are highlighted in blue in the input
5. **Dismissible**: Users can dismiss detected dates by clicking the X button
6. **Automatic Removal**: Detected date text is automatically removed from the cleaned text

### Date Detection Display

Detected dates are displayed as badges below the input with:

- **Calendar icon**: Visual indicator for date
- **Formatted date**: Human-readable date and time (e.g., "Oct 26, 5:00 PM")
- **Dismiss button**: X button to remove the detected date

## Priority Detection

The component detects priority indicators using a pattern-based system.

### Supported Priority Formats

#### Full Labels (Case Insensitive)

- `"!Critical"` → Priority 1 (Critical)
- `"!High"` → Priority 2 (High)
- `"!Medium"` → Priority 3 (Medium)
- `"!Low"` → Priority 4 (Low)
- `"!Very Low"` → Priority 5 (Very Low)

#### Short Forms

- `"!P1"` → Priority 1 (Critical)
- `"!P2"` → Priority 2 (High)
- `"!P3"` → Priority 3 (Medium)
- `"!P4"` → Priority 4 (Low)
- `"!P5"` → Priority 5 (Very Low)

### Priority Levels

| Priority | Label    | Badge Color |
| -------- | -------- | ----------- |
| 1        | Critical | Red         |
| 2        | High     | Orange      |
| 3        | Medium   | Yellow      |
| 4        | Low      | Blue        |
| 5        | Very Low | Gray        |

### Priority Detection Features

1. **Pattern Recognition**: Detects `!` prefix followed by priority keywords
2. **Case Insensitive**: Works with any capitalization
3. **Multiple Detections**: Can detect multiple priorities (uses the latest)
4. **Visual Highlighting**: Detected priorities are highlighted in red in the input
5. **Dismissible**: Users can dismiss detected priorities by clicking the X button
6. **Automatic Removal**: Detected priority text is automatically removed from cleaned text

### Priority Detection Display

Detected priorities are displayed as badges below the input with:

- **Alert icon**: Visual indicator for priority
- **Priority label**: Human-readable priority level (e.g., "Critical", "High")
- **Color coding**: Badge color matches priority level
- **Dismiss button**: X button to remove the detected priority

## Text Cleaning

The component automatically cleans the input text by removing detected dates and priorities, leaving only the task description.

### Example

**Input:**

```text
Design the new homepage tomorrow at 2pm !High
```

**Detected:**

- Date: "tomorrow at 2pm" → October 27, 2024, 2:00 PM
- Priority: "!High" → Priority 2

**Cleaned Text:**

```text
Design the new homepage
```

This cleaned text becomes the task title.

## Keyboard Shortcuts

- **Shift + Enter**: Submit the form (triggers `onSubmit` callback)
- **Tab**: Navigate to next form field (does not prevent default tab behavior)

## Visual Highlighting

### In-Editor Highlighting

Detected elements are highlighted directly in the editor:

- **Dates**: Blue background (`bg-blue-200`, `dark:bg-blue-800`)
- **Priorities**: Red background (`bg-red-200`, `dark:bg-red-800`)

### Badge Display

Detected elements are shown as dismissible badges below the input:

- Shows all detected dates and priorities
- Provides visual feedback about what was detected
- Allows users to dismiss unwanted detections

## Integration Examples

### Task Form Integration

```tsx
'use client'

import { TaskSummaryInput } from '@/components/tasks/task-summary-input'
import {
  TaskSummaryInputProvider,
  useTaskSummaryInput,
} from '@/components/tasks/task-summary-input-provider'
import { Button } from '@/components/ui/button'

function TaskFormContent() {
  const { getCleanedText, detectedDate, detectedPriority } =
    useTaskSummaryInput()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const cleanedTitle = getCleanedText()
    const dueDate = detectedDate?.date
    const priority = detectedPriority?.priority

    // Create task with detected values
    await createTask({
      title: cleanedTitle,
      dueDate,
      priority,
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <TaskSummaryInput
        value={title}
        onChange={setTitle}
        onSubmit={handleSubmit}
        placeholder='Enter task title...'
      />
      {/* Other form fields */}
    </form>
  )
}

export function TaskForm() {
  return (
    <TaskSummaryInputProvider>
      <TaskFormContent />
    </TaskSummaryInputProvider>
  )
}
```

### Quick Edit Dialog Integration

```tsx
import { TaskSummaryInput } from '@/components/tasks/task-summary-input'
import {
  TaskSummaryInputProvider,
  useTaskSummaryInput,
} from '@/components/tasks/task-summary-input-provider'

function TaskQuickEditDialog() {
  const { getCleanedText } = useTaskSummaryInput()

  const handleUpdate = async () => {
    const cleanedTitle = getCleanedText()
    await updateTask(id, { title: cleanedTitle })
  }

  return (
    <TaskSummaryInputProvider>
      <Dialog>
        <TaskSummaryInput
          value={task.title}
          onChange={handleChange}
          onSubmit={handleUpdate}
          placeholder='Enter task summary...'
          textSize='lg'
          inputClassName='font-semibold'
        />
      </Dialog>
    </TaskSummaryInputProvider>
  )
}
```

## Technical Implementation

### Slate.js Integration

The component uses Slate.js for rich text editing capabilities:

- `createEditor()`: Creates the Slate editor instance
- `withReact()`: React plugin for Slate
- `withHistory()`: History plugin for undo/redo support
- Custom `decorate` function: Highlights detected dates and priorities
- Custom `Leaf` component: Renders highlighted text

### Detection Mechanism

1. **Real-time Detection**: Detects dates and priorities on every text change
2. **Ignore Sections**: Maintains a list of dismissed sections to prevent re-detection
3. **Latest Priority**: Uses the last detected date/priority for form fields
4. **Cleaned Text**: Automatically removes detected text from the submitted value

### State Management

The provider manages three key pieces of state:

1. **originalText**: The full text as typed by the user
2. **detectedDate**: The latest detected date (or null)
3. **detectedPriority**: The latest detected priority (or null)

The `getCleanedText()` method removes detected elements from the original text:

```typescript
let cleanedText = originalText

if (detectedDate?.originalText) {
  cleanedText = cleanedText.replace(detectedDate.originalText, '')
}

if (detectedPriority?.originalText) {
  cleanedText = cleanedText.replace(detectedPriority.originalText, '')
}

cleanedText = cleanedText.replace(/\s+/g, ' ').trim()
```

## Best Practices

### 1. Always Wrap with Provider

```tsx
<TaskSummaryInputProvider>
  <TaskSummaryInput {...props} />
</TaskSummaryInputProvider>
```

### 2. Use Ref for Focus Management

```tsx
const inputRef = useRef<TaskSummaryInputRef>(null)

// Focus when needed
useEffect(() => {
  inputRef.current?.focus()
}, [])

<TaskSummaryInput ref={inputRef} {...props} />
```

### 3. Handle Detected Values

```tsx
const { getCleanedText, detectedDate, detectedPriority } = useTaskSummaryInput()

useEffect(() => {
  if (detectedDate) {
    // Update form with detected date
    setFormData(prev => ({ ...prev, dueDate: detectedDate.date }))
  }
}, [detectedDate])
```

### 4. Get Cleaned Text for Submission

```tsx
const handleSubmit = async () => {
  const cleanedTitle = getCleanedText()
  await createTask({ title: cleanedTitle })
}
```

## Customization

### Text Size

```tsx
<TaskSummaryInput
  textSize='lg' // 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl'
/>
```

### Custom Styling

```tsx
<TaskSummaryInput className='border-2' inputClassName='font-bold' />
```

### Disabled State

```tsx
<TaskSummaryInput disabled={isSubmitting} />
```

## Limitations

1. **Date Detection**: Uses chrono-node for date parsing. Very ambiguous dates may not be detected correctly.
2. **Priority Detection**: Requires exact pattern matching (starts with `!`).
3. **Multiple Detections**: Only the latest date and priority are used for form fields.
4. **Text Cleaning**: Simple text replacement; may not handle all edge cases perfectly.

## Related Documentation

- [Date Detection Utility](/docs/api/date-detection.md)
- [Priority Detection Utility](/docs/api/priority-detection.md)
- [Task Form Component](/docs/api/task-form.md)
