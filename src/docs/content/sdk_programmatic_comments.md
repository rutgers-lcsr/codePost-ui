---
key: programmatic-comments
path: programmatic-comments
title: Programmatic Comments
category: Python SDK
order: 16
---

# Programmatically Placing Comments

Automating feedback can save significant time. You can use the codePost Python SDK to programmatically place comments on student submissions. This is useful for:

- Integrating results from automated linters
- Posting coverage reports
- Adding standard feedback to specific file patterns

## Prerequisites

Ensure you have the Python SDK installed and configured.

```bash
pip install git+https://github.com/rutgers-lcsr/codepost-python.git
```

Get your API key from **Settings** in the codePost dashboard.

## Step 1: Initialize the Client

```python
from codepost import CodePost

# Pass your API key directly, or set the CODEPOST_API_KEY environment variable
client = CodePost(api_key="YOUR_API_KEY")
```

Or using an environment variable:

```bash
export CODEPOST_API_KEY="your-api-key-here"
```

```python
from codepost import CodePost

client = CodePost()  # reads from CODEPOST_API_KEY
```

## Step 2: Locate the File

You need the `id` of the submission file you want to comment on. You can find this by listing submissions for an assignment and inspecting their files.

```python
# List submissions for an assignment across all pages
for sub in client.assignments.submissions.list_all(assignment_id=456):
    # Each submission has a list of SubmissionFile objects
    file_ids = [f.id for f in sub.files]
    print(f"Submission {sub.id} — files: {file_ids}")
```

## Step 3: Create the Comment

To place a comment, create a `Comment` object and send it via the SDK.

```python
from codepost import Comment

comment = client.comments.create(
    Comment(
        file=file_id,
        text="This function could be optimized.",
        start_line=10,
        end_line=12,
        point_delta=-1,          # Optional: deduct 1 point
        rubric_comment=None,     # Optional: link to a rubric comment ID
    )
)
print(f"Comment created with ID: {comment.id}")
```

### Bulk Example: Commenting on All Submissions

```python
from codepost import Comment

for sub in client.assignments.submissions.list_all(assignment_id=456):
    for file in sub.files:
        # Example: flag files missing a docstring
        if file.data and not file.data.startswith('"""'):
            client.comments.create(
                Comment(
                    file=file.id,
                    text="Missing module docstring.",
                    start_line=1,
                    end_line=1,
                    point_delta=-1,
                )
            )
            print(f"Commented on {file.name} in submission {sub.id}")
```

## Note on Coordinates

- For **Text Files** (e.g., .py, .java, .txt):
  - `start_line` / `end_line`: Correspond to **line numbers** (1-indexed).
  - `start_char` / `end_char`: Correspond to character offsets within the line (0-indexed).

- For **Jupyter Notebooks** (.ipynb):
  - `start_line` / `end_line`: Correspond to the **Cell Index** (0-indexed).
  - `start_char` / `end_char`: Generally ignored or used for block offsets. Set to `0` to comment on the entire cell.
- **For Image/PDF Files**:
  - **Coordinates (x, y) are NOT currently supported.**
  - **PDFs**: `start_line` / `end_line` correspond to the **Page Number** (1-indexed).
  - **Images**: Treat as a single block. `start_line` / `end_line` are typically `1` (1-indexed).
  - `start_char` / `end_char` should be `0`.

See the [Backend API Docs](https://codepost-api.cs.rutgers.edu/api/schema/elements/) for more details on the `Comment` model.
