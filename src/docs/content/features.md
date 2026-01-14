# Features Guide

This guide covers advanced features available in codePost.

## Anonymous Grading

Anonymous grading mode hides student identities from graders to reduce bias in grading.

### Enabling Anonymous Grading

1. Go to **Admin Console > Assignments**
2. Click the **Settings** icon for the assignment
3. Navigate to the **Grading** tab
4. Toggle **Anonymous Grading Mode** on

### How It Works

When enabled:

- Graders see submissions labeled with anonymous IDs (e.g., "Student A", "Student B")
- Student names and emails are hidden during grading
- Admins can still view student identities
- Anonymization is removed when grades are published

> [!IMPORTANT]
> Enable anonymous grading before grading begins. Graders who have already seen submissions will have seen the student names.

<!-- ## Plagiarism Detection (MOSS)

codePost integrates with Stanford's MOSS (Measure Of Software Similarity) to detect potential plagiarism.

### What is MOSS?

MOSS is an automatic system for detecting software plagiarism. It compares all submissions against each other and external sources to identify similar code.

### Running MOSS

1. Go to **Admin Console > Assignments**
2. Select your assignment
3. Click **MOSS** in the sidebar
4. Configure options:
   - Select files to analyze
   - Set similarity threshold
   - Include/exclude base files (starter code)
5. Click **Run MOSS**

### Interpreting Results

MOSS reports show:

- **Similarity percentage** between pairs of submissions
- **Highlighted code** showing matching sections
- **Line-by-line comparison** of similar code

> [!WARNING]
> High similarity doesn't always mean plagiarism. Students may have similar code due to following the same instructions or using common algorithms. Always review flagged submissions manually.

### Best Practices

- Run MOSS after all submissions are collected
- Exclude provided starter code from analysis
- Review results in context of assignment requirements
- Document your findings before taking action -->

---

## Supported Languages

The codePost auto-run environment supports many programming languages. See the [Auto-Run Environment](/docs/instructor#auto-run-environment) section in the Instructor Guide for details on configuring environments.

### Common Languages

- Python 3
- R
- JavaScript/Node.js
- Java

#### May work

- C/C++
- Ruby
- Go
- Rust

> [!IMPORTANT]
> codePost relies on your feedback to improve the auto-run environment. If you find that a language is not supported, please let us know at [codepost@cs.rutgers.edu](mailto:codepost@cs.rutgers.edu).

### Environment Detection

When Auto Detect Environment mode is enabled, codePost will:

1. Analyze submitted files
2. Detect the programming language
3. Set up appropriate build/run commands
4. Install detected dependencies

For custom environments or specific language versions, configure the environment manually in Assignment Settings.

## AI Intigration

codePost allows graders to create draft comments and use AI to refine them. Instructors can define system prompts and choose whether to include specific context or information for the AI. We support various AI models and configurations to help provide high-quality feedback efficiently.
