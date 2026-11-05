---
key: changelog
path: changelog
title: Changelog
category: Changelog
order: 20
---

# Changelog

Stay up to date with new features, improvements, and fixes in codePost.

> **Versions**: 0.1.0 → 3.0.0 → 3.1.0 → 3.1.1 → 3.2.0 → 3.3.0 → 3.4.0 → 4.0.0 → 4.1.0 → 4.2.0 → 4.3.0 (current)

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

## Unreleased — Admin & Staff console refinements

### Changed: one Stage badge per assignment, and settings that save themselves

- The assignments table's **Status** and **Feedback** badges and the `#` grades button are now one **Stage**
  badge. The line under it says what else applies ("Feedback released · grades hidden", "Past due date").
  Its picker opens with one sentence about what students can see and do right now, then shows **Work** beside
  **Feedback**, with **Hide numeric grades** as a checkbox under the feedback modes.
- **Course Settings** has no Save button: switches save when flipped, text fields when you leave them, the
  timezone when you pick one. Each save shows a tick beside the control and a toast with **Undo**.
  **Archive course** asks first. The AI card's switches save the same way; the provider connection (provider,
  key, URL, model, rates) keeps a **Save connection** button so it is never half-saved.
- Renaming a course no longer reloads the page; the settings page follows the course to its new address.

### Improved: Admin console navigation and the assignments overview

- The sidebar opens expanded, with labels, on a first visit. Collapsing it is still remembered per browser.
- The filter bar keeps **Search** and **Status** inline; the other filters sit behind **More filters**, which
  shows how many are active.
- A banner above the table counts unclaimed submissions that still need a grader.
- Quizzes, Course Files, Gradebook and Course Settings now use the same page frame (breadcrumb, title,
  actions on the right) as the other sections.
- Icon-only buttons in the rosters, submission tables and the header have accessible names.
- The course landing page says, per active course, whether submissions are waiting for a grader. Its counts
  sit in one line under the greeting instead of a row of tiles.
- The unclaimed-submissions banner links straight to **Submissions by Grader**.
- The sidebar is a little wider, so **Environment & Tests** no longer truncates.
- A **Skip to content** link leads keyboard users past the sidebar. The rubric, environment and delete row
  actions and **Download grades** are single tab stops (they used to be a link wrapping a button).
- One navigation system: **Course Settings** is a single sidebar entry and **Webhooks** is a section in its rail
  (old `/settings/webhooks` links still land there). Docs, API Reference, Changelog and Scholarship sit under
  one **Help** entry. Pages no longer repeat their own title in a breadcrumb.
- Calmer assignment rows: the delete icon stays grey until you point at it, and progress reads
  "2 submitted", "222 missing" and "0% graded" instead of "2 / 222 0%". The progress bar grows with the
  screen while the action icons keep their place beside it.
- Page titles are real level-one headings, **Skip to content** lands on them, and the sidebar and header
  are labelled landmarks.
- The Status and Feedback chips open with a small caret, and "Past due date" or "Grades hidden" is
  written under the chip instead of hidden in a glyph. The delete icon turns red when pointed at, and the
  grading progress track is visible against the row.
- The course landing page is a main region with a level-one heading, the sidebar is a navigation landmark
  and the current page's link is marked as current. Selected dropdown options use a darker green.
- In Course Settings the API keys and webhooks tables scroll inside their card instead of being cut off, with
  the key actions pinned in view, and a section opened from the rail or a link lands below the sticky title bar.
- Quiz delete buttons are quiet until pointed at, like the assignment ones. The status and feedback choosers
  open beside the chip, never taller than half the window. Gradebook column headers stay on one line and show
  the full assignment name on hover, the header stays put while rows scroll, and "Pending" and "—" are
  explained once under the table.
- The sidebar says **All assignments** and **All quizzes** instead of two identical "Overview" entries.
- The API keys section explains itself in labelled rows (Scope, Use it, Claude Code, Levels, Privacy) instead of
  three paragraphs. The quiz list has a title search once it holds more than five quizzes. The Course Settings
  title sits on the same line as the other sections' titles.
- **Phone console**: assignments carry the same six statuses as the desktop table, and a status picker
  replaces the old Published / Visible switches, which the server had stopped accepting. The accent is
  codePost green, matching the desktop.

### Improved: Staff console

- Every view has its own address (for example `/dashboard/courses`), so refresh, the Back button and shared
  links keep your place. The sidebar collapses on narrow screens.
- **System Health** shows an error with a Retry button when the check fails, and the Overview names the
  failing checks.
- **Users** loads one page at a time from the server, with server-side search, so every account can be found.
  Sidebar counts now come from platform statistics.
- **Courses** lists each course's admins with a **Log in as** action. Logging in as someone always asks first.
- Pending admin requests show on the sidebar badge and at the top of the Overview, and **Approve** asks for
  confirmation.
- Platform superusers now see every course in **Courses**, not only the ones they belong to.
- **Prompt Lab** and **AI Usage** use the standard page header, and every view shares the same page padding.
  Collapsing the sidebar is remembered per browser.
- Role counts on **Overview** and **Users** are one neutral colour, and **Platform Admins**, **Course
  Admins** and **Inactive** explain themselves on hover.
- On narrow screens **Users** and **Courses** hide their secondary columns so names and actions stay in view,
  and the Users and Pending Admins action columns stay pinned. **Log in as** is a text link in every table.
- A **Skip to content** link, a browser-tab title per view, and definitions that open on keyboard focus.
- The banner editor rejects a custom colour the browser cannot use, and the Info and Warning presets are dark
  enough for their white text.
- **Overview** leads with what needs attention: system health, admin requests, the banner and the next
  deadline-free deploy window, then one quiet strip of totals.
- The collapsed sidebar draws rules instead of truncated group names, and keeps the pending-request count on
  its icon.
- The Overview health card keeps its size while the first check runs, takes the warning or error tone when
  something is wrong, and names the cause without a click.
- **Pending Admin Requests** can be approved or denied in bulk: select rows, confirm once.
- On a phone the **Deploy Calendar** lists the month's deadlines by day instead of squeezing seven columns,
  and **Courses** hides Status and Students so the course and its admins stay in view.
- The Overview's loading placeholder has the same four cells as the loaded status row, the collapsed sidebar
  keeps a readable pending count, warning tags are dark enough to read, the banner editor says "Unsaved
  changes" beside the live state, and the pending-requests bulk bar no longer shifts the table.
- The banner confirmation names how many people will see it. "Off" is neutral grey, "Unsaved changes" is
  amber, and a **Discard changes** button restores the saved banner. System Health shows one placeholder on
  first load instead of a column of "Loading…".
- **Log in as** keeps your staff session for the tab: a bar at the bottom of every page says who you are
  acting as and returns you, in one click, to the exact page and search you left. Courses shows one **Log in as** control per
  course, with a menu when a course has several admins.
- **Ctrl+K** (⌘K) opens a jump box that finds pages, courses and users from anywhere in the staff console;
  the sidebar has a **Jump to…** button for the same thing.
- The Developer pages (API, AI Usage, Prompt Lab) fold under one sidebar group, and the Overview's status row
  is the page's headline: its labels are larger and the totals beneath are smaller. The sidebar's brand and
  footer stay put while its list scrolls, so an opened group is never hidden on a short window.
- Jump results are grouped under Pages, Courses and Users, and a user result offers **Log in as** directly
  (Ctrl+Enter, or its own button). Green tags, the pending badge and the yellow count badges in Courses use
  colours that pass contrast.
- **Approve** and **Deny** can be undone for eight seconds: the row leaves the list at once and the decision is
  sent when the Undo window closes (or immediately if you leave the page).
- A known health problem can be **acknowledged** on System Health: the Overview card goes quiet for that exact
  failure, in that browser, until something else fails or you clear it.
- The Overview totals are four tiles, each with one qualifying line, instead of six tiles and a loose row of
  counts.
- Pending Admin Requests shows when each request was made, its confirmations stay on screen, and single-row
  Approve/Deny step back while rows are selected. System Health colours slow checks by threshold, and the
  banner editor states who the banner reaches, and when, right above Save.
- **Fixed: Log in as could switch straight back.** The account check that runs on every page load could finish
  after the switch and restore the staff identity, so the bar named the wrong person. It now ignores a stale
  answer, and the switch is requested once instead of several times.
- System Health says what its colours mean ("2106 ms · very slow", with the threshold on hover) and shows
  **No workers** in red rather than blue. The banner's Discard sits beside a full-width Save, and the page says
  "Off: no one sees this banner" when the banner is off. The jump box names each course's organisation, and its
  keyboard hint is readable. The Overview tile, sidebar entry and page all say **Pending Admins**.
- On laptop-height windows the staff sidebar's rows are tighter so every group fits, and when it still has to
  scroll a shadow and a thin scrollbar say so.
- Course API Keys lists the keys first and folds the explanation under **How course API keys work**; the key's
  name stays pinned while the table scrolls. The quiz search spans the list, names how many quizzes it
  searches, and "No quizzes match" offers **Clear search**. A quiz's icon stays with its title when it wraps.
- The keyboard focus ring is codePost green everywhere (it was a pale tint that failed contrast on white), and
  the delete icons' hover red is dark enough to read.
- The impersonation bar says what the account can do ("student in CS 101 · Spring 2026", or "student in 2
  courses, grader in 1"), so a staff member knows which views to expect. The Users table uses the same row
  height as Courses, so its pager fits on a laptop screen.
- **Delete assignment** explains why its button is still grey ("Delete stays off until the name matches"),
  warns when the typed name is close but not exact, turns green when it matches, and Enter then deletes. The
  name to type is written in the dialog and the field is focused when it opens.
- **Destructive confirms are AA red.** The confirm button in Delete assignment, and every other red
  confirmation button, now uses a darker red that keeps white text readable (it was 3.5:1). Settings
  descriptions and subtitles, the quiz Attached and Draft tags and the gradebook Pending tag are darker for
  the same reason.
- The quiz delete icon shows "Delete quiz" on hover like the assignments one, and the API key revoke icon is
  quiet until pointed at and named for screen readers. The grades (#) button says "feedback is hidden, so
  grades are not shown" when that is why it is off. The status and feedback choosers keep their title in view
  and shade their bottom edge while there is more to scroll. A sidebar group opened near the bottom (Roster,
  Help) scrolls into view above the collapse control. The course list's account-settings link has a name.
- **Staff console**: the impersonation bar says "Actions here are real and saved as this user", carries an
  amber band and pads the page so it covers nothing. Pending Admins says why row buttons pause while rows
  are selected. The banner's severity choice fills only the chosen one and its date pickers sit beside their
  labels; the reach line above Save is bold. System Health shows the latency thresholds in words, no longer
  repeats the page title and says "1 event". The jump box's hint says what Enter does for a person, the row's
  Log in as shows its shortcut, and closing the box returns focus to where you were. Activity times carry
  the year. The hidden column-measuring row no longer traps keyboard focus on a phantom "Select all".
- **Delete assignment counts what goes with it** ("deletes its 107 submissions (12 graded), with every grade
  and comment on them", or "nothing else: it has no submissions yet").
- The course landing page lists courses with unclaimed submissions first.
- **Staff console**: acknowledging a System Health problem is now shared by all staff (it says who and when),
  not kept per browser. Leaving the banner editor with unsaved edits asks first, from the sidebar, the jump box
  or a reload.

---

## v4.3.0 — Instructor Agents, Quiz Workflow & Section Staffing

> **Highlight**: Your graders can grade quizzes out of the box, quizzes are created through
> a setup wizard instead of a bare modal, and a quiz grade is saved when you move on —
> whether or not you remembered to press the button. See the updated
> [Quizzes](/docs/instructor-quizzes), [Managing Sections](/docs/instructor-sections), and
> [Grader Guide](/docs/grader) pages.

### Changed: graders can grade quizzes by default

Quiz grading used to require a separate **Quiz Grader** role, so every instructor had to
maintain a second roster before a TA could touch the queue. Now **every grader on your
course can grade quizzes**, alongside course admins.

If you relied on the old behaviour, turn off **Graders Can Grade Quizzes** in
Course Settings → Behavior. The per-grader Quiz Grader column reappears on the Graders
roster, and any roles you already granted take effect again.

### New: quiz setup wizard

**New Quiz** used to open a two-field modal, which meant every quiz started with default
availability, attempts, results, and security settings you then had to hunt down in the
builder. It now opens a stepped wizard — Basics, Availability, Attempts, Results, Security,
AI questions, Review — so the quiz is configured by the time it exists.

Only the title is required. **Skip & create** ends the wizard at any step with the
remaining defaults, and the Review step offers create-as-draft or create & publish.

### Improved: grading a quiz

Grading moved into a full-screen workspace that shows one response at a time, with the
question, the student's answer, and the answer key together.

- **Your draft is saved when you navigate.** Pressing Next, jumping to another question,
  or closing the grader saves the grade you typed. If the save fails, you stay on the
  response rather than losing it. (Feedback with no points still can't be recorded — enter
  points to save the grade.)
- **Section filter** — narrow the queue to your own students; the choice is remembered per
  course.
- **Grade below / Grade beside** — put the points and feedback panel wherever you prefer;
  the choice and its size are remembered.
- `⌘/Ctrl + Enter` saves and advances.

### New: quiz grading progress

**Quizzes → Grading Progress** shows where a grading push stands across the whole course:
how many responses are still waiting, each grader's share of the work and when they last
graded, and a per-quiz progress bar. Graders who have left the course keep their rows, so
it stays an accurate record of who graded what.

### New: missing question sets are flagged

A student with no AI-generated question set can't open the quiz at all — previously that
was only visible from the Review tab. A red **N missing** tag now appears in the quiz list,
with a banner and a red Review badge on the builder tabs. Unpublished quizzes also show the
same grey **Draft** chip the assignments table uses.

### Improved: assigning graders to sections

Section leaders used to be edited one section at a time. **Roster → Sections → Assign
graders** now opens a graders × sections grid: tick the boxes, see which sections have no
leader, use **Distribute evenly** to fill the gaps, and save everything at once. If one
section fails to save, the rest still go through.

The sections **CSV import** also accepts an optional third `role` column — mark a row
`leader` to assign a grader as a section leader. Existing two-column files import exactly
as before.

### New: scopes for course API keys

When you create a course API key (Course Settings → API Keys) you now choose what it can
do: **Read only** (recommended), **Read & write**, or **Full admin**. The key table shows
each key's scope at a glance.

The scope controls what an AI assistant connected with that key is allowed to do — a
read-only key never even sees the tools that would change anything. Instructors can connect
a course to Claude Code or Claude Desktop and ask about their course in plain language.

### Fixed

- **Quizzes** — starter code sitting in a code question no longer counts as a submitted
  answer, so the progress bar reflects what the student actually typed. Leftover starter
  code also no longer appears inside essay or short-answer questions.
- **Sections** — editing a section's name or leaders no longer removes its students from
  their other sections.
- **Gradebook** — the rows-per-page setting now sticks instead of snapping back to 50.
- **Code console** — the bottom bar stays reachable when codePost is embedded in another
  page (such as an LMS).

---

## v4.2.0 — Assignment & Feedback Lifecycle, Exam Lockdown

> **Highlight**: Assignment publishing and feedback release are now two clear, independent
> badges — each with more states, scheduling, and safer defaults — and quizzes can require
> Safe Exam Browser. See the updated
> [Assignment Workflow](/docs/instructor-assignment-workflow) and
> [Grading, Release & Exports](/docs/instructor-grading-publishing) guides.

### New: Assignment Status badge (six states)

Each assignment now moves through an explicit lifecycle:
**Draft → Visible → Preview → Published → Closed → Archived**.

- **Draft** — invisible to students. New assignments (and clones) start here, so nothing
  is accidentally live while you set it up.
- **Visible** — students see the name, due date, and description: an announcement.
- **Preview** — students can also read the hand-out files, but can't submit yet.
- **Published** — open for work.
- **Closed** — happens **by itself** when the due date (plus any late window) passes; the
  badge shows a small clock. Extend the due date to reopen, or close early by hand.
- **Archived** — retired mid-course.

Set **Publish at** in the assignment settings to open an assignment automatically on
schedule — no more 11:59pm publishing from your couch.

### New: Feedback badge (four modes)

Releasing grades is now its own control next to Status, so _when students can work_ and
_when they see grading_ never get tangled:

- **Hidden** (default) — grade at your own pace, nothing shows.
- **Live** — feedback appears as it's written; good for office hours and exercises.
- **Per student** — each student sees their feedback as soon as _their own_ submission is
  finalized — a rolling release with no global switch.
- **Released** — everything is out at once.

**Hide grades** still masks numeric scores in any revealing mode, and **Release at**
schedules an automatic global release ("grades out Friday 5pm").

### New: Safe Exam Browser for quizzes

Require a quiz to be taken in [Safe Exam Browser](https://safeexambrowser.org) — a free
locked-down browser for Windows, macOS, and iPad. Students get a one-click **Launch in
Safe Exam Browser** button (no config files to distribute), the server rejects any quiz
request made outside SEB, and blocked attempts appear in the Activity Log. Per-student
exemptions (for platforms SEB doesn't support, like Linux or ChromeOS) live on the course
roster, and staff can see which attempts were verified.

### New: Assignment descriptions shown to students

The assignment description is now displayed where students actually look: the assignment
row on their dashboard expands to show it (from Visible onward), and it appears above the
files on the submission view.

### Improved: Datasets

Test-resource datasets are no longer copied into normal execution runs — they stage only
when a run actually uses them — and the assignment form makes dataset visibility and
selection clearer.

### Security & fixes

- Closed several gaps where students could interact with assignments they shouldn't see:
  hidden assignments no longer accept uploads (a state cloned assignments used to land
  in), per-section hiding is enforced on the server, and partner links can only be
  accepted by students who could submit themselves.
- After feedback release, student API responses no longer include staff-only settings
  (AI prompts, anonymous-grading configuration, and similar internals).
- Several notification emails (upload receipts, feedback notices, regrade reminders)
  failed to render in production due to a template typo — fixed.
- The student console no longer suggests feedback is available while it's still hidden.

---

## v4.1.0 — AI Provider Testing & Quiz Generation Polish

> **Highlight**: Test your AI provider connection end to end from the settings page, and
> AI question generation became a tracked job with progress and clear failures.

### New: AI Provider Connection Test

Course and organization AI settings gained a **Test connection** button — send a real
prompt (optionally overriding the model) and see the provider's response, response time,
and the model that actually answered. Test requests are tracked separately in the AI
usage dashboard under a `provider_test` type.

### Improved: AI Question Generation

Suggestion and per-student generation now run as tracked jobs with live progress and
explicit failure states, plus on-demand **manual generation and preview** for
personalized sections. AI work also moved to a dedicated worker, so heavy generation
can't slow down autograding.

### Fixed

- Production image builds could fail intermittently due to a packaging race — resolved.
- Tightened course API key management permissions, and quiz taking is now browser-only.

---

## v4.0.0 — Quizzes

> **Highlight**: A full quiz system — question banks, flexible quiz building, timed attempts with
> auto-grading, per-student AI-generated questions, Canvas import, and late-access codes.
> See the new [Quizzes guide](/docs/instructor-quizzes) for the complete workflow.

### New: Question Banks & Quizzes

Build **question banks** of reusable questions — multiple choice, multiple answers, true/false,
short answer, numerical, essay, and code (with a full code editor and starter code). Assemble
quizzes from **fixed questions**, **random draws** from a bank, or **per-student AI-generated
sections**. Quizzes can stand alone or **attach to an assignment** and open/close relative to its
lifecycle (after submission, after feedback, etc.) — the quiz score always stays separate from the
assignment grade.

- **Timing & attempts** — time limits, per-student accommodation multipliers, attempt limits, and
  a scoring policy (highest / latest / average) when multiple attempts are allowed.
- **Delivery options** — shuffle questions, one-question-at-a-time with optional backtracking.
- **Results controls** — decide when results are released (at submit or after close), whether
  students can reopen submitted attempts, and whether they see their answers and the correct ones.
- **Grading** — auto-graded question types score instantly; essay and code responses queue for
  manual grading with feedback, "grade and next," reopen, and a sandboxed **Run code** button for
  executing a student's answer. A dedicated **Quiz Grader** role lets TAs grade quizzes.
- **Results & item analysis** — per-student official scores with CSV export, plus per-question
  statistics to spot confusing items.

### New: Per-Student AI-Generated Questions

Add an **AI-generated section** to a quiz and each student gets a fresh set of questions grounded
in **their own submission** — a post-submission "understanding check." Prompt templates, file and
dataset variables, and starter presets (retasking, manual evaluation, explain-your-code) are built
in. You review, edit, and **approve every set before the student sees it** (or opt into
auto-publish) — and students never see any signal that a question was AI-assisted. AI-suggested
questions for banks and cross-semester question refresh round out the AI tooling.

### New: Canvas Import

Export quizzes from Canvas (QTI / Common Cartridge) and import them into a question bank —
optionally recreating the quizzes themselves. Imports are deduplicated and safe to re-run.

### New: Late-Access Codes

Generate a per-quiz **access code** to share with students who missed the deadline — entering it
starts their attempt after close with the normal time limit. Codes can be rotated or removed at
any time, and late starts are flagged and recorded in the Activity Log.

### Improved: Course Activity Log

Quiz activity is now recorded end-to-end: attempt starts (including late starts), submissions and
auto-submissions, grading actions, access-code changes, and generated-set approvals.

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
