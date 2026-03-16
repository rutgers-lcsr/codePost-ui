# Build stage
FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies with clean install for reproducibility

# Using --legacy-peer-deps to for react-codemirror2 compatibility
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Build arguments for environment variables
# Default to a placeholder that nginx sub_filter replaces at runtime.
# For local dev (npm run dev), the .env / vite.config.ts default to localhost:8000.
ARG REACT_APP_API_URL=__CODEPOST_API_URL_PLACEHOLDER__
ARG REACT_APP_VERSION

# Set environment variables for build
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_VERSION=$REACT_APP_VERSION

# Build the application with Vite
RUN npm run build:production

# Production stage
FROM nginx:alpine AS production

# Copy custom nginx config template
COPY nginx.conf.template /etc/nginx/templates/nginx.conf.template

# Copy UI entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Copy built assets from build stage
COPY --from=build /app/build /usr/share/nginx/html

# Expose ports
EXPOSE 80
EXPOSE 443

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 -O /dev/null http://127.0.0.1:8080/health || exit 1

# Start via entrypoint (envsubst -> nginx)
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
