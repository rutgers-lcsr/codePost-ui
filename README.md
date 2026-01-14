# codePost UI

This is the frontend for codePost, built with React.

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

## Production Build (Docker)

The UI is built as a static site and served via Nginx. The Docker build process handles this automatically.

### Important: Build Arguments

The API URL is **baked into the static build** at build time. You must provide the `REACT_APP_API_URL` build argument:

```bash
docker build \
  --build-arg REACT_APP_API_URL=https://codepost.cs.rutgers.edu \
  -t codepost-ui .
```

If you do not provide this, the UI may default to `localhost:8000`, which will fail for end users.

### Running with SSL

The production container uses Nginx and expects SSL certificates to be available. You usually mount these as a volume:

```bash
docker run -d \
  -p 80:80 -p 443:443 \
  -v /etc/letsencrypt/live/codepost.cs.rutgers.edu:/etc/ssl/certs \
  codepost-ui
```

See the `nginx.conf` file for the specific certificate path configuration.
# Admin Guide

This guide is for system administrators submitting or maintaining the codePost instance.

## Deployment

CodePost is typically deployed using Docker. Refer to the [Docker Setup](./DOCKER.md) guide for detailed instructions on building images and running containers.

## Configuration

System-level configuration is managed via environment variables.

### Key Variables

- `REACT_APP_API_URL` (or `VITE_API_URL`): The URL of the backend API.
- `REACT_APP_GA_ID`: Google Analytics ID.

## Maintenance

- **Backups**: Ensure your database is backed up regularly.
- **Updates**: Rebuild the Docker images when the codebase is updated.
- **Logs**: Monitor Docker logs for application errors.

## Troubleshooting

- **Build Failures**: Check node version compatibility (Node 18+ recommended).
- **Network Issues**: Ensure connectivity between the UI container and the API container/server.
