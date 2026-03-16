---
key: grader
path: grader
title: Grader Guide
category: Role Guides
order: 5
---

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

### Handling regrade requests

When a student submits a regrade request, it appears in two places:

- **Regrade Requests panel** (grader dashboard): Shows all assignments with open and closed requests. Click an assignment name to see the full list.
- **Submission Info** (Code Console sidebar): When viewing a submission with a regrade request, the request text, status, and action buttons appear directly in the sidebar.

#### From the Regrade Requests panel

1. Navigate to the **Regrade Requests** tab in the grader dashboard.
2. Click the assignment name to see all requests.
3. Use the **Claim** button to assign a request to yourself.
4. Click **Respond** to write your response, or **View** to open the submission in the Code Console.
5. After writing a response, choose **Save Draft** to keep working, or **Submit & Close** to finalize.
6. You can **Re-open** a closed request if needed.

#### From the Code Console

When viewing a submission that has a regrade request:

1. The **Submission Info** panel shows the request text and status.
2. Click **Claim** to assign it to yourself.
3. Click **Respond** to write your response inline.
4. Use **Submit & Close** to send your response and close the request.
5. Use **Release** if you want to unassign yourself.

> [!NOTE]
> Students can see your email as the responder once you submit a response. Keep your tone professional and constructive.

#### Tips

- Claim requests promptly so students know their request is being reviewed.
- Leave an audit trail — your response is visible to the student and the instructor.
- Avoid direct score edits without a written rationale in the response.
- If you are unsure about a regrade, escalate to the instructor rather than guessing.

### I cannot access a submission

- Verify you are assigned to the student/section.
- Ask an instructor/admin to confirm roster role and permissions.

## Related docs

- [Instructor Overview](/docs/instructor)
- [Grading, Release & Exports](/docs/instructor-grading-publishing)
- [Student Guide](/docs/student)
- [FAQ](/docs/faq)
