# Assignment Workflow

This page covers the full instructor lifecycle for assignments — from creation through grading and grade release.

![Assignments Dashboard](/assets/docs/instructor_dashboard.png)

## Recommended lifecycle

1. **Create** — Add the assignment shell with a name, point value, and visibility.
2. **Configure** — Set submission rules, deadlines, grading options, and upload policies.
3. **Add files** — Upload assignment files (starter code, helper files, test resources).
4. **Build the rubric** — Create rubric categories and comments before grading begins.
5. **Set up tests** _(optional)_ — Configure the execution environment and autograder tests.
6. **Open for submissions** — Enable student upload or bulk-upload submissions yourself.
7. **Grade** — Assign graders, review submissions, apply rubric, finalize.
8. **Publish** — Release grades and feedback to students.

---

## Creating an assignment

From **Assignments > Overview**, click **New Assignment**. You have two options:

### New assignment

- **Name** — must be unique within the course (max 32 characters).
- **Points** — total points available (≥ 0). Used as the starting score in subtractive grading mode.
- **Allow student upload** — toggle on if students should upload their own submissions.
- **Visible** — toggle off to hide the assignment from students while you prepare it.
- **Due Date** — optional; submissions after this date are marked late.

### Clone from existing

Select any assignment from any course in your organization. Cloning copies the rubric, environment, assignment files, test categories, and all configuration — but not student submissions. This is useful when reusing assignments across terms.

---

## Assignment settings

Open any assignment's **Settings** (gear icon) to access four tabs of configuration.

### General tab

| Setting                | Description                                                                                                    |
| ---------------------- | -------------------------------------------------------------------------------------------------------------- |
| **Name**               | Assignment name (unique per course).                                                                           |
| **Points**             | Total points (≥ 0).                                                                                            |
| **Explanation**        | Markdown text shown to students (instructions, expectations, etc.). Toggle **Preview** to see rendered output. |
| **Sort Key**           | Integer that controls assignment ordering in the list. Lower numbers appear first.                             |
| **Hide from sections** | Multi-select specific sections; the assignment will be invisible to students in those sections.                |
| **Assignment Files**   | Manage starter code, helper files, and test resources (see [Assignment files](#assignment-files) below).       |
| **Data Sets**          | Upload large data files for use by the autograder environment.                                                 |

### Submission tab

| Setting                    | Description                                                                                                                             |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Allow student upload**   | Students can upload submissions via the Student Console.                                                                                |
| **Due Date**               | Soft deadline — submissions after this are marked late. Timezone-aware.                                                                 |
| **Allow partners**         | Students can invite partners to their submission (group work).                                                                          |
| **Allow late submissions** | Accept submissions after the due date.                                                                                                  |
| **Max late days**          | Maximum number of days a late submission is accepted (default: 2).                                                                      |
| **Late deductions**        | Array of point penalties per day late (e.g., `[5, 10]` means −5 on day 1, −10 on day 2).                                                |
| **Live feedback mode**     | Students see their submission, comments, and test results _before_ finalization and grade release. Useful for iterative feedback loops. |

### Grading tab

| Setting                             | Description                                                                                                                                |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Additive grading**                | Grade starts at 0 (additive) instead of the assignment point total (subtractive).                                                          |
| **Rubric-only mode**                | Graders must link every comment to a rubric comment — no freeform comments.                                                                |
| **Collaborative rubric**            | Admins and graders can create/edit rubric comments inline while grading in the Code Console.                                               |
| **Graders can edit submissions**    | Graders can modify student files (e.g., to fix a compilation issue and re-test).                                                           |
| **Frequently used rubric comments** | Show the 10 most-used rubric comments at the top of the rubric panel for faster grading.                                                   |
| **Execute files on submit**         | Auto-run submission files on upload (cached output).                                                                                       |
| **Run tests on submit**             | Auto-run autograder test cases when a submission is uploaded.                                                                              |
| **Tests affect grade**              | Include autograder test results in the grade calculation.                                                                                  |
| **Anonymous grading**               | Graders cannot see which student(s) submitted. (If the course has an anonymous grading default, new assignments inherit it automatically.) |
| **Students can see graders**        | Override the course-level setting for this assignment. `null` = use course default.                                                        |
| **Comment feedback**                | Students can provide feedback (thumbs up/down) on rubric comments.                                                                         |
| **Allow regrade requests**          | Students can submit questions or regrade requests after grading.                                                                           |
| **Regrade deadline**                | Cutoff date for new regrade requests.                                                                                                      |

### AI tab

The AI tab controls AI-assisted comment generation for this assignment. AI must first be enabled at the course level (see **Course Settings > AI Features**) before assignment-level settings take effect.

#### Course-level prerequisites

Before the AI tab is useful, an admin must configure AI on the course:

1. Navigate to **Course Settings > AI Features**.
2. Choose a **Provider**: Google Gemini, OpenAI, Ollama (self-hosted), or Custom.
3. Enter an **API Key** (stored encrypted — never shown after saving).
4. Optionally set a **Model** (e.g., `gemini-2.5-flash`, `gpt-4o-mini`). Leaving this blank uses the provider's default.
5. For Ollama or Custom providers, enter a **Base URL**.
6. Toggle **Global AI** on to enable all AI features (comment generation + test generation).
7. Optionally toggle **Comment Generation** separately — you can keep test generation on while disabling comment generation in the Code Console.

#### System prompt

The **AI System Prompt** field lets you customize the instructions sent to the AI when a grader clicks **Generate** on a comment in the Code Console. Leave it blank to use the course default prompt.

The default prompt instructs the AI to:

- Be specific about what the issue is
- Explain why it matters
- Suggest how to fix it when appropriate
- Be encouraging but honest
- Keep comments concise (1–3 sentences)

#### Template variables

Your custom prompt can include placeholders that are filled in at generation time:

| Variable             | Mode       | Description                                                                |
| -------------------- | ---------- | -------------------------------------------------------------------------- |
| `{assignment_name}`  | auto       | Name of the assignment.                                                    |
| `{file_name}`        | auto       | Name of the file being reviewed.                                           |
| `{file_content}`     | auto       | Full content of the current file.                                          |
| `{selected_content}` | auto       | The specific code block the grader selected.                               |
| `{rubric_context}`   | auto       | Details of the selected rubric item (name, category, points, explanation). |
| `{grader_draft}`     | auto       | Any text the grader has already typed in the comment box.                  |
| `{all_files}`        | **manual** | Content of all files in the submission (each truncated to 10K characters). |

**Auto** variables are automatically added to the user prompt if you don't include them in your system prompt — so you'll always get relevant context even with a minimal prompt. **Manual** variables must be explicitly included in your system prompt to be available to the AI.

#### Example custom prompt

```
You are a teaching assistant for {assignment_name}. Review the student code
and provide feedback based on our rubric.

Focus on:
- Correctness relative to the assignment specification
- Code readability and variable naming
- Edge case handling

Full file for context:
{file_content}

All submission files:
{all_files}
```

#### How graders use AI comments

Once configured, graders see a **Generate** button (robot icon) on every comment text area in the Code Console. The workflow is:

1. Select code lines and start a comment (optionally linking a rubric item).
2. Optionally type a draft — the AI will refine it.
3. Click **Generate** (or press `Ctrl+G`) — the AI fills in the comment text.
4. Review and edit the generated text before saving.

The AI uses the selected code, linked rubric item, grader draft, and your system prompt to produce the comment. Graders always have the final say — generated text is a draft, not auto-posted.

#### AI test generation

AI can also generate autograder test scripts. From an assignment's **Tests** configuration, click **Generate Tests** to create test code automatically. The generator:

- Takes a target filename to test and an optional context file for reference.
- Supports Python, Java, C/C++, JavaScript, PHP, R, and Ruby.
- Produces test harness code matching each language's conventions.
- Optionally uses rubric text as context for test coverage.

Generated test scripts are always returned as drafts for you to review and refine.

> [!TIP]
> Start with the default prompt and only customize it after you've seen a few generated comments. Small, focused instructions (e.g., "focus on edge cases" or "reference our style guide") tend to work better than long, detailed prompts.

> [!TIP]
> You can leave most settings at their defaults when creating an assignment and adjust them later. The only required fields are **name** and **points**.

---

## Assignment files

Assignment files are the starter code, helper libraries, and test resources you provide to students and the autograder. Manage them from **Settings > General > Assignment Files**.

### Adding files

- Click **Add File**, enter a name (including extension, e.g., `main.py`), and optionally paste or upload code content.
- For Jupyter notebooks (`.ipynb`), an embedded notebook editor opens automatically.

### File options

| Option       | Description                                                                  |
| ------------ | ---------------------------------------------------------------------------- |
| **Required** | If student upload is enabled, students _must_ include a file with this name. |

> [!IMPORTANT]
> Ensure all files have an extension (e.g., `.py`, `.java`) so the system can determine the language and apply appropriate parsing, testing, and execution behavior. Any file without an extension is treated as a generic text file.

---

## Rubric setup

Navigate to **Assignments > Rubrics** or open a specific assignment's rubric tab.

### Structure

- **Rubric categories** are top-level groups (e.g., "Correctness", "Style", "Efficiency"). Each has a point value.
- **Rubric comments** live inside categories. Each comment has a name, point deduction (or addition in additive mode), and an optional explanation.

### Building the rubric

1. Click **Add Category** — give it a name and point allocation.
2. Inside each category, click **Add Comment** — set a name, point value, and description.
3. Repeat until your rubric is complete.

### Import / Export

- **Import**: Upload a rubric file (CSV or JSON) to bulk-create categories and comments.
- **Export**: Download the current rubric as a file for reuse or backup.
- **Merge duplicates**: Use the merge tool to combine rubric comments that overlap.

> [!TIP]
> Build the rubric _before_ grading starts and share it with graders during your pre-grading alignment meeting. Changing rubric point values after grading has begun requires recalculating affected grades.

---

## Submission management

### Student self-upload

When **Allow student upload** is enabled, students submit through the Student Console:

1. Navigate to the assignment.
2. Upload or drag-and-drop files.
3. Optionally add partners (if enabled).
4. Submit.

**Constraints**:

- Individual file size limit: 10 MB.
- Required assignment files must be included.
- Submissions after the due date follow the late policy (deductions, max late days).
- Students can replace their submission by re-uploading before the deadline or before grading starts.

### Instructor bulk upload

From **Assignments > Upload**:

- **Single upload**: Upload one submission for a specific student.
- **Bulk upload**: Drag a zip file organized by student email folders (e.g., `student@email.com/file.py`). Partner submissions use folder names with `+`-separated emails.
- **Import**: Import submissions from external sources.

For full details, see [Uploading Submissions](/docs/submission-upload).

### Monitoring submissions

The assignments table shows live counts: **total**, **finalized**, **in-progress**, **unclaimed**, and **missing** submissions. Click into an assignment to see the full submission list with filters for student email, grader, and status.

---

## Grader alignment

Before grading starts, confirm:

- **Rubric readiness** — all categories and comments are in place.
- **Grader staffing** — graders are added to the course and assigned to [sections](/docs/instructor-sections) if applicable.
- **Drawing submissions** — graders use **Draw** to claim unclaimed submissions from the queue. You can filter by section.
- **Finalize/publish plan** — clarify when grading should be done and when you plan to release grades.
- **Escalation path** — how graders flag edge cases, policy questions, or regrade-worthy situations.

> [!TIP]
> Align grader sections before grading starts so graders draw only from their assigned pool. This prevents duplicated effort.

---

## Bulk operations

### Bulk finalize / unfinalize

From an assignment's **Bulk Edit** action, you can finalize or unfinalize all submissions at once. When finalizing submissions that have no assigned grader, the system assigns you as the grader automatically.

### Download grades

From **Assignments > Download Grades**, export a CSV with student emails and grades. Available per-assignment or for all assignments at once. Option to treat missing submissions as zero.

---

## Regrade requests

If **Allow regrade requests** is enabled in settings:

1. After grades are published, students can submit regrade requests through the Student Console.
2. You can add custom **regrade instructions** (Markdown) explaining your policy.
3. Set a **regrade deadline** to stop accepting new requests after a certain date.
4. Manage requests from **Assignments > {name} > Regrades**, which shows a filterable table of all requests and their statuses.

---

## Pre-release QA checklist

Before publishing grades:

- [ ] Spot-check test output on representative submissions.
- [ ] Verify rubric totals match the assignment point value.
- [ ] Confirm finalization threshold (percentage of submissions finalized).
- [ ] Resolve any missing or ungraded submissions.
- [ ] Review assignment statistics (mean, median, min, max) for anomalies.
- [ ] Check that the explanation / student-facing instructions are accurate.

---

## Related docs

- [Course Setup & Roster](/docs/instructor-course-setup)
- [Managing Sections](/docs/instructor-sections)
- [Environment & Testing Ops](/docs/instructor-environment-testing)
- [Grading, Release & Exports](/docs/instructor-grading-publishing)
- [Uploading Submissions](/docs/submission-upload)
