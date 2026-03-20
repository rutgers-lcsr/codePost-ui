# codePost UI — Agent Guidelines

## Architecture

React 19 + TypeScript 5.9 SPA built with Vite 7, consuming the codePost Django API. Ant Design 6 is the primary UI library, Zustand for state management, React Router 7 for routing.

- **`src/api-client/`** — Auto-generated OpenAPI TypeScript-fetch client. **Never edit manually** — regenerated from the API's `schema.yaml` via `scripts/generate_ts_client.sh` in the API repo. Excluded from ESLint and TypeScript checking.
- **`src/services/`** — Class-based wrappers around generated API clients (`Course.list()`, `Assignment.read(id)`, etc.). Add new service methods here when extending API usage.
- **`src/stores/`** — Zustand stores with `devtools` middleware for complex feature state (code console, rubric).
- **`src/components/`** — Domain-organized components: `admin/`, `grader/`, `student/`, `organization/`, `core/` (shared), `pre-auth/`, `editors/`.
- **`src/features/`** — Feature modules with their own `components/`, `hooks/`, `types.ts`. Currently: `code-review/` (aliased as `@code-review/*`).
- **`src/theme/`** — Ant Design theme config and centralized color tokens in `colors.ts`.
- **`src/styles/`** — Global SCSS organized as `abstracts/`, `base/`, `components/`, `layout/`, `pages/`, `themes/`, `vendors/`.

## Code Style

- **Prettier**: Single quotes, trailing commas, 2-space indent, 120-char width, semicolons. Enforced via Husky + lint-staged on commit.
- **ESLint**: Flat config (`eslint.config.mjs`) with `typescript-eslint`, `react-hooks`, `react-refresh`, `prettier`. `@typescript-eslint/no-explicit-any` is a warning. Prefix unused vars with `_`.
- **TypeScript**: `strict: true`, `noUnusedLocals`, `noUnusedParameters`. Tests and `api-client/` excluded from checking.
- **Path aliases**: `@features/*` → `src/features/*`, `@code-review/*` → `src/features/code-review/*`.
- **Restricted imports**: ESLint blocks importing from `components/code-review/**` (use `@code-review/` alias instead) and certain execution hooks outside the feature boundary.
- **Components**: Functional components with hooks. Use Ant Design components primarily. Custom "CP" wrappers (`CPButton`, `CPTooltip`, `CPDropdown`) add codePost-specific behavior.
- **Styling**: Global SCSS + Ant Design theme tokens + inline styles. CSS Modules are rare. No Tailwind. All colors come from `src/theme/colors.ts`.

## Build and Test

```bash
# Install dependencies
npm ci

# Dev server (port 3000)
npm run dev

# Build (dev mode)
npm run build

# Build (production — 4GB heap)
npm run build:production

# Type check
npx tsc --noEmit

# Lint
npm run lint:fix

# Tests
npm test                    # vitest in watch mode
npx vitest run              # single run

# Bundle analysis
npm run analyze
```

## Project Conventions

- **Adding a new API endpoint**: After adding the endpoint in codePost-api, regenerate the client by running `./scripts/generate_ts_client.sh` from the API repo. Then create/update a service class in `src/services/` to wrap the generated API call.
- **New features**: Create a directory under `src/features/` with its own `components/`, `hooks/`, `types.ts`. Add a path alias in `tsconfig.json` and `vite.config.ts` if needed.
- **New shared components**: Add to `src/components/core/`. Follow the `CP` prefix naming pattern for wrapped Ant Design components (extend Ant Design props, pass through `...restProps`, add CP-specific CSS classes).
- **State management**: Use Zustand with `devtools` middleware for complex cross-component state. Use React Context for scoped data (e.g., `CourseContext`). Use local `useState` for component-private state. Auth state currently lives in `App.tsx` — no global auth store.
- **Code splitting**: Use `React.lazy()` + `<Suspense>` for major page-level views.
- **Colors**: Always import from `src/theme/colors.ts` — never use hardcoded hex values.
- **Types**: Import domain types from `src/types/models.ts` (re-exports from `api-client`), not directly from `src/api-client/models/`.
- **Error boundaries**: Class component `ErrorBoundary` in `src/components/core/ErrorBoundary.tsx`. Two variants: `'app'` (top-level) and `'codepanel'` (per-file in code review). New page-level views should be wrapped.
- **Tests**: Use `@testing-library/react` + `@testing-library/user-event`. Accessibility tests use `vitest-axe`. Test files go in `__tests__/` directories or co-locate as `*.test.tsx`.

## Important Gotchas

- **Never edit `src/api-client/`** — it's auto-generated with `@ts-nocheck`. Changes will be lost on next regeneration.
- **Auth state is not global** — auth lives in `App.tsx` `useState` and is passed as props. Token is in `localStorage('token')`. There is no Zustand/Context auth store.
- **`unauthorizedMiddleware` is one-shot** — uses a module-level `didHandleUnauthorized` flag. Once a 401 is handled, no further 401 handling occurs until page reload.
- **Context defaults use `id: -1`** — `CourseContext` provides a fully populated default `Course` with `id: -1` to signal "no course selected" without null checks.
- **Environment variables use CRA naming** — `REACT_APP_*` prefix (not Vite's `VITE_*`), injected via Vite `define` for backward compatibility.
- **Conditional routes** — routes only render if the user has the matching role (`isStudent`, `isGrader`, `isAdmin`). Don't assume a route exists for all users.
- **Feature boundary enforcement** — ESLint blocks imports from `components/code-review/**`. Use `@code-review/*` alias instead. Some hooks (execution-related) are restricted to the code-review feature.

## Integration Points

- **API connection**: Base URL from `REACT_APP_API_URL` env var (default `http://localhost:8000`). JWT token stored in `localStorage` key `'token'`. Unauthorized responses (401) auto-redirect to login via middleware.
- **Schema sync flow**: API `manage.py spectacular` → `schema.yaml` → `generate_ts_client.sh` → `src/api-client/` → commit generated code. Any API model/endpoint change requires this regeneration.
- **API client singletons**: All in `src/api-client/clients.ts` (e.g., `coursesApi`, `assignmentsApi`, `submissionsApi`). Import from there, not from individual API files.
- **Environment variables**: `REACT_APP_API_URL`, `REACT_APP_VERSION`, `REACT_APP_GA_ID`, `REACT_APP_OPTIMIZE_ID` — injected at build time via Vite `define`.

## Security

- JWT tokens in localStorage — accessed via `getAuthToken()` from `src/utils/auth.ts`.
- Never log or expose tokens in console output or error messages.
- The `unauthorizedMiddleware` in the API client handles 401 → logout flow automatically.
- CORS is handled by the API server (`django-cors-headers`); the UI does not need CORS config.
- Dev-only components (`AsyncDevTools`) render only when `NODE_ENV === 'development'` — never add dev tooling outside this guard.

## linting and Formatting

- Use oxlint for linting and Prettier for formatting. Run `npm run lint:fix` to automatically fix issues, and `npm test` to run tests with linting.
- oxlint rules are defined in .oxlintrc.json
