# Grader Guide

This guide helps graders and TAs work efficiently in codePost while staying aligned with instructor policy.

## Before you start grading

1. Confirm you are in the correct course and assignment.
2. Review instructor grading policy (rubric rules, late policy, collaboration expectations).
3. Check whether grading is anonymous.
4. Confirm whether submission edits and test re-runs are allowed.

## Core grading workflow

1. Open **Submissions** and filter to your queue.
2. Open a submission in **Code Console**.
3. Review files and add inline comments.
4. Apply rubric items for consistent scoring.
5. Review test/output panels as needed.
6. Mark the submission **Finalized** when complete.

> [!IMPORTANT]
> Finalized submissions are ready for instructor release, but students still do not see feedback until the assignment is published.

## Using comments effectively

- Be specific: reference behavior, location, and fix direction.
- Use reusable rubric comments for repeated patterns.
- Prefer actionable feedback over one-word notes.
- Keep tone professional and supportive.

## Rubric and scoring tips

- Apply rubric criteria consistently across all submissions.
- Use partial credit where policy allows.
- If a rubric item is ambiguous, flag it early for instructor clarification.
- Avoid hidden policy changes mid-stream.

### Rubric not saving or loading

- Use `Cmd/Ctrl + Shift + R` to hard refresh the Code Console.
- Ensure your internet connection is stable; rubric updates are real-time.

### Code not loading (spinner)

- If a file is too large, it may take moments to render.
- If it persists, check the browser console for errors and report to **Contact Us**.

## Keyboard Shortcuts

Efficient graders use hotkeys. Press `Cmd/Ctrl + /` to see the full list in the console.

- **General**:
  - `Alt + Shift + R` : Report an issue to the codePost team

- **Navigation**:
  - `Alt + [` / `]` : Next/Previous File
  - `Cmd/Ctrl + Shift + f` : Toggle File Browser
- **Grading**:
  - `Enter` : Start comment on selected line
  - `Cmd/Ctrl + Enter` : Save comment and jump to next
  - `Cmd/Ctrl + Shift + g` : Toggle Rubric

Use outputs and tests to inform feedback, not replace manual reasoning:

- **Auto-Run output** shows what code produced at run time.
- **Script-based tests** summarize test pass/fail and scoring behavior.
- If results look stale, request or perform a re-run based on course policy.

For test syntax and parser behavior, see [Testing Guide](/docs/testing-guide).

## Common grader scenarios

### I see a broken environment or missing dependency

1. Capture the error message.
2. Check if the issue is submission-specific or assignment-wide.
3. Escalate assignment-wide issues to instructors/admins.
4. Continue grading unaffected submissions when possible.

### A student asks for regrade

- Follow instructor-defined regrade workflow.
- Leave an audit trail in comments.
- Avoid direct score edits without rationale.

### I cannot access a submission

- Verify you are assigned to the student/section.
- Ask an instructor/admin to confirm roster role and permissions.

## Related docs

- [Instructor Overview](/docs/instructor)
- [Grading, Release & Exports](/docs/instructor-grading-publishing)
- [Student Guide](/docs/student)
- [FAQ](/docs/faq)
