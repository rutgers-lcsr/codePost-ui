# Assignment Files - Workflow Overview

## Purpose

**Assignment Files** are starter files that instructors provide to students. They form the foundation of the assignment and guide students on what needs to be completed.

## Complete Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                     ASSIGNMENT WORKFLOW                         │
└─────────────────────────────────────────────────────────────────┘

   [1] INSTRUCTOR CREATES                    [Instructor Side]
       ┌──────────────────────┐
       │  Assignment Files    │
       │  - main.py           │
       │  - test.py           │
       │  - README.md         │
       └──────────────────────┘
              │
              │ Upload to codePost
              ▼
       ┌──────────────────────┐
       │   codePost System    │
       │  (stores files)      │
       └──────────────────────┘
              │
              │ Student downloads
              ▼
   [2] STUDENT RECEIVES                      [Student Side]
       ┌──────────────────────┐
       │  Starter Files       │
       │  main.py (template)  │
       │  test.py (template)  │
       │  README.md           │
       └──────────────────────┘
              │
              │ Student works locally
              ▼
       ┌──────────────────────┐
       │  Completed Work      │
       │  main.py (done)      │
       │  test.py (done)      │
       │  README.md (done)    │
       └──────────────────────┘
              │
              │ Student uploads
              ▼
   [3] SUBMISSION CREATED                    [codePost System]
       ┌──────────────────────┐
       │  Submission Files    │
       │  main.py             │
       │  test.py             │
       │  README.md           │
       └──────────────────────┘
              │
              │ Grader reviews
              ▼
   [4] GRADING & FEEDBACK                    [Instructor Side]
       ┌──────────────────────┐
       │  Graded Submission   │
       │  + Comments          │
       │  + Rubric            │
       │  + Score             │
       └──────────────────────┘
```

## Key Concepts

### Assignment Files (Step 1)

- **Created by**: Instructors
- **Purpose**: Starter code/templates for students
- **Contains**:
  - Template code
  - Instructions
  - Skeleton functions
  - Test frameworks
  - Configuration files
- **Examples**:
  - Python: `main.py` with function stubs, `test.py` with test cases
  - Java: `Main.java` with class structure, `pom.xml` for dependencies
  - Web: `index.html` skeleton, `styles.css` starter, `script.js` framework

### Student Downloads (Step 2)

- Students access the assignment in codePost
- Download all assignment files as a package
- Receive both required and optional files
- Work on their local machine

### Student Submission (Step 3)

- **Created by**: Students
- **Purpose**: Completed work for grading
- **Must include**: All files marked as "Required to Submit"
- **May include**: Optional files (if specified)
- **Becomes**: Submission Files in codePost

### Grading (Step 4)

- Instructors review submission files
- Add comments and apply rubric
- Provide feedback
- Assign grade

## File Types

### Required Files

- **Marked with**: ✓ checkbox in "Required to Submit" column
- **Student must**: Include these in their submission
- **System validates**: Submission is incomplete without them
- **Examples**:
  - Core implementation files (main.py, Main.java)
  - Required test files
  - Documentation files (if specified)

### Optional Files

- **Marked as**: Not required
- **Student may**: Include if they created additional files
- **Common uses**:
  - Helper modules
  - Additional test cases
  - Extra documentation
  - Configuration files

## Example Scenarios

### Scenario 1: Python Programming Assignment

**Assignment Files (Instructor Creates):**

```
✓ main.py          (required) - Template with function stubs
✓ test.py          (required) - Unit tests to pass
  README.md        (optional) - Instructions and hints
  requirements.txt (optional) - Python dependencies
```

**Student Downloads:**

- Gets all 4 files above
- Sees TODO comments in main.py
- Runs test.py to check progress

**Student Submits:**

- Must submit: main.py (completed), test.py (may add tests)
- Can submit: README.md (if they added notes), requirements.txt

**Instructor Grades:**

- Reviews main.py implementation
- Runs test.py
- Checks code quality
- Provides feedback

### Scenario 2: Web Development Assignment

**Assignment Files:**

```
✓ index.html       (required) - HTML skeleton
✓ styles.css       (required) - Basic CSS structure
✓ script.js        (required) - JavaScript framework
  assets/logo.png  (optional) - Provided logo
```

**Workflow:**

1. Student downloads all files
2. Completes HTML/CSS/JS implementation
3. Submits required files
4. May include additional assets they created

### Scenario 3: Data Science Assignment

**Assignment Files:**

```
✓ analysis.ipynb   (required) - Jupyter notebook with questions
✓ data.csv         (required) - Dataset to analyze
  helper.py        (optional) - Utility functions
  README.md        (optional) - Instructions
```

**Workflow:**

1. Student gets notebook with prompts and data
2. Completes analysis in notebook
3. Submits completed notebook and any helper files
4. Instructor reviews analysis and code quality

## Best Practices

### For Instructors

1. **Provide Clear Structure**
   - Include function/class stubs
   - Add TODO comments
   - Provide example usage
   - Include documentation

2. **Mark Files Appropriately**
   - Required: Core implementation files
   - Optional: Helper files, extras
   - Be consistent across assignments

3. **Include Helpful Resources**
   - README with instructions
   - Example inputs/outputs
   - Test cases students can run
   - Configuration files (if needed)

4. **Test Your Files**
   - Download and test as a student would
   - Ensure starter code runs
   - Verify tests can execute
   - Check for typos/errors

### For Students

1. **Download Early**
   - Get files at assignment start
   - Review structure and requirements
   - Ask questions if unclear

2. **Work Incrementally**
   - Start with small tasks
   - Run tests frequently
   - Commit work regularly (if using git)

3. **Follow Structure**
   - Keep file names unchanged
   - Maintain required functions/classes
   - Don't delete required code

4. **Submit Complete Work**
   - Include all required files
   - Test before submitting
   - Follow submission guidelines

## Technical Details

### File Properties

Each assignment file has:

- **name**: Filename (e.g., "main.py")
- **extension**: File type (e.g., "py")
- **required**: Boolean - must be in submission
- **code**: Template/starter code content
- **path**: Subdirectory (if nested structure)
- **description**: Optional description

### Validation

When a student submits:

1. System checks for all required files
2. Validates file names match
3. Creates submission record
4. Notifies instructors
5. Makes available for grading

### File Template Feature

Instructors can also upload **template code** for grading:

- This is different from assignment files
- Used to de-emphasize boilerplate during grading
- Helps graders focus on student-written code
- See "Grading" tab → "File template code"

## FAQ

**Q: What's the difference between Assignment Files and File Templates?**
A:

- **Assignment Files**: Starter files students download and work with
- **File Templates**: Reference code for graders to compare against during grading

**Q: Can students add files not in the assignment files list?**
A: It depends on your submission settings. Some systems allow additional files, others only accept files matching the assignment files list.

**Q: Should I mark all files as required?**
A: Only mark files as required if students MUST submit them. Optional files give flexibility for students who create helper modules or extras.

**Q: Can I update assignment files after students have downloaded them?**
A: Yes, but communicate changes clearly to students. They may need to re-download.

**Q: What if a student doesn't submit a required file?**
A: The system will typically flag this as an incomplete submission or prevent submission entirely.

**Q: Should I include solutions in assignment files?**
A: No! Only include:

- Function/class stubs (empty implementations)
- TODO comments
- Example usage
- Test cases (without solutions)
