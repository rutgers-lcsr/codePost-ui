# Assignment Files Form - Visual Design

## New Design Overview

```
┌────────────────────────────────────────────────────────────────┐
│ 📄 Submission Files  [3]                                       │
├────────────────────────────────────────────────────────────────┤
│ File Name              Extension    Required       Actions     │
├────────────────────────────────────────────────────────────────┤
│ 📄 main.py [✏️]        [py]         ☑ ✓           [🗑️]        │
│ 📄 README.md [✏️]      [md]         ☐              [🗑️]        │
│ 📄 test.py [✏️]        [py]         ☑ ✓           [🗑️]        │
├────────────────────────────────────────────────────────────────┤
│ [Enter file name (e.g., main.py, README.md)    ] [+ Add File] │
│ ℹ️ Tip: Include the file extension for proper syntax highlight │
├────────────────────────────────────────────────────────────────┤
│ Summary:                                                       │
│ [2 Required] Must be present in submissions                   │
│ [1 Optional] Can be included in submissions                   │
└────────────────────────────────────────────────────────────────┘
```

## Old Design (Transfer Component)

```
┌─────────────────────┬─────────────────────┐
│     Optional        │      Required       │
├─────────────────────┼─────────────────────┤
│ ☐ main.py          │ ☐ README.md         │
│ ☐ test.py          │ ☐ config.json       │
│                    │                     │
│                    │     [delete]        │
└─────────────────────┴─────────────────────┘
[file name          ] [Add]
```

## Key Visual Improvements

### 1. Card-Based Layout

- **Modern appearance**: Uses Ant Design Card component
- **Clear boundaries**: Card border defines the form area
- **Header with icon**: File icon + title + count badge

### 2. Table Layout

- **Scannable**: Easy to see all files at once
- **Aligned columns**: Information organized in clear columns
- **Proper spacing**: Good padding between rows

### 3. Interactive Elements

- **Edit buttons**: Inline edit icon for each file name
- **Checkboxes**: Simple toggle for required status
- **Delete confirmations**: Popconfirm prevents accidental deletion
- **Visual check mark**: Green check icon appears for required files

### 4. Color Coding

- **File icon**: Blue (#1890ff) for visual consistency
- **Extension tags**: Blue tags for file extensions
- **Required check**: Green (#52c41a) for required status
- **Delete button**: Red danger button for delete action

### 5. Input Section

- **Compound input**: Input + Button combined
- **Inline validation**: Shows "Duplicate name" error in input
- **Disabled states**: Add button disabled for invalid input
- **Helper text**: Tip about file extensions below input

### 6. Summary Footer

- **Visual tags**: Color-coded tags (green for required, gray for optional)
- **Clear counts**: Shows exact numbers
- **Explanatory text**: Describes what each category means

## Interaction Patterns

### Adding a File

1. Type filename in input field → `main.py`
2. Press Enter or click "Add File" button
3. File appears in table with edit/delete options
4. Input field clears, ready for next file

### Editing a File Name

1. Click edit icon (✏️) next to filename
2. Inline input appears with current name
3. Type new name and press Enter or click away
4. File updates immediately with new extension auto-detected

### Making a File Required

1. Click checkbox in "Required" column
2. Check mark (✓) appears immediately
3. Summary updates to reflect new count

### Deleting a File

1. Click delete icon (🗑️)
2. Confirmation dialog appears: "Delete this file?"
3. Click "Delete" to confirm
4. File removed from table
5. Summary updates

### Duplicate Prevention

1. Type existing filename → `main.py`
2. Input shows error state (red border)
3. "Duplicate name" text appears
4. Add button becomes disabled
5. Cannot add until name is unique

## Accessibility Features

- **Keyboard navigation**: Tab through all interactive elements
- **Enter key**: Quick add/edit with Enter key
- **Clear labels**: Descriptive text for all actions
- **Tooltips**: Info icon tooltips explain functionality
- **Screen reader friendly**: Proper ARIA labels on icons

## Responsive Behavior

- **Minimum width**: Card maintains readable width
- **Table adapts**: Columns resize appropriately
- **Mobile-friendly**: Touch targets large enough for fingers
- **No horizontal scroll**: Content fits within card bounds

## Empty State

When no files are added:

```
┌────────────────────────────────────────────────────────────────┐
│ 📄 Submission Files  [0]                                       │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│                    📄                                          │
│         No files yet. Add your first file below.              │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│ [Enter file name (e.g., main.py, README.md)    ] [+ Add File] │
│ ℹ️ Tip: Include the file extension for proper syntax highlight │
├────────────────────────────────────────────────────────────────┤
│ Summary:                                                       │
│ [0 Required] Must be present in submissions                   │
│ [0 Optional] Can be included in submissions                   │
└────────────────────────────────────────────────────────────────┘
```

## Comparison: Old vs New

| Feature             | Old (Transfer)      | New (Table + Card)        |
| ------------------- | ------------------- | ------------------------- |
| Layout              | Two-column transfer | Single table with columns |
| Visual clarity      | ★★☆☆☆               | ★★★★★                     |
| Ease of editing     | ★★☆☆☆               | ★★★★★                     |
| Duplicate detection | ❌                  | ✅                        |
| Delete confirmation | ❌                  | ✅                        |
| File count display  | ❌                  | ✅                        |
| Inline editing      | ❌                  | ✅                        |
| Summary stats       | ❌                  | ✅                        |
| Empty state         | Basic               | Friendly                  |
| Mobile-friendly     | ★★★☆☆               | ★★★★☆                     |
