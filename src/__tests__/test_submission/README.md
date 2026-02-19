# Test Submission Compatibility Fixtures

This directory contains end-to-end submission fixtures for validating upload, rendering, execution, and autograding behavior across supported languages.

## Layout

- `test_submission/<language>/template/`
  - Starter ("shallow") versions of both script and notebook submissions.
- `test_submission/<language>/complete/`
  - Fully completed, working versions of both script and notebook submissions.
- `test_submission/<language>/existing_data.txt`
  - Shared input file used by both template and complete variants for file read checks.

Each completed submission exercises:

1. File I/O (read existing + write new file)
2. Module/package imports
3. Framework trigger logic via assertions
4. Visualization output for Python and R

Additionally, completed script/notebook variants now include explicit **code console rendering probes**:

- Structured stdout blocks (headers, unicode, table-like lines)
- At least one stderr line
- A generated markdown artifact (`render_preview.md`) in complete scripts

## Languages currently included

- `cpp` (`main.cpp`, `main.ipynb`)
- `java` (`Main.java`, `Main.ipynb`)
- `node` (`main.js`, `main.ipynb`)
- `php` (`main.php`, `main.ipynb`)
- `python` (`main.py`, `main.ipynb`)
- `r` (`main.R`, `main.ipynb`)
- `ruby` (`main.rb`, `main.ipynb`)

Notebooks are stored as JSON in `nbformat` v4.

## Student submission-process scenario coverage

Each language now also contains:

- `scenarios/multi_file_import/`
  - Simulates students uploading multiple source files with imports/requires/includes.
- `scenarios/nested_paths/`
  - Simulates students uploading nested folders (e.g., `src/` + `lib/`) and relative imports.
- `scenarios/failure_cases/`
  - Includes runtime error fixtures and syntax-error samples (stored as `*.txt`) for negative-path testing.

This structure is intended to validate realistic submission combinations encountered in:

- normal single-file uploads
- multi-file project uploads
- directory uploads / zip-expanded uploads
- expected failing submissions during the assignment lifecycle

An automated validator test is provided at:

- `src/__tests__/SubmissionProcessCompatibility.test.ts`

## Backend assignment + fake-submission seed workflow

To avoid manually creating one assignment per language in the backend, use the seed builder:

- Config file: `src/__tests__/test_submission/backend_seed_config.json`
- Builder script: `src/__tests__/test_submission/build_backend_seed_data.js`
- Generated payload: `src/__tests__/test_submission/backend_seed_data.json`

The generated payload contains, per language:

1. assignment metadata (name, environment language)
2. assignment template files (from `template/`) plus shared execution resources (e.g., `existing_data.txt`)
3. assignment datasets (shared execution resources mounted under `shared/`)
4. fake submissions for each scenario (`multi_file_import`, `nested_paths`, `failure_cases`)
5. a completed happy-path fake submission (from `complete/`)

Generate/update payload:

```bash
npm run build:test-submission-seeds
```

Automated integrity test for this payload builder:

- `src/__tests__/SubmissionBackendSeedData.test.ts`

## Create real backend data (visible in frontend)

After generating `backend_seed_data.json`, run the Django seeder in `codePost-api` to create actual assignments + fake submissions in a target course.

Management command:

- `core/management/commands/seed_submission_compatibility.py`

Example workflow:

```bash
# 1) Generate/refresh seed payload in codePost-ui
cd /staff/users/mk1800/Development/codePost-ui
npm run build:test-submission-seeds

# 2) Preview what would be created (no writes)
cd /staff/users/mk1800/Development/codePost-api
./.venv/bin/python manage.py seed_submission_compatibility --course-id <COURSE_ID> --dry-run

# 3) Create assignments + fake submissions in that course
./.venv/bin/python manage.py seed_submission_compatibility --course-id <COURSE_ID>

# 4) Recreate cleanly (delete same-name seeded assignments first)
./.venv/bin/python manage.py seed_submission_compatibility --course-id <COURSE_ID> --replace-existing
```

Useful flags:

- `--seed-file <path>` to use a non-default payload path
- `--languages python,node` to seed only selected languages
- `--replace-existing` to rebuild same-name seeded assignments
