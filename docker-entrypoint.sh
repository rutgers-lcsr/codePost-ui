#!/bin/sh
# Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial Licensed, included with this software.
set -e

# Origins allowed to embed this site in an iframe (CSP frame-ancestors).
# Default mirrors the API's core/middleware.py; override per-deployment.
: "${CSP_FRAME_ANCESTORS:="'self' https://*.cs.rutgers.edu"}"
export CSP_FRAME_ANCESTORS

# Substitute environment variables into the nginx config template.
# Only substitute our custom variables — leave nginx's own $variables intact.
envsubst '${NGINX_SERVER_NAME} ${REACT_APP_API_URL} ${CSP_FRAME_ANCESTORS}' \
  < /etc/nginx/templates/nginx.conf.template \
  > /etc/nginx/nginx.conf

# Copy SSL certs to a location readable by the nginx user (volume-mounted certs are typically root-owned)
if [ -f /etc/ssl/certs/fullchain.pem ]; then
  cp /etc/ssl/certs/fullchain.pem /etc/nginx/ssl-fullchain.pem
  cp /etc/ssl/certs/privkey.pem /etc/nginx/ssl-privkey.pem
  chown nginx:nginx /etc/nginx/ssl-fullchain.pem /etc/nginx/ssl-privkey.pem
  chmod 640 /etc/nginx/ssl-fullchain.pem /etc/nginx/ssl-privkey.pem
  # Update nginx config to use the copied certs
  sed -i 's|/etc/ssl/certs/fullchain.pem|/etc/nginx/ssl-fullchain.pem|g' /etc/nginx/nginx.conf
  sed -i 's|/etc/ssl/certs/privkey.pem|/etc/nginx/ssl-privkey.pem|g' /etc/nginx/nginx.conf
fi

echo "[entrypoint] NGINX_SERVER_NAME=${NGINX_SERVER_NAME:-localhost}"
echo "[entrypoint] REACT_APP_API_URL=${REACT_APP_API_URL:-__CODEPOST_API_URL_PLACEHOLDER__}"
echo "[entrypoint] CSP_FRAME_ANCESTORS=${CSP_FRAME_ANCESTORS}"
echo "[entrypoint] Nginx config generated. Starting nginx..."

# Ensure nginx user can write to runtime directories.
# The base nginx:alpine image symlinks log files to /dev/stdout and /dev/stderr,
# which aren't writable by non-root. Replace with real files.
rm -f /var/log/nginx/access.log /var/log/nginx/error.log
touch /var/log/nginx/access.log /var/log/nginx/error.log
chown -R nginx:nginx /var/log/nginx /var/cache/nginx
chown nginx:nginx /var/run/nginx.pid

# Drop to nginx user and exec the CMD
exec su-exec nginx "$@"
