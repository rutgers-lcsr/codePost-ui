---
key: instructor-sections
path: instructor-sections
title: Managing Sections
category: Instructor Workflows
order: 8
---

# Managing Sections

Sections let you divide the course roster into named groups (e.g., recitation sections, lab slots, lecture tracks). You can assign graders as section **leaders** and use sections to scope grading work or filter the submission view.

## Where to find it

Go to **Roster > Sections** in your course admin panel.

## Creating a section

1. Click **Add Section**.
2. Enter a unique section name (e.g., `Section A`, `Lab 01`, `R04`).
3. Click **OK** — the section appears in the table immediately.

Section names must be unique within the course.

## Adding students to a section

Click the student count in a section row to open the section drawer. There are two ways to add students:

### Select from course roster

Switch to the **Select** tab, choose one or more students from the dropdown, then click **Add Selected**. Only students already enrolled in the course appear in the list.

### Paste a list of emails

Switch to the **Paste** tab, paste a newline- or comma-separated list of email addresses, and click **Add Pasted**. Emails that do not match enrolled students are silently skipped.

> [!NOTE]
> Students can only belong to one section at a time. If a student is already in another section, enable **Allow section reassignment** in the drawer before adding them. Without this toggle, students who already belong to a section are skipped.

## Bulk CSV import

To populate many sections at once, click **Import CSV** above the sections table.

**Expected file format** (CSV or TSV, with or without a header row):

```
section,student
Section A,student1@university.edu
Section A,student2@university.edu
Section B,student3@university.edu
```

- Column order: section name first, student email second.
- Headers are auto-detected and optional.
- Sections that do not yet exist are created automatically.
- Students are assigned in batches; a live progress bar tracks the operation.
- Click **Cancel Import** mid-run to abort without losing work already done.

## Assigning leaders

Section leaders are graders responsible for a section. To edit leaders for a row, click the pencil icon in the **Leaders** column, select one or more graders from the dropdown, then click the icon again to save.

Leaders do not receive extra permissions through the section assignment alone — they must still be added to the course as a grader via the **Graders** tab.

## Removing a student from a section

Open the section drawer and click the **×** icon next to a student's email. The student remains enrolled in the course — only their section membership is cleared.

## Deleting a section

Click the trash icon in the **Actions** column and confirm. Deleting a section does not remove the students from the course, but it clears their section assignment.

## Tips

- Set up sections before grading starts so you can use section filters in grading views.
- For large courses, CSV import is far faster than adding students one by one.
- Name sections consistently across terms (e.g., `R01`, `R02`) to simplify bulk uploads and reporting.
- If your enrollment manager exports a roster CSV with a section column, you can usually adapt it to the two-column format above with minimal editing.

## Related docs

- [Course Setup & Roster](/docs/instructor-course-setup)
- [Grader Guide](/docs/grader)
- [Uploading Submissions](/docs/submission-upload)
