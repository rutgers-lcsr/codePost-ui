# Code Review Feature

This folder owns the **code-review** feature. All new imports should come from the feature boundary using the alias:

- `@code-review/*` → `src/features/code-review/*`

## What lives here

- `CodeConsole` and supporting panels/menus
- Execution UI + hooks (`execution/`, `hooks/`)
- Shared feature utilities (`codeConsoleUtils.ts`, `types.ts`)

## Import guidance

✅ Prefer:

- `import CodeConsole from '@code-review/CodeConsole'`
- `import { CURSOR_DOMAIN } from '@code-review/CodeConsoleEnums'`
- `import TestsList from '@code-review/code-panel/TestsList'`
- `import { useExecuteFileStreaming } from '@code-review/hooks'`

🚫 Avoid legacy paths (blocked by ESLint):

- `components/code-review/**`
- `hooks/useExecuteFile*`
- `utils/executeFileStreaming`
- `utils/execution`

## Notes

Legacy shim files may still exist temporarily for compatibility, but should be removed once all imports are migrated.
