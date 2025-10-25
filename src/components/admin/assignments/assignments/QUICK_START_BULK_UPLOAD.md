# Quick Start: Bulk Upload Guide

## 🚀 Two Ways to Add Files

### Method 1: Manual Entry (One at a time)

```
1. Type directory: "src"
2. Type filename: "main.py"
3. Click "Add File"
4. Click "Upload" on row
5. Select file
6. Repeat for each file...
```

**Use when:** Adding 1-3 files

---

### Method 2: Bulk Upload (All at once)

```
1. Click "Upload File or Zip"
2. Select your .zip file
3. Done! All files added ✨
```

**Use when:** Adding 4+ files, or any complex structure

---

## 📦 Creating Your Zip File

### Step 1: Organize Your Project

```
my-assignment/
├── src/
│   ├── main.py       ← Has TODOs for students
│   └── utils.py      ← Has helper function stubs
├── tests/
│   └── test_main.py  ← Has test cases
└── README.md         ← Has instructions
```

### Step 2: Clean It Up

**Remove these before zipping:**

- `__pycache__/` folders
- `.git/` folder
- `node_modules/` folder
- `.DS_Store` files
- `.env` files
- Virtual environments
- Build artifacts

### Step 3: Create Zip

**Mac/Linux:**

```bash
cd my-assignment
zip -r assignment.zip .
```

**Windows:**
Right-click folder → Send to → Compressed (zipped) folder

### Step 4: Verify Zip

Open the zip to check:

- ✅ Files are there
- ✅ Structure looks right
- ✅ No unwanted files

---

## 🎯 Upload Process

### Visual Flow

```
┌─────────────────────────────────────────┐
│  1. Click Upload Button                 │
│     [📤 Upload File or Zip]             │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  2. Select File                         │
│     • Single file: main.py              │
│     • Or zip: assignment.zip            │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  3. Processing...                       │
│     (Extracting & reading files)        │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  4. Success! ✅                         │
│     "Extracted 8 files from zip"        │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  5. Files Appear in Table               │
│     📁📄 src/main.py      [View]        │
│     📁📄 src/utils.py     [View]        │
│     📁📄 tests/test.py    [View]        │
│     📄 README.md          [View]        │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  6. Mark Required Files                 │
│     ✓ Check boxes for required files   │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  7. Save Assignment ✨                  │
└─────────────────────────────────────────┘
```

---

## ⏱️ Time Comparison

### Simple Assignment (3 files)

- **Manual:** 5 minutes
- **Bulk Upload:** 30 seconds
- **Saved:** 4.5 minutes

### Medium Assignment (8 files)

- **Manual:** 15 minutes
- **Bulk Upload:** 1 minute
- **Saved:** 14 minutes

### Complex Assignment (20 files)

- **Manual:** 40 minutes
- **Bulk Upload:** 2 minutes
- **Saved:** 38 minutes! 🎉

---

## 💡 Pro Tips

### Tip 1: Test Your Zip Locally

```bash
# Unzip to test
unzip assignment.zip -d test/
# Check structure
ls -R test/
# Clean up
rm -rf test/
```

### Tip 2: Standard Structure

Keep all assignments in consistent structure:

```
assignment-N/
├── src/        ← Source code
├── tests/      ← Test files
├── docs/       ← Documentation
└── README.md   ← Instructions
```

### Tip 3: Reusable Templates

Create template repos:

```
python-template/
java-template/
web-template/
data-science-template/
```

Clone, customize, zip, upload!

### Tip 4: Version Your Zips

```
assignment1-v1.zip  ← Original
assignment1-v2.zip  ← Bug fix
assignment1-v3.zip  ← Updated instructions
```

### Tip 5: Share Zips with TAs

```
1. TA creates starter → TA-assignment.zip
2. Send to instructor
3. Instructor uploads directly
4. Everyone uses same starter
```

---

## 🐛 Common Issues & Fixes

### Issue 1: "No files found"

**Problem:** Zip only has folders, no files

**Fix:** Ensure files are inside the zip:

```bash
unzip -l assignment.zip  # List contents
```

### Issue 2: Paths are wrong

**Problem:** Zip structure: `assignment/src/main.py`
**Result:** Path becomes `assignment/src`

**Fix:** Zip from inside the folder:

```bash
cd assignment
zip -r ../assignment.zip .
```

Not:

```bash
zip -r assignment.zip assignment/
```

### Issue 3: Hidden files uploaded

**Problem:** `.DS_Store`, `.gitignore` in files list

**Fix:** System auto-skips hidden files (files starting with `.`)

Just delete the rows if they appear.

### Issue 4: Can't see code

**Problem:** File shows but "View" doesn't work

**Fix:**

1. Check if file was text (not binary)
2. Try re-uploading
3. Or use "Upload" button on row

---

## 📋 Checklist

Before you zip:

- [ ] All starter code has TODOs
- [ ] Comments are helpful
- [ ] Code runs without errors
- [ ] Tests are included
- [ ] README has clear instructions
- [ ] No build artifacts
- [ ] No dependencies folders
- [ ] No sensitive files (.env)
- [ ] Structure makes sense

After you upload:

- [ ] All expected files appear
- [ ] Paths look correct
- [ ] View a few files to check code
- [ ] Mark required files
- [ ] Delete any unwanted files
- [ ] Save assignment

---

## 🎓 Example Workflows

### Python Assignment

```bash
# Prepare
cd python-assignment
rm -rf __pycache__ .pytest_cache .git
# Zip
zip -r assignment.zip src/ tests/ README.md requirements.txt
# Upload to codePost → Done!
```

### Java Assignment

```bash
# Prepare
cd java-assignment
mvn clean  # Remove build files
rm -rf .git .idea
# Zip
zip -r assignment.zip src/ pom.xml README.md
# Upload to codePost → Done!
```

### Web Assignment

```bash
# Prepare
cd web-assignment
rm -rf node_modules .git
# Zip
zip -r assignment.zip public/ src/ package.json README.md
# Upload to codePost → Done!
```

---

## 🎯 Remember

1. **Bulk upload = Fast setup** ⚡
2. **Manual add = Fine control** 🎯
3. **Mix both methods = Best of both** ✨

Use whatever works for your workflow!

---

## Quick Reference Card

```
┌────────────────────────────────────────┐
│ Bulk Upload Quick Reference            │
├────────────────────────────────────────┤
│ Accept: Single files or .zip archives  │
│ Max: No limit on files in zip          │
│ Auto: Paths, names, extensions, code   │
│ Skip: Hidden files, folders, __MACOSX  │
│ Time: ~10 seconds for typical project  │
│ Edit: Can edit everything after upload │
└────────────────────────────────────────┘
```

Happy uploading! 🚀
