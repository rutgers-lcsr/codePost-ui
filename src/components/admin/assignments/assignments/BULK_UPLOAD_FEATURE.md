# Bulk Upload Feature - Single Files & Zip Archives

## Overview

The Assignment Files Form now supports **bulk upload** - upload either a **single file** or a **zip archive** containing multiple files, and they'll be automatically added with their content!

---

## 🎯 Key Benefits

### Before (Manual Process)

1. Add file name manually → `main.py`
2. Click Upload button on row
3. Select file from computer
4. Repeat for each file... 😫

### After (Bulk Upload)

1. Click "Upload File or Zip"
2. Select your zip archive
3. Done! All files added with code ✨

**Time Saved:** From minutes to seconds for multi-file projects!

---

## 📤 Upload Options

### Option 1: Upload Single File

- Upload any single file (`.py`, `.java`, `.js`, etc.)
- Automatically creates entry with filename and code
- Places in root directory by default

### Option 2: Upload Zip Archive

- Upload a `.zip` containing your entire project
- **Preserves directory structure** automatically
- **Reads all file contents** automatically
- Skips hidden files and `__MACOSX` folders

---

## Visual Interface

### New Bulk Upload Section

```
┌─────────────────────────────────────────────────────────────┐
│ Add Files Section                                           │
├─────────────────────────────────────────────────────────────┤
│ [📁 Directory] [File name         ] [+ Add File]           │
│                                                             │
│ ─────────────────────────────────────────────────────────  │
│                                                             │
│ Or bulk upload: [📤 Upload File or Zip] Upload a single    │
│                  file with code, or a .zip with multiple    │
│                                                             │
│ ℹ️ Add files manually above, or upload files/zip to        │
│   auto-populate with code.                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Complete Workflows

### Workflow 1: Upload Python Project Zip

**Your Project Structure:**

```
my-assignment/
├── src/
│   ├── main.py
│   └── utils.py
├── tests/
│   └── test_main.py
└── README.md
```

**Steps:**

1. Zip the `my-assignment` folder → `assignment.zip`
2. Click "Upload File or Zip"
3. Select `assignment.zip`
4. **Result:**

```
Assignment Files Added:
📁📄 src/main.py (has code)
📁📄 src/utils.py (has code)
📁📄 tests/test_main.py (has code)
📄 README.md (has code)
```

**All files automatically have:**

- ✅ Correct path (`src`, `tests`, root)
- ✅ Correct filename
- ✅ Correct extension
- ✅ Complete code content
- ✅ Ready to mark as required

---

### Workflow 2: Upload Java Maven Project

**Your Project:**

```
java-assignment/
├── src/
│   └── main/
│       └── java/
│           └── Main.java
├── src/
│   └── test/
│       └── java/
│           └── MainTest.java
├── pom.xml
└── README.md
```

**Upload & Result:**

```
📁📄 src/main/java/Main.java (has code)
📁📄 src/test/java/MainTest.java (has code)
📄 pom.xml (has code)
📄 README.md (has code)
```

Full path preserved automatically!

---

### Workflow 3: Upload Web Project

**Your Project:**

```
web-assignment/
├── public/
│   ├── index.html
│   └── styles.css
├── src/
│   ├── app.js
│   └── utils.js
└── README.md
```

**Upload zip → All files added with paths and code!**

---

### Workflow 4: Upload Single File

**Quick Single File:**

1. Click "Upload File or Zip"
2. Select `main.py` from computer
3. **Result:** `main.py` added in root with code

**Use Case:** Quick assignments with just one file

---

## Technical Details

### Zip Processing

#### What Gets Extracted:

- ✅ All text files with content
- ✅ Directory structure preserved
- ✅ File extensions detected
- ✅ Relative paths maintained

#### What Gets Skipped:

- ❌ Directories (folders themselves)
- ❌ Hidden files (`.gitignore`, `.DS_Store`)
- ❌ `__MACOSX/` folder (Mac metadata)
- ❌ Files starting with `.`

### File Processing

```javascript
// For each file in zip:
{
  name: "main.py",
  path: "src",                    // From zip structure
  extension: "py",                // Auto-detected
  code: "def main():\n    pass",  // File content
  required: false,                // Default to optional
}
```

### Path Extraction

**From Zip Path:** `src/utils/helper.py`

**Extracts To:**

- `name`: `helper.py`
- `path`: `src/utils`

**Displays As:** `src/utils/helper.py`

---

## Example Use Cases

### Use Case 1: Course Setup

**Problem:** Setting up 20 assignments for a course

**Solution:**

1. Create starter projects locally
2. Zip each project
3. Upload each zip → instant assignment files
4. Mark required files
5. Done in minutes!

---

### Use Case 2: Reusing Assignments

**Problem:** Want to use last semester's assignment

**Solution:**

1. Find last semester's starter zip
2. Upload to new assignment
3. Tweak as needed
4. Much faster than manual recreation

---

### Use Case 3: Team-Created Assignments

**Problem:** TA created starter code, instructor needs to upload

**Solution:**

1. TA sends zip file
2. Instructor uploads directly
3. No manual file-by-file entry
4. Less chance of errors

---

### Use Case 4: Complex Project Structures

**Problem:** Assignment has 15+ files in different folders

**Manual Way:**

- Add 15 file entries
- Set paths for each
- Upload code for each
- **30+ minutes** 😫

**With Bulk Upload:**

- Upload one zip
- **10 seconds** ✨

---

## UI/UX Features

### Visual Feedback

**During Upload:**

```
Processing zip file...
```

**On Success:**

```
✅ Extracted 8 files from assignment.zip
```

**On Error:**

```
❌ Failed to process zip file
⚠️ No valid files found in zip
```

### Smart Defaults

All uploaded files start as:

- ✅ **Not required** (you choose which are required)
- ✅ **In correct directories**
- ✅ **With code content loaded**
- ✅ **With proper extensions**

### Edit After Upload

After bulk upload, you can still:

- ✅ Edit paths/names
- ✅ Edit code
- ✅ Toggle required status
- ✅ Delete unwanted files
- ✅ Add more files manually

---

## Best Practices

### 1. Prepare Your Zip

**Good Structure:**

```
assignment/
├── src/
│   └── main.py
├── tests/
│   └── test.py
└── README.md
```

**Avoid:**

```
assignment/
├── .git/
├── __pycache__/
├── node_modules/
└── .DS_Store
```

### 2. Clean Before Zipping

Remove:

- Build artifacts (`*.pyc`, `*.class`)
- Dependencies (`node_modules/`, `venv/`)
- Hidden files (`.git/`, `.DS_Store`)
- IDE files (`.vscode/`, `.idea/`)

### 3. Test Locally First

Before zipping:

1. ✅ Code runs without errors
2. ✅ TODOs are clear
3. ✅ Comments are helpful
4. ✅ Structure makes sense

### 4. Use Meaningful Paths

**Good:**

- `src/main.py`
- `tests/unit/test_main.py`
- `docs/README.md`

**Less Clear:**

- `file1.py`
- `stuff/things.py`

### 5. Review After Upload

After bulk upload:

1. Check file list is complete
2. View code for each file
3. Mark required files
4. Test by clicking View on a few files

---

## Comparison: Manual vs Bulk

| Task               | Manual Entry | Bulk Upload (Zip) |
| ------------------ | ------------ | ----------------- |
| 5 files            | ~10 minutes  | ~10 seconds       |
| 10 files           | ~20 minutes  | ~15 seconds       |
| 20 files           | ~40 minutes  | ~20 seconds       |
| With nested paths  | Add time     | Same time         |
| Prone to typos     | Yes          | No                |
| Code already added | No           | Yes               |
| Paths preserved    | Manual       | Automatic         |

---

## Common Scenarios

### Scenario 1: Student Asks "Can I see the starter code?"

**Before:** "Let me email you the files..."

**After:** Students download directly from codePost with exact structure!

---

### Scenario 2: Found a Bug in Starter Code

**Before:**

1. Edit each file row
2. Re-upload code for each
3. Hope you got them all

**After:**

1. Fix locally
2. Re-zip
3. Delete old files
4. Upload new zip
5. Mark required
6. Done!

---

### Scenario 3: Different Sections Need Different Files

**Easy!**

1. Create `section-A.zip` and `section-B.zip`
2. Upload appropriate zip for each assignment
3. Customize as needed

---

## Troubleshooting

### "No valid files found in zip"

**Cause:** Zip contains only directories or hidden files

**Solution:** Ensure zip contains actual code files

### "Failed to process zip file"

**Cause:** Corrupted or invalid zip

**Solution:**

- Re-create zip
- Try uploading individual files
- Check zip opens locally

### "Too many files"

**Cause:** Zip contains build artifacts or dependencies

**Solution:** Clean project before zipping (remove `node_modules/`, etc.)

### "Paths look wrong"

**Cause:** Zip structure different than expected

**Solution:**

- Check local zip structure
- Use Edit button to fix paths
- Re-zip with correct structure

---

## Advanced Tips

### Tip 1: Template Repos

Keep a GitHub repo of assignment templates. Clone, zip, upload!

### Tip 2: Version Control

Keep zips of each assignment version for easy rollback.

### Tip 3: Partial Upload

Upload zip, then:

- Delete unwanted files
- Add manual entries for special files
- Combine both methods!

### Tip 4: File Naming

Name zips clearly:

- `assignment1-starter.zip` ✅
- `stuff.zip` ❌

---

## Summary

The bulk upload feature transforms assignment setup from a tedious manual process into a quick, error-free operation. Whether you're uploading a single file or a complex multi-folder project, one click gets all your starter code in place with proper structure and content.

**Before:** Manual entry, file by file, path by path
**After:** Upload zip, mark required, done! ✨

Perfect for:

- 🎓 Course instructors setting up multiple assignments
- 👥 TAs creating starter code
- ♻️ Reusing assignments from previous semesters
- 🏗️ Complex projects with many files
- ⚡ Anyone who values their time!
