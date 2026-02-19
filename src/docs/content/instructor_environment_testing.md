# Environment & Testing Ops

This page explains how to run assignment code reliably and use tests effectively.

## Auto-Run environments

Auto-Run executes student submissions and captures outputs for instructors/graders.

It is execution infrastructure, not scoring policy by itself.

- Use it to evaluate runtime behavior.
- Pair it with rubric + script-based tests for consistent grading.

## Environment setup checklist

1. Go to **Assignments > Environment Setup**.
2. Choose assignment language.
3. Configure build/run behavior (auto-detect or manual).
4. Attach required datasets/resources.
5. Validate with representative submissions.

### Dependency Management (Auto-Detect)

When using **Auto-Detect**, codePost looks for standard configuration files to install dependencies:

- **Python**: `requirements.txt` (installed via pip)
- **Node.js**: `package.json` (installed via npm)
- **Java**: `pom.xml` (Maven) or `build.gradle` (Gradle)

> [!TIP]
> Include these files in your **Starter Code** or upload them as **Instructor Resources** in the Environment settings to ensure they are present during the build.

## Environment shell

After environment setup, you can open an environment shell for troubleshooting:

- inspect filesystem and mounted resources
- run quick commands
- verify dependency/runtime assumptions

> [!NOTE]
> Environment shell sessions are short-lived. If a session expires, start a new one and re-run your checks.

## Testing workflow

1. Create/open a test category.
2. Select target file context.
3. Author script tests in builder or code mode.
4. Validate parse/preview.
5. Save and run.

For exact parser-compatible syntax, use [Testing Guide](/docs/testing-guide).

## Common troubleshooting patterns

### Missing module or dependency

- Confirm language/environment selection.
- Check dataset/resource mounts.
- Rebuild environment if configuration changed.

### Tests not appearing in preview

- Confirm syntax matches parser expectations.
- Ensure each test includes parseable `name` and `points`.
- Re-open preview after save.

### Output mismatch between runs

- Check whether cached outputs are being reused.
- Re-run submission/tests when policy allows.

### Timeouts and Memory Limits

- **Timeout**: Default is 30s. If your tests are heavy, increase the timeout in the Test Script (`timeout=60`) or optimize the student code.
- **OOM (Out of Memory)**: If a container dies unexpectedly, it may have exceeded the memory limit (default 512MB). Check for infinite loops or massive data structures in the student solution.

## Related docs

- [Testing Guide](/docs/testing-guide)
- [Instructor Overview](/docs/instructor)
- [Grader Guide](/docs/grader)
