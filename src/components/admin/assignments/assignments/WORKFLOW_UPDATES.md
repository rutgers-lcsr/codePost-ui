# Assignment Files Form - Updated for Complete Workflow

## What Changed

The form has been updated to clearly reflect that **Assignment Files** are starter files that students download, complete, and submit back.

## Visual Updates

### 1. Info Banner (New!)

```
┌─────────────────────────────────────────────────────────────┐
│ ℹ️  📥 Students will download these files →                 │
│     Complete the work → 📤 Submit completed files for grade │
└─────────────────────────────────────────────────────────────┘
```

A clear banner at the top explains the workflow visually.

### 2. Updated Labels

| Old Label                        | New Label                |
| -------------------------------- | ------------------------ |
| "Submission Files"               | "**Assignment Files**"   |
| "Required"                       | "**Required to Submit**" |
| "Must be present in submissions" | "Must be submitted"      |

### 3. Updated Tooltips & Help Text

**Column Header Tooltip:**

> "Students must include these files when submitting their completed work"

**Empty State:**

> "No starter files yet. Add files that students will download to begin the assignment."

**Footer Help Text:**

> "These files will be downloaded by students as starter files. Students will complete the work and submit them back for grading."

### 4. Enhanced Workflow Section

```
Workflow:
1. Students download these assignment files as starter code
2. Students complete the assignment work locally
3. Students submit the completed files for grading

[2 Required] Must be submitted
[1 Optional] Can be submitted
```

## Complete Visual Layout

```
┌───────────────────────────────────────────────────────────────────────┐
│ 📄 Assignment Files [3]                                               │
├───────────────────────────────────────────────────────────────────────┤
│ ℹ️  📥 Students download these → Complete work → 📤 Submit for grade  │
├───────────────────────────────────────────────────────────────────────┤
│ File Name            Extension    Required to Submit ⓘ    Actions    │
├───────────────────────────────────────────────────────────────────────┤
│ 📄 main.py [✏️]      [py]         ☑ ✓                    [🗑️]         │
│ 📄 test.py [✏️]      [py]         ☑ ✓                    [🗑️]         │
│ 📄 README.md [✏️]    [md]         ☐                       [🗑️]         │
├───────────────────────────────────────────────────────────────────────┤
│ [Enter file name (e.g., main.py)              ] [+ Add File]          │
│ ℹ️ These files will be downloaded by students as starter files.       │
│   Students will complete the work and submit them back for grading.   │
├───────────────────────────────────────────────────────────────────────┤
│ Workflow:                                                             │
│ 1. Students download these assignment files as starter code           │
│ 2. Students complete the assignment work locally                      │
│ 3. Students submit the completed files for grading                    │
│                                                                       │
│ [2 Required] Must be submitted    [1 Optional] Can be submitted      │
└───────────────────────────────────────────────────────────────────────┘
```

## Usage in Context

### In Assignment Settings Dialog

The form appears in the **Submission** tab with updated context:

**Label:** "Assignment files"

**Helper Text:** "Starter files that students will download, complete, and submit back for grading."

## Key Messaging

### For Instructors

The form now clearly communicates:

1. These are **starter files** you provide
2. Students will **download** them
3. Students **complete the work**
4. Students **submit back** for grading

### For Understanding the Workflow

**Before (unclear):** "Submission files" could mean:

- Files students create from scratch?
- Files students must submit?
- Template files?

**After (clear):** "Assignment files" with visual workflow:

- 📥 Download → Work → 📤 Submit
- Explicit 3-step workflow description
- Clear labeling of "Required to Submit"

## Benefits

1. **Crystal Clear Purpose**: Info banner immediately explains what these files are for
2. **Visual Workflow**: Icons (📥 📤) show the download → work → submit flow
3. **Better Labels**: "Assignment Files" and "Required to Submit" are more accurate
4. **Helpful Context**: Footer explains the complete workflow in detail
5. **Consistent Messaging**: All text reinforces the same workflow concept

## Real-World Example

### Python Programming Assignment

**Instructor Creates:**

```
Assignment Files:
✓ main.py         - Template with TODO comments
✓ test.py         - Unit tests to verify implementation
  utils.py        - Helper functions (optional)
```

**What Students See:**

1. Banner: "📥 Students will download these files → Complete → 📤 Submit"
2. They download all files
3. They see TODOs in main.py
4. They implement the functions
5. They run test.py to verify
6. They submit main.py and test.py (required), utils.py (if used)

**What Instructors Grade:**

- Student's completed main.py
- Student's test.py (may have added tests)
- Any additional files student created

## Technical Implementation

### File Structure

Each assignment file includes:

- `name`: e.g., "main.py"
- `extension`: e.g., "py"
- `required`: true/false (Required to Submit)
- `code`: Starter/template code content
- `assignment`: Assignment ID
- `path`: File path (if nested)

### Flow Integration

```
AssignmentFile → (downloaded) → StudentWorkstation → (uploaded) → SubmissionFile
```

## Documentation Reference

For complete workflow details, see:

- `WORKFLOW_DOCUMENTATION.md` - Full workflow with examples
- `ASSIGNMENT_FILES_FORM_README.md` - Component documentation
- `USAGE_EXAMPLES.md` - Code integration examples

## Summary

The updated form now clearly communicates that Assignment Files are **starter files** in a **download → complete → submit** workflow, making the purpose and usage immediately obvious to instructors creating assignments.
