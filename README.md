# codePost UI

This is the frontend for codePost, built with React.

## Changelog

- See [`CHANGELOG.md`](./CHANGELOG.md) for product updates and release notes.

## Branching & Versioning

### Branches

| Branch        | Purpose                                                                                                             |
| ------------- | ------------------------------------------------------------------------------------------------------------------- |
| `development` | Default branch. All feature work and PRs target here. Pushes auto-deploy to the dev server.                         |
| `master`      | Production branch. Only receives merges from `release/*` and `hotfix/*` branches. Pushes auto-deploy to production. |
| `release/*`   | Cut from `development` when ready to release. Merged into `master` then backmerged to `development`.                |
| `hotfix/*`    | Cut from `master` for urgent production fixes. Merged into `master` then backmerged to `development`.               |

### Versioning

Versioning is fully automated via [semantic-release](https://semantic-release.gitbook.io/) and [Conventional Commits](https://www.conventionalcommits.org/).

- **You never manually edit the version** in `package.json` — semantic-release handles it.
- When a `feat:` or `fix:` commit merges into `master`, the release workflow automatically:
  1. Determines the next semver version from commit messages
  2. Bumps the version in `package.json`
  3. Updates `CHANGELOG.md`
  4. Creates a git tag (`v3.2.1`, `v3.3.0`, etc.)
  5. Creates a GitHub Release

### Commit Message Format

All commits must follow the [Conventional Commits](https://www.conventionalcommits.org/) format. This is enforced locally by a husky `commit-msg` hook and in CI on pull requests.

```
feat: add rubric drag-and-drop reordering  → minor bump (3.2.0 → 3.3.0)
fix: correct tooltip alignment on Safari   → patch bump (3.2.0 → 3.2.1)
feat!: redesign code review layout          → major bump (3.2.0 → 4.0.0)
chore: update dependencies                  → no release
docs: update component docs                 → no release
```

### Workflows

| Workflow                 | Trigger                                                     | What it does                                 |
| ------------------------ | ----------------------------------------------------------- | -------------------------------------------- |
| `test_codepost_ui.yml`   | Push/PR to `development`, `master`, `release/*`, `hotfix/*` | Lint, typecheck, tests                       |
| `release.yml`            | Push to `master`                                            | Auto-tag, changelog, GitHub Release          |
| `deploy_production.yml`  | Push to `master`                                            | Deploy to production server                  |
| `deploy_development.yml` | Push to `development`                                       | Deploy to dev server                         |
| `release-branch.yml`     | Manual trigger                                              | Create `release/*` branch from `development` |
| `hotfix-open.yml`        | Manual trigger                                              | Create `hotfix/*` branch from `master`       |
| `hotfix-backmerge.yml`   | Hotfix/release PR merged to `master`                        | Auto-create backmerge PR to `development`    |
| `update-api-client.yml`  | API release (auto) or manual trigger                        | Regenerate TypeScript API client             |

### Releasing

1. Go to **Actions → Create Release Branch** → Run workflow (optionally specify version)
2. A `release/X.Y.Z` branch is created and a PR opened targeting `master`
3. Do final testing on the release branch
4. Merge the PR — everything else is automatic

### Hotfixing Production

1. Go to **Actions → Open Hotfix Branch** → Run workflow with a description
2. A `hotfix/X.Y.Z` branch is created and a draft PR opened targeting `master`
3. Push your fix to the hotfix branch
4. Merge the PR — deployment, tagging, and backmerge to `development` are automatic

## Development Setup

1.  **Install Dependencies**:

    ```bash
    npm install
    # or
    yarn
    ```

2.  **Start Development Server**:
    ```bash
    npm start
    # or
    yarn start
    ```
    Runs on `http://localhost:3000`.

### Linting

This project uses **OxLint** (`.oxlintrc.json`) for linting — **not ESLint**. If you have the ESLint VS Code extension installed, it may report false positives or conflict with OxLint. Disable or uninstall the ESLint extension and use the [oxc](https://marketplace.visualstudio.com/items?itemName=nicolo-ribaudo.oxc) extension instead.

## Production deployment (Frontend VM)

This repo deploys the frontend as a static build served by Nginx over HTTPS.

### Required build-time environment

The API URL is baked into the static bundle at build time.

- Required: `REACT_APP_API_URL`

Example `.env` in `codePost-ui/`:

```ini
REACT_APP_API_URL=https://api.yourdomain.com
```

### TLS certificates

The frontend container expects cert files mounted into `/etc/ssl/certs`.

Required filenames:

- `fullchain.pem`
- `privkey.pem`

When using the provided compose file, place them in:

- `codePost-ui/certs/fullchain.pem`
- `codePost-ui/certs/privkey.pem`

### Deploy with docker-compose

From `codePost-ui/`:

```bash
docker-compose --env-file .env -f docker-compose.yml up -d --build
```

Current compose config exposes HTTPS on:

- `443:443`

### API integration expectations

- Ensure API is already deployed and reachable at `REACT_APP_API_URL`
- Backend deployment instructions are in `../codePost-api/README.md`

## Admin Guide

This guide is for system administrators submitting or maintaining the codePost instance.

## Deployment

CodePost UI is typically deployed on a dedicated Frontend VM using the `docker-compose.yml` in this repository.

## Configuration

System-level configuration is managed via environment variables.

### Key Variables

- `REACT_APP_API_URL`: The URL of the backend API.
- `REACT_APP_GA_ID`: Google Analytics ID.

## Maintenance

- **Backups**: Ensure your database is backed up regularly.
- **Updates**: Rebuild the Docker images when the codebase is updated.
- **Logs**: Monitor Docker logs for application errors.

## Troubleshooting

- **Build Failures**: Check node version compatibility (Node 18+ recommended).
- **Network Issues**: Ensure connectivity from frontend VM to the API host.
- **TLS Errors**: Verify cert filenames are exactly `fullchain.pem` and `privkey.pem`.

## Copy assignments across environments (local -> dev/staging)

If your source course is on local and destination is on another server, use:

```bash
npm run populate:cross-env-course -- --dry-run
```

The script is interactive by default (it prompts you for missing values and auth details).
Use `--non-interactive` if you want strict env-var only execution.

What gets copied per assignment:

- assignment settings
- assignment files
- assignment datasets
- autograder environment settings
- rubric categories/comments
- test categories/cases
- test resources (file/dataset mounts)

Required environment variables:

- `SOURCE_BASE_URL` (example: `http://localhost:8000/api`)
- `SOURCE_COURSE_ID` (example: `53`)
- `DEST_BASE_URL` (example: `https://dev-codepost-1.cs.rutgers.edu/api`)

Authentication variables (token-only):

- Source: `SOURCE_TOKEN`
- Destination: `DEST_TOKEN`

Destination selection:

- Set `DEST_COURSE_ID` to copy into an existing course
- If `DEST_COURSE_ID` is omitted, the script creates a new destination course

Example (your case: local course `53` -> `dev-codepost-1`):

```bash
export SOURCE_BASE_URL="http://localhost:8000/api"
export SOURCE_COURSE_ID="53"
export SOURCE_TOKEN="Token <local-api-token>"

export DEST_BASE_URL="https://dev-codepost-1.cs.rutgers.edu/api"
export DEST_TOKEN="Token <dev-api-token>"
# Optional: copy into existing destination course
# export DEST_COURSE_ID="123"

npm run populate:cross-env-course -- --dry-run
npm run populate:cross-env-course
```

Optional flags:

- `--only=Assignment 1,Assignment 2` (copy selected assignment names only)
- `--allow-duplicates` (copy even when destination already has same assignment name)

## License

This repository is licensed under the Rutgers Non-commercial License (RU-NCL).

See [`LICENSE`](./LICENSE) for the full terms.

## Terms of Service and issue tracking

- Terms of Service: [`TERMS_OF_SERVICE.md`](./TERMS_OF_SERVICE.md)
- License (full legal text): [`LICENSE`](./LICENSE)
- GitHub issues for tracking bugs/tasks: <https://github.com/rutgers-lcsr/codePost-ui/issues>

When opening an issue, include:

- clear title
- environment details (OS, browser, Node version, deployment mode)
- reproducible steps
- expected vs actual behavior
- logs/screenshots where relevant
