---
key: instructor-course-setup
path: instructor-course-setup
title: Course Setup & Roster
category: Instructor Workflows
order: 7
---

# Course Setup & Roster

Use this page when launching a new course or preparing for a new term.

## Course setup checklist

1. Create the course with clear name and period.
2. Set timezone and general course defaults.
3. Configure invite code behavior.
4. Decide whether students can see grader identities.
5. Configure grader/rubric editor permissions.

## Managing roster

Go to **Roster** and choose the role tab:

- **Students**: add/invite students and manage sections.
- **Graders**: add TAs and assign permissions.
- **Admins**: add instructor-level users.

### Enrollment methods

- Direct invite by email
- Invite code self-join (if enabled)
- Bulk workflows where supported by your process

### Sections and staffing

- Group students by section for assignment and grading workflows.
- Align grader assignments to section ownership early.
- Reconcile drops/adds weekly during active enrollment windows.

## Policy defaults to lock in early

- Anonymous grading defaults
- Rubric editing permissions
- Late policy and deadlines strategy
- Student upload eligibility

> [!TIP]
> Write a short “grading playbook” for your graders and pin it in course communications. Consistency beats heroics.

## Archiving a course

At the end of a term, **archive** the course rather than deleting it. Archived courses are preserved read-only — students can still view their feedback and instructors can still export grades, but no further edits are accepted on the course or any of its assignments, rubrics, submissions, or comments.

### To archive

1. Open **Course Settings > General**.
2. Toggle **Archive Course** on.
3. Confirm. The course is immediately marked archived.

### What archiving does

- Disables editing on the course and all attached resources (rubrics, assignments, submissions, comments, environments).
- Keeps the course visible in dashboards under an **Archived** filter.
- Stops Auto-Run, autograder runs, and webhook deliveries triggered by changes (no edits = no events).
- Frees up the course name/period combo for the next term (you can clone assignments from an archived course into a new active one).

### Un-archiving

Toggle **Archive Course** off in Course Settings. The course returns to fully editable state. Un-archive only when you genuinely need to fix data — re-opening an old term's course for the original students is rarely the right move (clone into a new course instead).

> [!IMPORTANT]
> Once a course is archived, in-flight regrade requests cannot be responded to. Resolve open regrade requests **before** archiving.

## Related docs

- [Managing Sections](/docs/instructor-sections)
- [Assignment Workflow](/docs/instructor-assignment-workflow)
- [Grader Guide](/docs/grader)
- [Organization Admin Guide](/docs/organization)
