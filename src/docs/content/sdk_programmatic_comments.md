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

## Step 1: Initialize the Client

```python
import codepost_api_client as codepost

config = codepost.Configuration(
    host="https://codepost-api.cs.rutgers.edu",
    api_key={"tokenAuth": "Token YOUR_API_KEY"}
)

client = codepost.ApiClient(config)
files_api = codepost.FilesApi(client)
comments_api = codepost.CommentsApi(client)
```

## Step 2: Locate the File

You need the `id` of the file you want to comment on. You can find this by listing submissions and their files.

```python
# Assuming you have a file_id from a previous lookup
file_id = 12345 
```

## Step 3: Create the Comment

To place a comment, you create a `Comment` object and send it to the API.

```python
new_comment = codepost.Comment(
    file=file_id,
    path="main.py",          # Optional: useful if file object doesn't have path context
    start_point=10,          # Line number (1-indexed) or character offset
    end_point=12,            # End line/offset
    body="This function could be optimized.",
    rubric_comment=None      # Optional: ID of a rubric comment
)

try:
    created_comment = comments_api.comments_create(new_comment)
    print(f"Comment created with ID: {created_comment.id}")
except codepost.ApiException as e:
    print(f"Error creating comment: {e}")
```

## Note on Coordinates

- For **Text Files** (e.g., .py, .java, .txt):
  - `start_point` / `end_point`: Correspond to **line numbers** (1-indexed).
  - `start_char` / `end_char`: Correspond to character offsets within the line (0-indexed).

- For **Jupyter Notebooks** (.ipynb):
  - `start_point` / `end_point`: Correspond to the **Cell Index** (0-indexed).
  - `start_char` / `end_char`: Generally ignored or used for block offsets. Set to `0` to comment on the entire cell.
  
- **For Image/PDF Files**:
  - **Coordinates (x, y) are NOT currently supported.**
  - **PDFs**: `start_point` / `end_point` correspond to the **Page Number** (1-indexed).
  - **Images**: Treat as a single block. `start_point` / `end_point` are typically `1` (1-indexed).
  - `start_char` / `end_char` should be `0`.


See the [API Reference](https://codepost-api.cs.rutgers.edu/api/schema/elements/) for more details on the `Comment` model.
