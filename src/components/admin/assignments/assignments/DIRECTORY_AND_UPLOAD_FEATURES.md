# Assignment Files Form - Directory Structure & Code Upload

## New Features Added

### 🎯 Problem Solved

The form now supports:

1. **Directory structure** - Files can be organized in folders (e.g., `src/main.py`, `tests/test.py`)
2. **Code upload** - Upload actual starter code files for students to download
3. **Code viewing/editing** - View and edit uploaded code directly in the browser

---

## Visual Overview

### Updated Table Columns

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 📄 Assignment Files [3]                                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ ℹ️  📥 Students download → Complete work → 📤 Submit for grading            │
├─────────────────────────────────────────────────────────────────────────────┤
│ File Path           Ext   Code             Required to Submit  Actions      │
├─────────────────────────────────────────────────────────────────────────────┤
│ 📁📄 src/main.py    [py]  [Upload] [View]  ☑ ✓                [Edit][🗑️]   │
│ 📁📄 tests/test.py  [py]  [Upload]         ☑ ✓                [Edit][🗑️]   │
│ 📄 README.md        [md]  [Upload] [View]  ☐                  [Edit][🗑️]   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Key New Features

### 1. **Directory Structure Support** 📁

#### Adding Files with Path

```
┌──────────────────────────────────────────────────────────────┐
│ [📁 Directory: src        ] [main.py] [+ Add File]          │
└──────────────────────────────────────────────────────────────┘
```

**Examples:**

- `src/main.py` → File in `src` directory
- `tests/unit/test_main.py` → File in nested `tests/unit` directory
- `README.md` → File in root directory (no path)

#### Editing Path

Click the Edit icon to modify both path and filename:

```
┌────────────────────────────────────┐
│ Edit File Path                     │
├────────────────────────────────────┤
│ Directory:                         │
│ [src                             ] │
│                                    │
│ File name:                         │
│ [main.py                         ] │
│                                    │
│           [Cancel]  [OK]           │
└────────────────────────────────────┘
```

---

### 2. **Code Upload** 📤

#### Upload Button

Each file row has an **Upload** button:

- Click to select a file from your computer
- Reads the file content automatically
- Displays **"Replace"** if code already exists

#### Example Workflow:

1. Add file: `main.py`
2. Click **Upload** button
3. Select `main.py` from computer
4. Code is uploaded and **View** button appears

---

### 3. **Code Viewing & Editing** 👁️

#### View Code Modal

Click **View** to see/edit the uploaded code:

```
┌────────────────────────────────────────────────────────┐
│ 💻 src/main.py                                         │
├────────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────────┐ │
│ │ def main():                                        │ │
│ │     # TODO: Implement the main function          │ │
│ │     pass                                          │ │
│ │                                                    │ │
│ │ if __name__ == "__main__":                        │ │
│ │     main()                                        │ │
│ │                                                    │ │
│ │                                                    │ │
│ └────────────────────────────────────────────────────┘ │
│ This is the starter code students will download.      │
│                                                        │
│                    [Close]  [Save Changes]             │
└────────────────────────────────────────────────────────┘
```

**Features:**

- Large text area with monospace font
- Edit code directly in browser
- Save changes without re-uploading
- Shows full path in title

---

## Complete Workflow Examples

### Example 1: Python Project with Structure

**Step 1: Add files with directory structure**

```
Add: src/main.py
Add: src/utils.py
Add: tests/test_main.py
Add: README.md
```

**Step 2: Upload starter code**

- Click Upload on `src/main.py` → Select file with function stubs
- Click Upload on `src/utils.py` → Select file with helper functions
- Click Upload on `tests/test_main.py` → Select file with test cases
- Click Upload on `README.md` → Select instructions file

**Step 3: Verify code**

- Click View on each file to review
- Edit if needed
- Save changes

**Result:**

```
Assignment Files:
  📁 src/
    📄 main.py (has code) ✓ required
    📄 utils.py (has code) ✓ required
  📁 tests/
    📄 test_main.py (has code) ✓ required
  📄 README.md (has code) optional
```

Students download and get:

```
assignment/
├── src/
│   ├── main.py      (with TODO comments)
│   └── utils.py     (with helper stubs)
├── tests/
│   └── test_main.py (with test cases)
└── README.md        (with instructions)
```

---

### Example 2: Web Development Assignment

**Directory Structure:**

```
public/index.html    ✓ required
public/styles.css    ✓ required
src/app.js           ✓ required
src/utils.js         optional
README.md            optional
```

**With Uploaded Code:**

- `public/index.html` → HTML skeleton with TODOs
- `public/styles.css` → Basic CSS structure
- `src/app.js` → JavaScript framework with empty functions
- `src/utils.js` → Optional utility functions
- `README.md` → Project instructions

---

### Example 3: Java Maven Project

**Directory Structure:**

```
src/main/java/Main.java           ✓ required
src/test/java/MainTest.java       ✓ required
pom.xml                            ✓ required
README.md                          optional
```

**With Uploaded Code:**

- `src/main/java/Main.java` → Class with method stubs
- `src/test/java/MainTest.java` → JUnit test cases
- `pom.xml` → Maven dependencies
- `README.md` → Instructions

---

## UI Features

### File Path Column

- Shows folder icon (📁) if file has a path
- Shows full path: `src/main.py` not just `main.py`
- Click Edit to change path or name

### Code Column

- **Upload** button - Select file from computer
- **Replace** button - If code already exists
- **View** button - Only appears after code is uploaded
- Shows upload status

### Add File Section

```
[📁 Directory      ] [File name        ] [+ Add File]
 (30% width)         (50% width)         (button)
```

- Optional directory path with folder icon
- File name with extension
- Both fields accessible

### Help Text

> "Add files with optional directory structure. Upload starter code for each file after adding."

---

## Technical Details

### File Object Structure

```typescript
{
  id: number,
  name: string,           // e.g., "main.py"
  path: string,           // e.g., "src" or "" for root
  extension: string,      // e.g., "py"
  code: string,           // Uploaded starter code content
  required: boolean,      // Must student submit this?
  assignment: number,     // Assignment ID
  created: string,        // ISO timestamp
  description: string,    // Optional description
}
```

### Full Path Display

- Displayed as: `{path}/{name}` when path exists
- Displayed as: `{name}` when path is empty/root
- Stored separately: `path` and `name` fields

### Code Upload Process

1. User clicks Upload button
2. File picker opens
3. File selected
4. Read file as text using FileReader API
5. Store in `code` field
6. Show success message
7. View button becomes available

### Code Editing

1. Click View button
2. Modal opens with code in textarea
3. Edit code (or paste new code)
4. Click Save Changes
5. Code updated in file object
6. Modal closes

---

## Benefits

### For Instructors

1. **Better Organization** - Group files by purpose (src, tests, docs)
2. **Real Starter Code** - Upload actual template files, not just names
3. **Easy Management** - View and edit code without re-uploading
4. **Flexibility** - Support any project structure

### For Students

1. **Proper Structure** - Download organized project folders
2. **Ready to Work** - Get actual template code with TODOs
3. **Clear Expectations** - See exactly what files are needed
4. **Professional Setup** - Real project structure like in industry

### For Grading

1. **Consistent Structure** - All submissions follow same structure
2. **Complete Context** - Graders see full file paths
3. **Better Comparison** - Easy to see what students changed
4. **Template Diffing** - Can compare against original starter code

---

## Usage Tips

### Best Practices

1. **Use Meaningful Paths**
   - ✅ `src/main.py`, `tests/test.py`
   - ❌ `file1.py`, `file2.py`

2. **Upload Quality Starter Code**
   - Include helpful TODO comments
   - Add function/class stubs
   - Provide example usage
   - Include docstrings

3. **Test Your Setup**
   - View each uploaded file
   - Verify paths are correct
   - Check that code displays properly
   - Ensure required files are marked

4. **Provide Clear Instructions**
   - Upload a README.md with details
   - Explain file structure in assignment description
   - List what students need to implement

---

## Common Workflows

### Quick Start (Simple Assignment)

1. Add file: `main.py`
2. Click Upload, select template
3. Mark as required
4. Done!

### Full Setup (Complex Project)

1. Plan directory structure
2. Add all files with paths
3. Upload starter code for each
4. Mark required files
5. Add optional files (README, config)
6. Review all code
7. Save assignment

### Edit Existing Setup

1. Click Edit to change paths
2. Click View to edit code
3. Click Upload to replace code
4. Toggle required checkboxes
5. Delete unused files

---

## Summary of Changes

| Feature           | Before | After                   |
| ----------------- | ------ | ----------------------- |
| Directory support | ❌     | ✅ Root or nested paths |
| Code upload       | ❌     | ✅ Upload from computer |
| Code viewing      | ❌     | ✅ View/edit in modal   |
| Path editing      | ❌     | ✅ Edit path + name     |
| File organization | ❌     | ✅ Folder structure     |
| Starter code      | ❌     | ✅ Actual file content  |

The form is now a complete **assignment file manager** with full support for directory structures and code content! 🎉
