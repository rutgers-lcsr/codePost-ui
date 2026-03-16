# SDK Grading Workflow

A complete walkthrough of managing the grading lifecycle with the codePost Python SDK — from creating an assignment to exporting final grades.

## Prerequisites

Install the SDK and get your API key from **Settings** in the codePost dashboard.

```bash
pip install git+https://github.com/rutgers-lcsr/codepost-python.git
```

```bash
export CODEPOST_API_KEY="your-api-key-here"
```

```python
from codepost import CodePost

client = CodePost()  # reads CODEPOST_API_KEY from environment
```

---

## Step 1: Find Your Course

```python
# List all courses you have access to
courses = client.courses.list()
for course in courses:
    print(f"{course.name} ({course.period}) — ID: {course.id}")
```

Pick the course ID you want to work with:

```python
COURSE_ID = 123  # replace with your course ID
course = client.courses.retrieve(id=COURSE_ID)
```

---

## Step 2: Create an Assignment

```python
assignment = client.assignments.create(
    name="Homework 3",
    course=COURSE_ID,
    points=100,
    is_visible=True,
    allow_student_upload=False,  # we'll upload submissions ourselves
)
print(f"Created assignment: {assignment.name} (ID: {assignment.id})")
```

---

## Step 3: Build the Rubric

Create rubric categories and add rubric comments (predefined feedback items) to each category.

```python
from codepost import RubricCategory, RubricComment

# Create categories
style_cat = client.rubric.categories.create(
    RubricCategory(
        name="Code Style",
        assignment=assignment.id,
        max_point_delta=20,
    )
)

correctness_cat = client.rubric.categories.create(
    RubricCategory(
        name="Correctness",
        assignment=assignment.id,
        max_point_delta=80,
    )
)

# Add rubric comments to each category
client.rubric.comments.create(
    RubricComment(category=style_cat.id, text="Good variable naming", point_delta=5)
)
client.rubric.comments.create(
    RubricComment(category=style_cat.id, text="Missing docstrings", point_delta=-5)
)
client.rubric.comments.create(
    RubricComment(category=correctness_cat.id, text="Missing edge case", point_delta=-10)
)
client.rubric.comments.create(
    RubricComment(category=correctness_cat.id, text="Incorrect output format", point_delta=-15)
)
```

---

## Step 4: Upload Submissions

Create a submission for each student (or group) and upload their files.

```python
# Create a submission and upload files in one call
sub = client.submissions.create_with_files(
    assignment=assignment.id,
    students=["student1@example.com"],
    files=[
        {
            "name": "main.py",
            "data": open("submissions/student1/main.py").read(),
            "extension": ".py",
        }
    ],
)

print(f"Created submission {sub.id} for student1@example.com")
```

### Bulk Upload

Loop through a directory of student submissions:

```python
import os

students_dir = "submissions/"

for student_folder in os.listdir(students_dir):
    student_path = os.path.join(students_dir, student_folder)
    if not os.path.isdir(student_path):
        continue

    # Create the submission
    student_email = f"{student_folder}@example.com"
    file_payloads = []
    for filename in os.listdir(student_path):
        filepath = os.path.join(student_path, filename)
        if os.path.isfile(filepath):
            ext = os.path.splitext(filename)[1]
            with open(filepath, "r") as f:
                file_payloads.append(
                    {
                        "name": filename,
                        "data": f.read(),
                        "extension": ext,
                    }
                )

    sub = client.submissions.create_with_files(
        assignment=assignment.id,
        students=[student_email],
        files=file_payloads,
    )

    print(f"Uploaded submission for {student_email}")
```

---

## Step 5: Add Comments

Place inline comments on submission files — either manually targeted or from automated tools like linters.

```python
from codepost import Comment

# Get the submission's files
sub = client.submissions.retrieve(id=sub.id)
for file in sub.files:

    # Example: add a comment on line 15
    client.comments.create(
        Comment(
            file=file.id,
            text="Consider using a list comprehension here.",
            start_line=15,
            end_line=15,
            point_delta=-2,
        )
    )
```

### Apply a Rubric Comment

To link a comment to a predefined rubric item, pass the `rubric_comment` ID:

```python
client.comments.create(
    Comment(
        file=file_id,
        text="Missing edge case",
        start_line=25,
        end_line=30,
        rubric_comment=rubric_comment_id,  # ID from Step 3
    )
)
```

---

## Step 6: Finalize Submissions

Finalizing marks a submission as "grading complete" and locks it from further edits by graders.

```python
# Finalize a single submission
client.submissions.partial_update(
    id=sub.id,
    is_finalized=True,
    grader="ta@example.com",
)
```

### Finalize All Submissions for an Assignment

```python
subs = list(client.assignments.submissions.list_all(assignment_id=assignment.id))
to_finalize = [s.id for s in subs if not s.is_finalized]

if to_finalize:
    client.submissions.bulk_finalize(to_finalize, grader="ta@example.com")
    print(f"Finalized {len(to_finalize)} submissions")
```

---

## Step 7: Export Grades

Once submissions are finalized, export grades to a CSV file.

```python
import csv

rows = client.assignments.submissions.export_grades(assignment_id=assignment.id)

with open("grades.csv", "w", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(["Student", "Grade", "Grader", "Finalized"])

    for row in rows:
        writer.writerow([
            "+".join(row["students"]),
            row["grade"],
            row["grader"] or "Unassigned",
            row["is_finalized"],
        ])

print(f"Exported {len(rows)} submissions to grades.csv")
```

---

## Full Script

Here's the complete workflow in a single script:

```python
#!/usr/bin/env python3
"""Complete grading workflow using the codePost Python SDK."""

import csv

from codepost import CodePost
from codepost import Comment, RubricCategory, RubricComment

client = CodePost()  # reads CODEPOST_API_KEY from environment

COURSE_ID = 123  # your course

# 1. Create assignment
assignment = client.assignments.create(
    name="Homework 3", course=COURSE_ID, points=100
)

# 2. Build rubric
style = client.rubric.categories.create(
    RubricCategory(name="Style", assignment=assignment.id, max_point_delta=20)
)
client.rubric.comments.create(
    RubricComment(category=style.id, text="Missing docstrings", point_delta=-5)
)

# 3. Upload a submission
sub = client.submissions.create_with_files(
    assignment=assignment.id,
    students=["student@example.com"],
    files=[
        {
            "name": "main.py",
            "data": 'def hello():\n    print("hi")\n',
            "extension": ".py",
        }
    ],
)

# 4. Add a comment
file_id = client.submissions.retrieve(id=sub.id).files[0].id
client.comments.create(
    Comment(file=file_id, text="Add a docstring", start_line=1, end_line=1, point_delta=-5)
)

# 5. Finalize
client.submissions.bulk_finalize([sub.id], grader="ta@example.com")

# 6. Export grades
rows = client.assignments.submissions.export_grades(assignment_id=assignment.id)
with open("grades.csv", "w", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(["Student", "Grade", "Grader"])
    for row in rows:
        writer.writerow(["+".join(row["students"]), row["grade"], row["grader"] or ""])

print("Done!")
```
