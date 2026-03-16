---
key: sdk-overview
path: sdk-overview
title: Overview
category: Python SDK
order: 14
---

# Python SDK

The codePost Python SDK lets you automate course management, submission uploads, grading, and feedback programmatically.

## Two Ways to Use the SDK

The SDK provides **two layers** — use whichever fits your needs:

### `codepost` — The Convenience Wrapper (Recommended)

A clean, hierarchical interface where resources are organized as you'd expect:

```python
from codepost import CodePost, Comment

client = CodePost(api_key="YOUR_API_KEY")

# Intuitive hierarchy
courses = client.courses.list()
subs = client.assignments.submissions.list(assignment_id=456)
client.comments.create(Comment(file=file_id, text="Nice work!", start_line=1, end_line=1))
```

**Use this when:** you want a simple, readable API for common tasks like managing courses, uploading submissions, adding comments, and exporting grades.

### `codepost_api_client` — The Full Client

The complete client with access to every API endpoint, including advanced ones (autograder, SSO, dashboard, system health, etc.):

```python
from codepost_api_client import ApiClient, Configuration
from codepost_api_client.api import AutograderApi

config = Configuration(host="https://codepost-api.cs.rutgers.edu")
config.api_key["tokenAuth"] = "YOUR_API_KEY"
config.api_key_prefix["tokenAuth"] = "Token"

with ApiClient(config) as api_client:
    autograder = AutograderApi(api_client)
    envs = autograder.autograder_environments_list()
```

**Use this when:** you need endpoints not covered by the wrapper (autograder, environments, test cases, SSO, system APIs) or want full control over request options.

## Quick Comparison

|                  | `codepost` (wrapper)                                                                                 | `codepost_api_client` (full client)                            |
| ---------------- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| **Import**       | `from codepost import CodePost`                                                                      | `from codepost_api_client import ApiClient, Configuration`     |
| **Auth setup**   | `CodePost(api_key="...")` or `CODEPOST_API_KEY` env var                                              | Manual `Configuration` + `ApiClient`                           |
| **Method style** | `client.courses.list()`                                                                              | `CoursesApi(client).courses_list()`                            |
| **Coverage**     | Courses, assignments, submissions, files, comments, rubric, sections, users, organizations, webhooks | All API endpoints including autograder, SSO, dashboard, system |
| **Models**       | Imported from `codepost` (re-exported)                                                               | Direct imports from `codepost_api_client`                      |

> **Note:** Both layers use the same model classes. In the wrapper, import everything from `codepost` for convenience.

## Installation

```bash
pip install git+https://github.com/rutgers-lcsr/codepost-python.git
```

## Authentication

Set your API key as an environment variable (recommended):

```bash
export CODEPOST_API_KEY="your-api-key-here"
```

```python
from codepost import CodePost
client = CodePost()  # reads from CODEPOST_API_KEY automatically
```

Or pass it directly:

```python
client = CodePost(api_key="your-api-key-here")
```

Get your API key from **Settings** in the codePost dashboard.

## Where to Find Full API Docs

Instead of duplicating a long API reference here, use the backend docs directly:

- **Swagger UI**: https://codepost-api.cs.rutgers.edu/api/schema/swagger-ui/
- **Elements (Spotlight-style docs)**: https://codepost-api.cs.rutgers.edu/api/schema/elements/

These are generated from the live OpenAPI schema and are the source of truth for endpoints, request/response shapes, and models.

## What's Next?

- [**Grading Workflow**](/docs/sdk-grading-workflow) — End-to-end guide: create assignment → upload submissions → comment → finalize → export grades.
- [**Programmatic Comments**](/docs/programmatic-comments) — Automate inline feedback on student code.
- [**Backend API Docs (Swagger + Elements)**](https://codepost-api.cs.rutgers.edu/api/schema/swagger-ui/) — Full endpoint and model reference.
