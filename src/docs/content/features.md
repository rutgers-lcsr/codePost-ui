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

The codePost auto-run environment supports many programming languages. See [Environment & Testing Ops](/docs/instructor-environment-testing) for configuration guidance.

### Common Languages

- Python 3
- R
- Java

#### May work

The following are lanuages which some features may not work as expected

- C/C++
- JavaScript/Node.js
- Ruby
- PHP

> [!IMPORTANT]
> codePost relies on your feedback to improve the auto-run environment. If you find that a language is not supported, please let us know at [codepost@cs.rutgers.edu](mailto:codepost@cs.rutgers.edu).

### Environment Detection

When Auto Detect Environment mode is enabled, codePost will:

1. Analyze submitted files
2. Detect the programming language
3. Set up appropriate build/run commands
4. Install detected dependencies

### Custom Environments

If your course requires specific libraries or language versions not covered by the default environment:

1. Go to **Assignment Settings > Environment**.
2. Select **Custom Docker Image**.
3. Provide a Dockerfile or pull from a registry.
   This ensures your autograder runs exactly as expected.

## AI-Assisted Grading

codePost integrates with AI providers to help graders write better feedback faster and to generate test cases for assignments. Graders can draft comments and use AI to refine them for clarity, tone, and helpfulness. Instructors can also use AI to generate test scripts based on assignment specifications.

Instructors retain full control over the AI environment:

- **System Prompts**: customizing how the AI behaves.
- **Context**: deciding what information (code, rubric, etc.) is shared with the AI.
- **Model Choice**: configuring your preferred provider and model.

> [!IMPORTANT]
> **Enabling AI Features**
>
> 1. Go to **Course Settings > General**.
> 2. Scroll to **AI Features**.
> 3. Enter your **AI Provider**, **API Key**, and **Model Name**.
> 4. Click **Save**.
> 5. Enable **AI Comment Generation**
> 6. Click **Save**.
>
> Once enabled, you can use AI features in the grader interface when writing comments or generate test cases in the Test Script editor.
>
> ![AI Features configuration in Course Settings](/assets/docs/instructor_ai_settings.png)

### Autograding and Tests Generation

codePost can automatically generate test cases and autograding scripts based on your assignment specifications. This feature uses AI to analyze your assignment description, provided code, and any sample tests you have to create comprehensive test suites.

To enable AI-generated tests:

1. Go to **Admin Console > Environment Setup**.
2. Ensure the **Target File** is set for your assignment.
3. Open a test category and click **Generate (AI)** in the Test Script editor.
4. Review the generated script and adjust as needed.

### AI Comment Assistance

Graders can use AI to refine their feedback.

1. Highlght code to leave a comment.
2. Draft your thought (e.g., "function is too long").
3. Click **Refine with AI** or use the magic wand icon.
4. The AI will suggest a more constructive phrasing (e.g., "Consider refactoring this function into smaller helpers to improve readability.").

> [!NOTE]
> AI-generated tests are a starting point. You can always edit the script or use the builder to refine cases.

---

## Tests ✅

codePost supports script-based autograding that lets instructors define tests directly in the Test Script editor.

### Where to find it

1. Go to **Admin Console > Assignments > Environment**.
2. Select an assignment in **Environment Setup**.
3. Select a **Test Category** or create a new one.
4. Use the **Test Script** editor (Code, Split Preview, or Builder).

### How it works

- Each test is defined in the script using a language-specific test decorator or macro.
- The backend parses your script and creates test cases automatically.
- The **Preview** panel shows how your tests will appear to graders.
- Total points are computed from the `points` values in your test definitions.

> [!IMPORTANT]
> Make sure each test includes a **name** and **points**. This keeps preview and scoring consistent.

### Dedicated Testing Guide

The full syntax reference, examples, and language-by-language patterns now live in the **Testing Guide**:

- [Testing Guide](/docs/testing-guide)

Use this as the source of truth for supported script formats and examples.
