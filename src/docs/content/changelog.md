---
key: changelog
path: changelog
title: Changelog
category: Changelog
order: 20
---

# Changelog

Stay up to date with new features, improvements, and fixes in codePost.

> **Versions**: 0.1.0 → 3.0.0 → 3.1.0 → 3.1.1 → 3.2.0 → 3.3.0 → 3.4.0 (current)

---

## Coming Soon

- Quality-of-life improvements for assignment setup and configuration.
- UX refinements for grading and test authoring pages.
- Performance and reliability improvements.

### Instructor Improvements

- Allow instructors to view the course as a student to better understand the student experience and troubleshoot issues.
- Allow instructors to view the course as a grader to better understand the grading experience and troubleshoot issues

### Assignments

- Allow Assignments to be assigned to graders per problem instead of per submission.
- Allow PDF only assignments for non-code-based courses.

---

## v3.4.0 — Testing Framework Improvements & Persisted File Edits

> **Highlight**: Hidden test cases, learning objectives that aggregate across tests, new `hidden` / `objectives` parameters in the testing framework, and persisted edits to student submission files.

### New: Hidden Test Cases

Instructors can now mark any test case as **hidden**. Students see only whether the test passed or failed and how it affected their score — the test name, logs, and explanation are stripped before the response leaves the server. Graders and admins continue to see full output in the code review panel.

This is useful for:

- Anti-cheating tests that should not be reverse-engineered from output.
- Edge-case tests that you want to grade against but not reveal to students until after publishing.

### New: Learning Objectives

Each assignment can now define **learning objectives** that are linked to one or more test cases. Objectives let you communicate _what_ a student demonstrated (or missed) rather than just listing individual test results.

Each objective is configured with:

- A short identifier (`shortId`) that can be referenced from your test scripts.
- A display name and optional longer description.
- A **visibility mode** controlling when students see the objective:
  - `Always show`
  - `Show when tests pass`
  - `Show when tests fail`
  - `Admin only`
- An **aggregation mode** controlling how the objective's "met" status and score are computed from its linked tests:
  - `All linked tests must pass`
  - `At least one linked test must pass`
  - `Percentage of linked tests that pass`
  - `Weighted by test point values`

Objectives are returned alongside test results in the student feedback panel and gated by their visibility mode.

### New: `hidden` and `objectives` Parameters in the Testing Framework

Both parameters are recognized by the test parser for every supported language.

For languages with first-class test decorators/annotations, pass them directly:

```python
# Python / Notebook Python
@test(name="Handles empty input", points=2, hidden=True, objectives=["edge-cases"])
def test_empty(): ...
```

```java
// Java / JShell
@Test(name = "Handles empty input", points = 2, hidden = true, objectives = {"edge-cases"})
public void testEmpty() { ... }
```

For languages without decorators (R, C/C++, JS/TS/Node, Ruby, PHP), place an `@codepost` directive in the comment directly above the test:

```js
// @codepost hidden objectives=recursion,edge-cases
test("Handles deep recursion", 2, "...", function () { ... });
```

The parser supports `//`, `#`, `--`, and `/* */` comment styles. Any objective `shortId` referenced in a script that doesn't yet exist on the assignment is **auto-created** the first time the script is synced — you can then edit its display name, description, visibility, and aggregation in the Learning Objectives UI.

See the updated [Testing Guide](/docs/testing-guide) for the full syntax reference.

### New: Persisted Submission File Edits

Edits made by instructors and graders to a submission file in the code review panel are now **saved server-side** and survive page reloads. Previously, edits were lost when navigating away. The saved edit is associated with the user who last modified it and is delivered with the submission payload.

**Who can edit**:

- **Course admins / instructors** can always save edits.
- **Graders** can save edits only when the assignment's **Graders can edit submissions** setting is enabled.

The student's original uploaded file is never modified — the edit is stored alongside it.

### New: Mobile Improvements

Added new mobile pages for students graders and instructors with a simplified layout optimized for smaller screens. Students can view their grades directly from the mobile webpage, and instructors can view activity and change assignment settings on the go.

---

## v3.3.0 — AI Assistance, Dashboards & PDF Commenting

> **Highlight**: AI-powered suggested comments and summaries, redesigned dashboards for admins and graders, PDF annotation support, and a new student console.

### New: PDF Commenting

Instructors and graders can now **annotate PDF files** directly in the code review panel. Select text or regions in uploaded PDFs and leave inline comments just like with code files.

### New: AI Suggested Comments & Summaries

The AI assistant can now generate **suggested comments**, **descriptions**, and **assignment summaries**. Graders see AI suggestions while reviewing, and instructors can generate summaries of assignment-level trends. A new behavioral feedback system supports AB testing and iterative prompt development.

### New: Assignment Analytics Dashboards

New **analytics dashboards** are available for admins and graders with assignment-level usage and grading insights. Dashboards show grading progress, time-on-task, and submission trends.

### New: Student Console

The student-facing code console has been **redesigned** for a cleaner, faster experience. Console sessions are now prefetched so output loads instantly.

### New: Capabilities System

Introduced a **capabilities framework** for feature gating and progressive rollout. This allows features to be enabled for specific courses or organizations before a full launch.

### Bug Fixes

- Fixed how messages are rendered in test case results.
- Fixed image display for test cases and rendering of images inside Jupyter markdown cells.

---

## v3.2.0 — AI Settings & Usage Analytics

> **Highlight**: Organization-level AI configuration, per-course inheritance, and comprehensive usage tracking with cost estimates.

### New: Organization-Level AI Settings

Organization admins can now configure a shared AI provider and API key from the **Organization Dashboard > AI Settings** tab. A course access policy controls which courses can inherit the org's key — choose from **All courses**, **Selected courses**, or **Disabled**. This eliminates the need for every course admin to manage their own API key.

### New: Course AI Inheritance

Courses can now inherit AI settings from their organization instead of configuring their own. When org AI is available, the Course Settings page shows a banner and a toggle to switch between the org's shared key and a course-specific key.

### New: AI Usage Dashboard

AI usage is now tracked automatically for every AI call (comment generation and test generation). Usage dashboards are available at three levels:

- **Course level** — in Course Settings, below AI configuration.
- **Organization level** — in the Organization Dashboard's AI Usage tab.
- **Platform level** — in the codePost Admin dashboard for superusers.

Each dashboard shows total requests, token counts, estimated costs, time-series charts, and breakdowns by assignment, course, or organization. Date range and granularity (hourly, daily, monthly) are configurable.

### New: Portkey Provider Support

Added **Portkey** as a first-class AI provider option. Portkey is an AI gateway that routes requests to multiple LLM providers. Select it from the provider dropdown, set your gateway URL, and optionally provide an API key.

### New: Model Dropdown with Live Provider Query

The model selector is now a **searchable dropdown** that automatically populates with curated models for the selected provider. When credentials are configured, it also fetches available models directly from your provider's API.

### New: API Key Hint

After saving an API key, a **masked hint** (e.g., `sk-…abc1`) is displayed below the key field so admins can verify which key is active without exposing it.

### New: Custom Token Rate Overrides

Organization and course admins can now **override per-model token cost rates** used for usage estimates. Useful for self-hosted models, volume pricing, or unlisted models. Expand **Custom Token Rates** in AI settings to view and edit rates.

### New: Per-Model Usage Breakdown

Usage dashboards now include a **Usage by Model** table showing token counts, costs, and request counts grouped by AI model. The org-level dashboard also shows course period for disambiguating same-named courses.

See the [AI Settings & Usage Guide](/docs/ai-guide) for full details.

### UI Improvements

- Actions buttons on the Instructors Assignment table are now a row of buttons with icons and tooltips instead of a dropdown to improve discoverability and reduce clicks.

### Bug Fixes

- Regrading Table now has a new view and fixed issue with no regrades showing for graders.

## v3.1.1 — Quality of Life Improvements & Bug Fixes

- User-facing changelog page — you're reading it!
- Improved notebook editor loading for notebook-based assignments.
- Fixed an issue where API tokens could not be generated.
- Tests now check syntax of code before saving to prevent syntax errors in test cases.
- Tests now check if target file exists before executing test scripts that reference files.
- Add CSV imports for sections.
- Improved UI for code console.

### Change: Test and Execution Workflow Improvements

- Tests and caching output now is selectable from assignment settings. Instructors can choose to disable automatic test execution and/or file caching on student submission if they prefer a more manual workflow.

---

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
