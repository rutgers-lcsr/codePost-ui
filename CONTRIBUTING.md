# Contributing to codePost-ui

Thanks for your interest in contributing. This repository is the codePost frontend (React + Vite).

For ecosystem-wide setup (running api + ui + sdk together), see the hub repo: <https://github.com/rutgers-lcsr/codePost/blob/main/CONTRIBUTING.md>.

This file covers frontend-specific workflow.

## License

This project is source-available under the [Rutgers Non-Commercial License](./LICENSE). Contributions are accepted under the same terms. Every new source file must begin with:

```
// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
```

## Local setup

```bash
npm ci
cp .env.example .env            # then edit values for your backend
npm run dev                     # Vite dev server on :3000
```

Set `REACT_APP_API_URL` in `.env` to point at your backend (defaults to `http://localhost:8000` via `.env.development`).

## Tests

```bash
npm test
npm run build                   # type-check + production build
```

## Pull requests

- Branch from `main`. One concern per PR.
- Run `npm test` and `npm run build` locally before pushing.
- Match existing component style. Most components are class-based React with TypeScript; new code can use hooks.
- If you touch anything in `src/api-client/`, note that it is **generated** from the backend OpenAPI schema by `codePost-api/scripts/generate_ts_client.sh`. Source edits should happen in the backend, not here.

## Reporting bugs

Use GitHub Issues. For security vulnerabilities, follow [SECURITY.md](./SECURITY.md).

## Code of Conduct

This project follows the [Contributor Covenant](./CODE_OF_CONDUCT.md). By participating, you agree to abide by its terms.
