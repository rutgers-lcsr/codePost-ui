---
name: update-docs
description: Update the in-app user documentation (/docs pages) after UI or workflow changes, including regenerating the UI screenshots users see. Use when features changed and the docs or their images are stale, or when the user asks to refresh/update user-facing docs.
---

# Update the in-app user docs

The user-facing documentation lives in **`src/docs/content/*.md`** (served at `/docs/*`,
frontmatter: `key`/`path`/`title`/`category`/`order`) and references screenshots in
**`public/assets/docs/*.png`** (served at `/assets/docs/`). Both must stay in sync with
the shipped UI. There is also a repo-level instructor guide at
`../codePost/docs/assignment-lifecycle.md` — check it for the same staleness when the
assignment workflow changed.

## 1. Find what's stale

- Diff since docs were last touched:
  `git log --oneline -- src/docs/content/` → then
  `git log --oneline <last-docs-commit>..HEAD -- src/components src/features` for UI
  changes the docs don't know about.
- Grep the docs for retired concepts. Historical examples that WERE stale: boolean
  lifecycle fields (`isVisible`/`isReleased`/`feedbackReleased`/`liveFeedbackMode`),
  "Publish = release grades", settings placed on the wrong tab.
- **Verify settings-tab claims programmatically** — don't trust the docs' tables:
  map `name="<field>"` occurrences in
  `src/components/admin/assignments/assignments/AssignmentSettingsDialog.tsx`
  to their enclosing `label: '<Tab>'` entries.
- Read the current backend semantics in `../codePost-api/docs/assignment_lifecycle.md`
  (developer doc — source of truth for gates).

## 2. Update the markdown

- Keep frontmatter intact; don't rename `key`/`path` (routes link to them).
- Describe what users see (badges, buttons, tabs), not model internals; the API
  appendix in the FAQ may name fields.
- Cross-check every claim against the code — especially: which tab a setting is on,
  what a button actually does, what students can see in each state.
- Fact-check notification/email claims against `core/emails.py` +
  `USER_ACCESSIBLE_TEMPLATES` — docs have previously over-promised here.

## 3. Regenerate screenshots

The harness renders the real app against the seeded demo course:

- Manifest: **`e2e/docs/manifest.ts`** — one entry per image (auth role, route or
  API-resolved route, ready-selector, optional popover/tab interactions, optional
  element clip). Output goes straight to `public/assets/docs/`.
- Runner: `e2e/docs/capture.spec.ts` (Playwright project `docs`; fixed 1440×900 @2x,
  animations disabled, one test per image).

To run:

```bash
# Terminal 1 — backend with DEBUG (dev-auth login + seed commands require it)
cd ../codePost-api && ./start_dev.sh

# Terminal 2 — frontend dev server
npm run dev

# Terminal 3 — seed + capture (the `setup` dependency seeds and saves auth states)
npm run docs:screenshots
```

- The `setup` project runs `createtestusers`, `create_demo_course`, and
  `seed_test_quizzes`, then saves `e2e/.auth/{student,instructor}.json` via the
  DEBUG-only `/dev-auth/login-as/` endpoint.
- **Adding an image**: add a manifest entry, run the capture, then reference
  `/assets/docs/<file>` from the markdown. Prefer `data-testid` clip targets (add one
  to the component if needed — e.g. `rubric-panel`) over CSS-class selectors.
- **Review every regenerated PNG** (open a few) — a blank or half-loaded capture means
  the `readySelector` is wrong, not that the app is broken.
- `src/assets/docs/` is a decoy (its README says so) — images must land in
  `public/assets/docs/`.

## 4. Verify and ship

- `npx tsc --noEmit` and `npx vitest run` must stay green (the docs are plain markdown,
  but manifest/testid edits touch code).
- Boot the app and click through `/docs` for the changed pages — broken image links
  render as missing-image icons.
- Commit content + images together so a doc never references a screenshot state that
  isn't checked in. Repo convention: commit subjects are lowercase (commitlint).
- If the assignment workflow changed, mirror the story in
  `../codePost/docs/assignment-lifecycle.md` (instructor guide) and the API repo's
  CHANGELOG.
