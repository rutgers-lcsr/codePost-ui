# Instructor Shell Sessions (UI)

This panel lets instructors launch a short‑lived container based on the assignment environment image and run ad‑hoc commands.

## Where it appears

- Assignment → Tests → Environment Configuration (admin view)
- Section: **Instructor Shell (Environment Sandbox)**

## What it does

- Starts a container with assignment mounts and datasets.
- Runs shell commands on demand.
- Shows mounts, exit codes, and output.
- Stops the container and cleans staging data.

## API endpoints used

- `POST /autograder/environments/<id>/shell/start/`
- `POST /autograder/environments/<id>/shell/exec/`
- `POST /autograder/environments/<id>/shell/stop/`

## Notes

- Sessions are short‑lived (default 15 minutes).
- Only course admins can access these endpoints.
