# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in the codePost UI, please report it privately to **codepost@cs.rutgers.edu**.

Please do **not** open a public GitHub issue for security problems.

Include in your report:
- A description of the issue and its impact (XSS, CSRF bypass, leaked secrets, etc.).
- Steps to reproduce, or proof-of-concept code.
- Affected versions or deployments.

We will acknowledge your report within 3 business days and work with you on a coordinated disclosure timeline.

## Supported Versions

Only the `main` branch of this repository receives security updates.

## Scope

In-scope:
- This repository's source code and built artifacts.
- Default Vite/build configuration shipped here.

Out of scope:
- Vulnerabilities in third-party npm dependencies (please report upstream first).
- Backend-only issues — report those against [codePost-api](https://github.com/rutgers-lcsr/codePost-api/blob/main/SECURITY.md).
