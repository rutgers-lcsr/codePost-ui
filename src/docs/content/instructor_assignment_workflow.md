# Assignment Workflow

This page covers the instructor lifecycle for assignments from draft to release.

## Recommended lifecycle

1. **Drafting**: Create the assignment shell and upload instructions/starter code.
2. **Configuration**: Set submission constraints, due dates, and grading settings.
3. **Verification**: Upload a solution and run tests to ensure the environment is correct.
4. **Release**: Open the assignment for student submissions.
5. **Monitoring**: Watch the submission queue and handle early questions.
6. **Publication**: After grading, release feedback and grades to students.

## Create and configure assignment

From **Assignments > Overview**:

### Key Settings

- **Submission Constraints**:
  - **File Types**: restrict uploads to specific extensions (e.g., `.py`, `.java`) to prevent students from uploading incorrect files.
  - **Partners**: enable if students can work in groups. This allows one student to submit for the group.
- **Deadlines**:
  - **Due Date**: the soft deadline. Submissions after this are marked late.
  - **Upload Cutoff**: if set, no submissions are accepted after this date (hard deadline).
  - **Late Penalties**: configure automatic point deductions per day.

## Submission management

- Watch submission counts and outliers.
- Use upload tooling for special cases.
- Confirm partner/group settings if enabled.

For upload strategies, see [Uploading Submissions](/docs/submission-upload).

## Grader alignment

Before grading starts:

- Confirm rubric readiness.
- Confirm grader staffing/coverage.
- Clarify finalize/publish expectations.
- Share escalation path for policy edge cases.

## Pre-release QA checks

- Spot-check test/output behavior on representative submissions.
- Verify rubric totals and comments templates.
- Ensure all intended submissions are finalized.

## Related docs

- [Course Setup & Roster](/docs/instructor-course-setup)
- [Environment & Testing Ops](/docs/instructor-environment-testing)
- [Grading, Release & Exports](/docs/instructor-grading-publishing)
