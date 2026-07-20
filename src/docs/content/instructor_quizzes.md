---
key: instructor-quizzes
path: instructor-quizzes
title: Quizzes
category: Instructor Workflows
order: 12
---

# Quizzes

codePost includes a full quiz system for building, delivering, and grading quizzes alongside your
assignments. This page is the end-to-end instructor workflow. For how the other roles experience
quizzes, see the [Student Guide](/docs/student) and [Grader Guide](/docs/grader).

A quiz can live one of two ways:

- **Standalone** — it opens and closes on its own dates, independent of any assignment.
- **Attached to an assignment** — it opens and closes relative to the assignment's lifecycle (for
  example, "after the student submits" or "a week after feedback is released"), and shows up on the
  assignment card for students. Its score is always kept **separate** from the assignment grade.

## How quizzes fit together

The building blocks flow in one direction:

1. **Question banks** — a course-level, reusable pool of questions. Every question lives in exactly
   one bank.
2. **Questions** — the individual items (multiple choice, code, essay, etc.), authored in a bank.
3. **Quizzes** — a container that pulls questions together, sets the rules (timing, attempts,
   scoring), and is optionally attached to an assignment.

A quiz can receive questions three ways: **fixed questions** you pick from a bank, **random draws**
(a Canvas-style group that pulls *N* random questions from a bank per student), and **per-student
AI-generated sections** (a fresh set generated for each student from their own submission).

> [!IMPORTANT]
> **You are always the author.** Even when AI drafts a question, nothing becomes a real quiz
> question until you accept or publish it — and **students never see any signal that a question was
> AI-assisted.** Questions always read as instructor-authored.

## Open the Quizzes hub

In the admin navigation, open **Quizzes**. The hub has two tabs:

- **Question Banks** — author and organize your reusable questions.
- **Quizzes** — assemble, configure, publish, and grade quizzes.

## Author question banks and questions

1. On the **Question Banks** tab, create a bank (for example, "Midterm concepts" or "Week 3").
2. Add questions to the selected bank. Each question has a **type** (see the table below), a point
   value, and — for choice questions — a set of answer options with the correct one(s) marked.
3. Question text and descriptions support **Markdown and images**, so you can format prompts and
   embed diagrams.
4. **Code** questions use a full code editor, with optional starter code shown to the student.

Banks can be linked to assignments, which is what lets AI suggestions and per-student generation
draw on the right submissions.

### Question types

| Type | Graded | Notes |
| --- | --- | --- |
| Multiple Choice (one correct) | Automatic | Exactly one correct option. |
| Multiple Answers (several correct) | Automatic | All-or-nothing, or partial credit if enabled. |
| True / False | Automatic | |
| Short Answer | Automatic | Case-insensitive, trimmed match against accepted answers. |
| Numerical | Automatic | Parsed value within an optional ± tolerance. |
| Essay | Manual | Free-text response, graded by a person. |
| Code | Manual | Written in a code editor, graded by a person. |

## Import from Canvas

If you already have quizzes in Canvas (or another LMS), export them as **QTI / Common Cartridge**
(`.zip`, `.imscc`, or `.xml`) and use the **Import** button on the Question Banks tab.

- By default the importer brings in **questions only**, into a bank of your choice.
- Check **"also import quizzes"** to recreate the quizzes as well.
- Imports are **deduplicated and idempotent** — re-importing the same file won't create duplicates.

## Generate questions with AI

> [!NOTE]
> AI question generation requires the course's **AI question generation** feature (on by default).
> See the [AI Settings & Usage Guide](/docs/ai-guide).

### Suggest new questions for a bank

From a bank, use **Suggest questions** to have codePost draft candidate questions from an attached
assignment. Choose the question type and how many to generate, then **review each suggestion** and
**Accept** the ones you want. Accepting is the authoring step — the accepted question becomes a
normal question you can freely edit.

### Refresh a question across semesters

Each question has a **Suggest update** action. codePost drafts a refreshed version (optionally
guided by instructions you provide); when you **Accept**, it updates the question **in place** —
keeping its identity and bank/quiz memberships. This is handy for reusing a bank in a new term.

## Build a quiz

On the **Quizzes** tab, create a quiz, then work through the quiz builder's four tabs:
**Settings**, **Questions**, **Grading**, and **Review**.

### Settings

- **Attach to an assignment** (optional) and choose the **open trigger** — when an attached quiz
  becomes available: *during the assignment*, *after the assignment closes*, *after the student
  submits*, *after feedback is released*, or *after each student's feedback is released*.
- **Close event** — when the quiz closes: *never*, *at the assignment due date*, *after submission*,
  *when feedback is released*, or a *fixed date* — with an optional **offset** (e.g. "a week after
  feedback"). **End attempts at close** makes the close a hard deadline that auto-submits any
  in-progress attempt; otherwise the close only blocks *new* attempts.
- **Time limit** (leave blank for untimed).
- **Attempts allowed** (0 = unlimited).
- **Shuffle questions** — randomize order per attempt.
- **Sequential mode** — show **one question at a time**, and optionally **allow backtracking**.
- **Show correct answers** — *never*, *after submit*, or *after the quiz closes*.
- **Passing score** — an optional threshold, as a percentage or raw points.
- **Scoring policy** — when a student has multiple attempts, which one counts: *highest*, *latest*,
  or *average*.
- **Publish** — an unpublished quiz is a **draft** only you can see. Students only see published
  quizzes.

### Questions

Assemble the quiz content in one unified table:

- **Add fixed questions** from a bank (with per-question **points override** and drag-to-reorder).
- **Add a random draw** — pick *N* random questions from a bank, each worth the same points.
- **Add an AI-generated section** — a per-student set (see below).
- **Preview as a student** to see exactly what a student will experience, including simulated
  random draws and a "show correct answers" toggle.

## Per-student AI-generated questions

An AI section generates a **different set of questions for each student**, grounded in that
student's own work. A common use is a **post-submission "understanding check"**: after a student
submits, generate questions from *their* code to confirm they understand what they turned in.

- You write a **prompt** using template variables such as `{submission_files}` and
  `{submission_test_results}`. The generator sees **only** the material your variables reference.
- **Start from a template.** When you add a section, a **"Start from a template"** picker offers
  ready-made starter prompts you can then edit:
  - **Retasking** — quote the student's own code and ask them to rewrite it for different inputs or
    parameters (proves they understand it, not just that it runs).
  - **Manual evaluation** — give a small sample of data and ask them to hand-compute what their own
    code would return. A **Sample size** control sets how many rows to include.
  - **Understanding check** — a mix of retasking and manual-evaluation questions.
  - **Explain your code** — quote a block of their code and ask them to explain what it does and why.
- **Reference files in your prompt.** Variables like `{assignment_file:spec.pdf}` and
  `{course_file:rubric.pdf}` insert file contents into the prompt. **PDFs are converted to text and
  notebooks (`.ipynb`) to readable cells automatically** — you never have to paste raw content. If
  the assignment uses [per-student dataset variants](/docs/instructor-environment-testing),
  `{student_dataset}` inserts the specific data assigned to that student, so questions can reference
  their actual numbers.
- Questions generate automatically when a student submits. If you add a section **after** students
  have already submitted, use **Generate missing** to backfill them (the count of affected students
  is shown first, since generation costs AI tokens).
- On the **Review** tab, review each student's set: edit questions inline, **regenerate**, or
  **approve**. A student's quiz only opens for them once their set is approved — until then they see
  a neutral **"Your quiz is being prepared."**
- **Answer keys.** Each generated question carries a grader-only **answer key** (the correct
  answer/working code, plus worked steps for hand-computation questions). It's shown — and is
  editable — on the Review tab and again while grading. **Students never see it.**
- **Auto-publish generated sets** skips the manual review gate. **Graders can review generated**
  lets your quiz graders (not just admins) review these sets.

> [!IMPORTANT]
> Per-student AI generation requires the course's **AI-generated quiz questions** feature, which is
> **off by default** because it spends AI tokens on every submission. When it's off, the builder
> hides the "Add AI questions" option.

## Accommodations

To give a specific student extra time on **every** timed quiz in the course, set their **Quiz time**
multiplier in the roster (Roster → Manage Students). A multiplier of 1× means no accommodation.

## Grade quizzes

Auto-graded questions (multiple choice, true/false, short answer, numerical) are scored the moment a
student submits. **Essay** and **Code** questions need a human — grade them on the quiz builder's
**Grading** tab:

1. Open the **Grading** tab (its label shows a count of responses awaiting grading).
2. For each essay/code response, assign points and optionally leave **feedback**.
3. Use **Grade and next** to jump straight to the next response that needs grading.
4. **Reopen** undoes a saved grade and sends it back to the queue (feedback is kept as a draft).

> [!TIP]
> **Run a student's code.** On a **Code** response, use **Run code** to execute the student's answer
> in the course's sandbox and see its output (stdout, errors, and any plots) right in the grading
> view. The run uses the attached assignment's environment and stages the student's submission files
> and datasets — including their assigned dataset variant — so answers that reference "their" data
> work. This is grader-only and never shown to the student.

> [!NOTE]
> **Quiz graders.** By default an assignment grader **cannot** grade quizzes. Grant the **Quiz
> Grader** role in Roster → Graders to let a TA grade essay/code responses from their own grader
> console. Course admins can always grade quizzes. See the [Grader Guide](/docs/grader).

## Review results

- **Results** — a per-student table of official scores and pass/fail, exportable to **CSV**.
- **Item analysis** — per-question statistics (average score, how often each choice was picked, how
  many responses are still pending) to spot confusing questions.
- **Reset attempts** — deletes **all** attempts for the quiz. **Course admins only.**

## Related docs

- [Assignment Workflow](/docs/instructor-assignment-workflow)
- [Grading, Release & Exports](/docs/instructor-grading-publishing)
- [AI Settings & Usage](/docs/ai-guide)
- [Student Guide](/docs/student)
- [Grader Guide](/docs/grader)
