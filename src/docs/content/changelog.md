# Changelog

Stay up to date with new features, improvements, and fixes in codePost.

> **Versions**: 0.1.0 → 3.0.0 → 3.1.0 → 3.1.1 (current)

---

## v3.1.1 — Current Release

- User-facing changelog page — you're reading it!
- Improved notebook editor loading for notebook-based assignments.
- Fixed an issue where API tokens could not be generated.
- Tests now check syntax of code before saving to prevent syntax errors in test cases.
- Tests now check if target file exists before executing test scripts that reference files.

---

## Coming Soon

- Quality-of-life improvements for assignment setup and configuration.
- UX refinements for grading and test authoring pages.
- Performance and reliability improvements.

---

## v3.1.0 — Testing Framework

> **Highlight**: This release introduces the **new testing framework** — the biggest feature addition since the initial release.

Instructors can now author, preview, and execute test cases directly inside codePost.

### New: Testing Framework

| Feature                    | Description                                                                  |
| -------------------------- | ---------------------------------------------------------------------------- |
| **Test case authoring**    | Create, edit, and organize test cases per assignment from the admin panel.   |
| **Test script preview**    | Run and preview test scripts before publishing them to students.             |
| **Multi-language testing** | Language-specific test runners so you can test Python, Java, C, and more.    |
| **Test resources**         | Mount files and datasets as test resources. Hidden from students by default. |

### Other Additions

- Improved code parsing and syntax highlighting in the code review console.
- Added `.mjs` file format support.

### Bug Fixes

- Fixed test-save workflow that previously required pressing Ctrl+S before changes would persist.
- Fixed page sizing issues on some list and table views.

---

## v3.0.0 — Platform Modernization

> **Highlight**: AI-assisted grading, a built-in documentation system, comprehensive accessibility improvements, and a modernized UI.

### New: AI-Assisted Grading

- **AI comment generation** — graders can generate comments using AI. Instructors can configure system prompts per assignment.
- **Pinned comments** — graders can pin important comments for quick access.
- **Grader rubric editor** — instructors can grant graders permission to create and manage rubric entries directly.

### New: Documentation

- Built-in docs at `/docs` with searchable sidebar, markdown content, and auto-generated table of contents.
- Covers getting started, role guides, instructor workflows, and reference material.

### New: Organization & Admin

- Organization dashboard with SSO integration.
- Course cloning now copies AI settings automatically.
- Redesigned role selection page.

### New: Student Experience

- Students can now view full assignment files directly.
- Improved student console layout, navigation, and error handling.
- "Release Submission" renamed to "Release Feedback" for clarity.

### UI Improvements

- Faster page loads and a more responsive interface.
- Streamlined admin navigation (replaced command bar).
- Updated rubric UI and assignment management views.
- Updated brand color palette.

### Accessibility

- Improved color contrast for links and controls.
- Better keyboard navigation and screen reader support.
- Sidebar tooltips in admin navigation.

### Bug Fixes

- Fixed comments not deleting properly.
- Fixed download-grades returning empty CSV.
- Fixed sidebar overflow issues in student console.
- Fixed markdown formatting causing unexpected newlines in comments.

---

## v0.1.0 — Initial Release

The first self-hosted release of codePost.

### Included

- Course, assignment, submission, and rubric management.
- Code review console with inline commenting.
- Autograder support for automated test execution.
- Student, grader, and course-admin roles.
- Admin panel for system management.
